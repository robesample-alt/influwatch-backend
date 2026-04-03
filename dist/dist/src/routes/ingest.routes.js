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
const client_1 = require("@prisma/client");
const transcription_service_1 = require("../services/transcription.service");
const ContentService = __importStar(require("../services/contentRecord.service"));
// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
const MAX_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 25);
const MAX_SIZE_B = MAX_SIZE_MB * 1024 * 1024;
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
        // ── Transcribe ─────────────────────────────────────
        let transcript;
        try {
            transcript = await (0, transcription_service_1.transcribeFile)(filePath);
        }
        catch (transcriptErr) {
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