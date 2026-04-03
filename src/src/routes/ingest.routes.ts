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
import { ArchiveEventType }                         from '@prisma/client';

import { transcribeFile }                from '../services/transcription.service';
import * as ContentService               from '../services/contentRecord.service';

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────

const UPLOAD_DIR   = process.env.UPLOAD_DIR ?? './uploads';
const MAX_SIZE_MB  = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 25);
const MAX_SIZE_B   = MAX_SIZE_MB * 1024 * 1024;

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

      // ── Transcribe ─────────────────────────────────────
      let transcript: string;
      try {
        transcript = await transcribeFile(filePath);
      } catch (transcriptErr: any) {
        return res.status(422).json({
          error: `Transcription failed: ${transcriptErr.message}`,
        });
      }

      if (!transcript || transcript.length === 0) {
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
