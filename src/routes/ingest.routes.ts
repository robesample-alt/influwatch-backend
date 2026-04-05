// ============================================================
// FUNDUREX — INFLUWATCH PHASE 2
// Routes — Video Ingest
//
// POST /api/influwatch/ingest/video
//   Accepts a multipart video upload, transcribes it via
//   OpenAI Whisper, creates a ContentRecord through the
//   existing detection pipeline, and returns the record.
//
// Evidence chain written to ArchiveEventLog:
//   RECORD_CREATED  — standard content record creation
//   NOTE_ADDED      — transcript generated (word count, model)
//   STATUS_CHANGED  — auto-flagged (if detection hits found)
//   MEDIA_ATTACHED  — video file linked to record
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import multer                                       from 'multer';
import path                                         from 'path';
import fs                                           from 'fs';
import { execFile }                                 from 'child_process';
import { promisify }                                from 'util';
import { ArchiveEventType }                         from '@prisma/client';

import { transcribeFile }                from '../services/transcription.service';
import * as ContentService               from '../services/contentRecord.service';
import logger                            from '../utils/logger';

const execFileAsync = promisify(execFile);

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';

// Whisper API hard-caps uploads at 25 MB. Clamp MAX_UPLOAD_SIZE_MB so a
// misconfigured env var can never let multer accept a file Whisper will
// reject — that used to produce a confusing 422 late in the pipeline.
const WHISPER_MAX_MB = 25;
const _envMaxMb      = Number(process.env.MAX_UPLOAD_SIZE_MB ?? WHISPER_MAX_MB);
const MAX_SIZE_MB    = Math.min(Number.isFinite(_envMaxMb) && _envMaxMb > 0 ? _envMaxMb : WHISPER_MAX_MB, WHISPER_MAX_MB);
const MAX_SIZE_B     = MAX_SIZE_MB * 1024 * 1024;

if (_envMaxMb > WHISPER_MAX_MB) {
  logger.warn(
    { envValue: _envMaxMb, effective: MAX_SIZE_MB },
    'MAX_UPLOAD_SIZE_MB exceeds Whisper API hard limit — clamped',
  );
}

// ─────────────────────────────────────────
// File-integrity helpers
// ─────────────────────────────────────────

/**
 * Reject files whose first bytes don't look like a recognized video
 * container. Catches zero-byte, truncated-at-the-header, or totally
 * corrupt uploads before we waste a Whisper call on them.
 *
 * Recognized magic bytes:
 *   MP4 / MOV / M4V — offset 4: "ftyp"
 *   WebM / MKV      — offset 0: 0x1A 0x45 0xDF 0xA3
 *   AVI             — offset 0: "RIFF" + offset 8: "AVI "
 *   FLV             — offset 0: "FLV"
 */
function assertLooksLikeVideo(filePath: string): void {
  const fd  = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(16);
  try {
    const n = fs.readSync(fd, buf, 0, 16, 0);
    if (n < 12) throw new Error('File is too small to be a valid video');

    const isMp4  = buf.subarray(4, 8).toString('ascii') === 'ftyp';
    const isMkv  = buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3;
    const isAvi  = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'AVI ';
    const isFlv  = buf.subarray(0, 3).toString('ascii') === 'FLV';

    if (!isMp4 && !isMkv && !isAvi && !isFlv) {
      throw new Error('Uploaded file does not have a recognized video signature — the upload may have been truncated or the format is unsupported');
    }
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Best-effort duration probe via ffprobe. Returns null if ffprobe is not
 * installed on the host (Render's default Nixpacks image doesn't ship it)
 * or if the probe fails for any reason. Logged for diagnostics, never
 * throws — purely informational so future truncation incidents are
 * visible in structured logs alongside the transcript length.
 */
async function probeDurationSeconds(filePath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ], { timeout: 10_000 });
    const secs = parseFloat(stdout.trim());
    return Number.isFinite(secs) ? secs : null;
  } catch {
    return null;
  }
}

/**
 * Best-effort file cleanup — swallows ENOENT and other unlink errors
 * so the caller's error handling isn't derailed by cleanup noise.
 */
function safeUnlink(filePath: string | undefined | null): void {
  if (!filePath) return;
  try { fs.unlinkSync(filePath); } catch { /* already gone */ }
}

