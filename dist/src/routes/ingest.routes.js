"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const client_1 = require("@prisma/client");
const transcription_service_1 = require("../services/transcription.service");
const ContentService = __importStar(require("../services/contentRecord.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
// Whisper API hard-caps uploads at 25 MB. Clamp MAX_UPLOAD_SIZE_MB so a
// misconfigured env var can never let multer accept a file Whisper will
// reject — that used to produce a confusing 422 late in the pipeline.
const WHISPER_MAX_MB = 25;
const _envMaxMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? WHISPER_MAX_MB);
const MAX_SIZE_MB = Math.min(Number.isFinite(_envMaxMb) && _envMaxMb > 0 ? _envMaxMb : WHISPER_MAX_MB, WHISPER_MAX_MB);
const MAX_SIZE_B = MAX_SIZE_MB * 1024 * 1024;
if (_envMaxMb > WHISPER_MAX_MB) {
    logger_1.default.warn({ envValue: _envMaxMb, effective: MAX_SIZE_MB }, 'MAX_UPLOAD_SIZE_MB exceeds Whisper API hard limit — clamped');
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
function assertLooksLikeVideo(filePath) {
    const fd = fs_1.default.openSync(filePath, 'r');
    const buf = Buffer.alloc(16);
    try {
        const n = fs_1.default.readSync(fd, buf, 0, 16, 0);
        if (n < 12)
            throw new Error('File is too small to be a valid video');
        const isMp4 = buf.subarray(4, 8).toString('ascii') === 'ftyp';
        const isMkv = buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3;
        const isAvi = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'AVI ';
        const isFlv = buf.subarray(0, 3).toString('ascii') === 'FLV';
        if (!isMp4 && !isMkv && !isAvi && !isFlv) {
            throw new Error('Uploaded file does not have a recognized video signature — the upload may have been truncated or the format is unsupported');
        }
    }
    finally {
        fs_1.default.closeSync(fd);
    }
}
/**
 * Best-effort duration probe via ffprobe. Returns null if ffprobe is not
 * installed on the host (Render's default Nixpacks image doesn't ship it)
 * or if the probe fails for any reason. Logged for diagnostics, never
 * throws — purely informational so future truncation incidents are
 * visible in structured logs alongside the transcript length.
 */
async function probeDurationSeconds(filePath) {
    try {
        const { stdout } = await execFileAsync('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            filePath,
        ], { timeout: 10000 });
        const secs = parseFloat(stdout.trim());
        return Number.isFinite(secs) ? secs : null;
    }
    catch {
        return null;
    }
}
/**
 * Best-effort file cleanup — swallows ENOENT and other unlink errors
 * so the caller's error handling isn't derailed by cleanup noise.
 */
function safeUnlink(filePath) {
    if (!filePath)
        return;
    try {
        fs_1.default.unlinkSync(filePath);
    }
    catch { /* already gone */ }
}
// Ensure the upload directory exists at startup
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// ─────────────────────────────────────────
// Multer — disk storage
// ─────────────────────────────────────────
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ts = Date.now();
        const rnd = Math.random().toString(36).slice(2, 8);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${ts}-${rnd}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_SIZE_B },
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
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// POST /video
// ─────────────────────────────────────────
router.post('/video', 
// Run multer inline so we can return typed error responses
(req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
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
}, async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { ambassadorId, platform } = req.body;
        const actorId = req.user?.id ?? 'SYSTEM';
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
        const filePath = req.file.path;
        const servedUrl = `/uploads/${req.file.filename}`;
        // ── Magic-byte sanity check ─────────────────────────
        // Reject obviously-corrupt or truncated-at-header uploads BEFORE
        // we pay for a Whisper call and end up with a partial transcript.
        try {
            assertLooksLikeVideo(filePath);
        }
        catch (sigErr) {
            safeUnlink(filePath);
            return res.status(400).json({ error: sigErr.message });
        }
        // ── Best-effort duration probe ─────────────────────
        // Purely diagnostic — ffprobe is not guaranteed to exist on the
        // host (Render Nixpacks default image doesn't ship it). If it
        // runs, we log duration alongside file size so future truncation
        // incidents are visible in structured logs.
        const durationSecs = await probeDurationSeconds(filePath);
        logger_1.default.info({ recordFile: req.file.filename, sizeBytes: req.file.size, durationSecs }, 'Manual video ingest — file accepted, transcribing');
        // ── Transcribe ─────────────────────────────────────
        let transcript;
        try {
            transcript = await (0, transcription_service_1.transcribeFile)(filePath);
        }
        catch (transcriptErr) {
            logger_1.default.warn({ file: req.file.filename, sizeBytes: req.file.size, durationSecs, err: transcriptErr?.message }, 'Whisper transcription failed');
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
            sourcePlatform: platform,
            contentType: 'VIDEO',
            sourceUrl: servedUrl,
            bodyText: transcript,
            transcriptText: transcript,
        });
        // ── Evidence chain: transcript generated ───────────
        const wordCount = transcript.split(/\s+/).filter(Boolean).length;
        await ContentService.appendEvent(tenantId, {
            contentRecordId: record.id,
            eventType: client_1.ArchiveEventType.NOTE_ADDED,
            eventNote: `Transcript generated via OpenAI Whisper (model: whisper-1) — ` +
                `${wordCount} words, ${transcript.length} chars. ` +
                `Transcript fed to compliance detection engine as bodyText.`,
            actorId,
        });
        // ── Attach video as media asset ─────────────────────
        await ContentService.attachMediaAsset(tenantId, record.id, {
            assetType: 'VIDEO_FILE',
            assetUrl: servedUrl,
            mimeType: req.file.mimetype,
        });
        return res.status(201).json(record);
    }
    catch (err) {
        // Any failure after the file is on disk leaves an orphan in
        // UPLOAD_DIR — clean it up so we don't accumulate cruft.
        safeUnlink(req.file?.path);
        if (err?.code === 'P2003') {
            return res.status(404).json({
                error: 'Ambassador not found',
                ambassadorId: req.body.ambassadorId,
            });
        }
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=ingest.routes.js.map