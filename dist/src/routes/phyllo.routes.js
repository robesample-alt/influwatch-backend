"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Routes — Phyllo Integration
//
// POST /api/influwatch/phyllo/connect    — get SDK token for Connect widget (authenticated)
// POST /api/influwatch/phyllo/account    — store connected account ID (authenticated)
// POST /api/influwatch/phyllo/webhook    — receive Phyllo events (public, no JWT)
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
exports.phylloWebhookHandler = phylloWebhookHandler;
const express_1 = require("express");
const PhylloService = __importStar(require("../services/phyllo.service"));
const phylloMapper_1 = require("../lib/phylloMapper");
const contentRecord_service_1 = require("../services/contentRecord.service");
const transcription_service_1 = require("../services/transcription.service");
const tenantContext_1 = require("../utils/tenantContext");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// POST /phyllo/connect
//
// Returns an SDK token for the Phyllo Connect widget.
// The frontend uses this to let the promoter connect
// their social account.
//
// Body: { ambassadorId: string }
// ─────────────────────────────────────────
router.post('/connect', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { ambassadorId } = req.body;
        if (!ambassadorId) {
            return res.status(400).json({ error: 'ambassadorId is required' });
        }
        const result = await PhylloService.createSdkToken(tenantId, ambassadorId);
        return res.status(200).json({
            sdkToken: result.token,
            phylloUserId: result.phylloUserId,
            environment: process.env.PHYLLO_ENVIRONMENT || 'staging',
        });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /phyllo/account
//
// Called by the frontend after the Connect widget
// fires the accountConnected callback.
// Stores the Phyllo account ID on the ambassador.
//
// Body: { ambassadorId: string, phylloAccountId: string }
// ─────────────────────────────────────────
router.post('/account', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { ambassadorId, phylloAccountId } = req.body;
        if (!ambassadorId || !phylloAccountId) {
            return res.status(400).json({ error: 'ambassadorId and phylloAccountId are required' });
        }
        await PhylloService.linkPhylloAccount(tenantId, ambassadorId, phylloAccountId);
        return res.status(200).json({ ok: true, ambassadorId, phylloAccountId });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /phyllo/webhook
//
// Receives Phyllo webhook events.
// Public endpoint — no JWT required.
// Handles CONTENTS.ADDED events by fetching content
// and creating ContentRecords via the existing pipeline.
// ─────────────────────────────────────────
async function phylloWebhookHandler(req, res) {
    try {
        const event = req.body;
        logger_1.default.info({ event: event.event, accountId: event.account_id }, 'Phyllo webhook received');
        // Only process content events
        if (!event.event || !event.event.startsWith('CONTENTS.')) {
            return res.status(200).json({ ok: true, skipped: true });
        }
        const phylloAccountId = event.account_id;
        if (!phylloAccountId) {
            logger_1.default.warn('Phyllo webhook missing account_id');
            return res.status(200).json({ ok: true, skipped: true });
        }
        // Find the ambassador linked to this Phyllo account
        const ambassador = await PhylloService.findAmbassadorByPhylloAccount(phylloAccountId);
        if (!ambassador) {
            logger_1.default.warn({ phylloAccountId }, 'Phyllo webhook — no ambassador found for account');
            return res.status(200).json({ ok: true, skipped: true });
        }
        // Fetch the actual content from Phyllo
        const contents = await PhylloService.fetchPhylloContent(phylloAccountId);
        let ingested = 0;
        for (const phylloItem of contents) {
            const { record, assets } = (0, phylloMapper_1.mapPhylloContent)(phylloItem, ambassador.id);
            try {
                // Create content record via existing pipeline (detection, severity, audit)
                const created = await (0, contentRecord_service_1.createContentRecord)(ambassador.tenantId, record);
                // Attach media assets
                for (const asset of assets) {
                    await (0, contentRecord_service_1.attachMediaAsset)(ambassador.tenantId, created.id, asset);
                }
                // Auto-transcribe video content
                const isVideo = ['VIDEO', 'SHORT_FORM_VIDEO', 'REEL', 'LIVE_STREAM'].includes(record.contentType);
                const mediaUrl = phylloItem.media_url;
                if (isVideo && mediaUrl) {
                    try {
                        const transcript = await (0, transcription_service_1.transcribeUrl)(mediaUrl);
                        if (transcript) {
                            await (0, tenantContext_1.withTenantContext)({ tenantId: ambassador.tenantId }, async (tx) => {
                                await tx.contentRecord.update({
                                    where: { id: created.id },
                                    data: { transcriptText: transcript },
                                });
                            });
                            await (0, contentRecord_service_1.attachMediaAsset)(ambassador.tenantId, created.id, {
                                assetType: 'TRANSCRIPT_FILE',
                                assetUrl: `transcript://${created.id}`,
                                mimeType: 'text/plain',
                            });
                            logger_1.default.info({ recordId: created.id }, 'Video auto-transcribed via Whisper');
                        }
                    }
                    catch (transcribeErr) {
                        logger_1.default.warn({ recordId: created.id, err: transcribeErr }, 'Video transcription failed — record saved without transcript');
                    }
                }
                // Log ingestion event
                await (0, contentRecord_service_1.appendEvent)(ambassador.tenantId, {
                    contentRecordId: created.id,
                    eventType: 'RECORD_CREATED',
                    eventNote: `Auto-ingested via Phyllo from ${record.sourcePlatform} — ${record.sourceUrl}${isVideo && mediaUrl ? ' (video transcription attempted)' : ''}`,
                    actorId: 'PHYLLO',
                });
                ingested++;
            }
            catch (err) {
                // Skip duplicates (checksum match) silently
                if (err.message?.includes('checksum')) {
                    logger_1.default.debug({ externalId: phylloItem.external_id }, 'Phyllo content skipped — duplicate');
                }
                else {
                    logger_1.default.error({ err, externalId: phylloItem.external_id }, 'Failed to ingest Phyllo content');
                }
            }
        }
        logger_1.default.info({ phylloAccountId, ingested, total: contents.length }, 'Phyllo webhook processed');
        return res.status(200).json({ ok: true, ingested });
    }
    catch (err) {
        logger_1.default.error({ err }, 'Phyllo webhook handler error');
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}
exports.default = router;
//# sourceMappingURL=phyllo.routes.js.map