// Ensure the upload directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─────────────────────────────────────────
// Multer — disk storage
// ─────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ts  = Date.now();
    const rnd = Math.random().toString(36).slice(2, 8);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${ts}-${rnd}${ext}`);
  },
});

const upload = multer({
  storage,
  limits:     { fileSize: MAX_SIZE_B },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error(`Invalid file type "${file.mimetype}" — only video files are accepted`));
    }
    cb(null, true);
  },
});

// ─────────────────────────────────────────
// Router
// ─────────────────────────────────────────

const router = Router();

// ─────────────────────────────────────────
// POST /video
// ─────────────────────────────────────────

router.post(
  '/video',

  // Run multer inline so we can return typed error responses
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: `File too large — maximum size is ${MAX_SIZE_MB}MB`,
          });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        // fileFilter rejection (wrong MIME type)
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const { ambassadorId, platform } = req.body;
      const actorId = (req as any).user?.id ?? 'SYSTEM';

      // ── Validation ─────────────────────────────────────
      if (!ambassadorId) {
        return res.status(400).json({ error: 'ambassadorId is required' });
      }
      if (!platform) {
        return res.status(400).json({ error: 'platform is required' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'video file is required' });
      }
      if (req.file.size === 0) {
        return res.status(400).json({ error: 'Uploaded file is empty' });
      }

      const filePath  = req.file.path;
      const servedUrl = `/uploads/${req.file.filename}`;

      // ── Magic-byte sanity check ─────────────────────────
      // Reject obviously-corrupt or truncated-at-header uploads BEFORE
      // we pay for a Whisper call and end up with a partial transcript.
      try {
        assertLooksLikeVideo(filePath);
      } catch (sigErr: any) {
        safeUnlink(filePath);
        return res.status(400).json({ error: sigErr.message });
      }

      // ── Best-effort duration probe ─────────────────────
      // Purely diagnostic — ffprobe is not guaranteed to exist on the
      // host (Render Nixpacks default image doesn't ship it). If it
      // runs, we log duration alongside file size so future truncation
      // incidents are visible in structured logs.
      const durationSecs = await probeDurationSeconds(filePath);
      logger.info(
        { recordFile: req.file.filename, sizeBytes: req.file.size, durationSecs },
        'Manual video ingest — file accepted, transcribing',
      );

      // ── Transcribe ─────────────────────────────────────
      let transcript: string;
      try {
        transcript = await transcribeFile(filePath);
      } catch (transcriptErr: any) {
        logger.warn(
          { file: req.file.filename, sizeBytes: req.file.size, durationSecs, err: transcriptErr?.message },
          'Whisper transcription failed',
        );
        safeUnlink(filePath);
        return res.status(422).json({
          error: `Transcription failed: ${transcriptErr.message}`,
        });
      }

      if (!transcript || transcript.length === 0) {
        safeUnlink(filePath);
        return res.status(422).json({
          error: 'Transcription produced no output — no speech detected in video',
        });
      }

      // ── Create content record (runs full detection pipeline) ──
      const record = await ContentService.createContentRecord(tenantId, {
        ambassadorId,
        sourcePlatform:  platform as any,
        contentType:     'VIDEO',
        sourceUrl:       servedUrl,
        bodyText:        transcript,
        transcriptText:  transcript,
      });

      // ── Evidence chain: transcript generated ───────────
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;
      await ContentService.appendEvent(tenantId, {
        contentRecordId: record.id,
        eventType:       ArchiveEventType.NOTE_ADDED,
        eventNote:
          `Transcript generated via OpenAI Whisper (model: whisper-1) — ` +
          `${wordCount} words, ${transcript.length} chars. ` +
          `Transcript fed to compliance detection engine as bodyText.`,
        actorId,
      });

      // ── Attach video as media asset ─────────────────────
      await ContentService.attachMediaAsset(tenantId, record.id, {
        assetType: 'VIDEO_FILE',
        assetUrl:  servedUrl,
        mimeType:  req.file.mimetype,
      });

      return res.status(201).json(record);

    } catch (err: any) {
      // Any failure after the file is on disk leaves an orphan in
      // UPLOAD_DIR — clean it up so we don't accumulate cruft.
      safeUnlink(req.file?.path);

      if (err?.code === 'P2003') {
        return res.status(404).json({
          error:        'Ambassador not found',
          ambassadorId: req.body.ambassadorId,
        });
      }
      next(err);
    }
  },
);

export default router;
