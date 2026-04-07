"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Routes — Debug / Exposure Visibility
//
// Phase 2.5 — read-only inspection endpoint for the exposure
// engine output. Authenticated + tenant-scoped like all other
// routes. Does NOT change any live behavior.
//
// GET /api/influwatch/debug/exposure-summary
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
const tenantContext_1 = require("../utils/tenantContext");
const router = (0, express_1.Router)();
/**
 * GET /exposure-summary
 *
 * Returns a compact JSON payload with:
 *   - counts by exposureLevel
 *   - counts by compensationType
 *   - count of records requiring principal review
 *   - up to 5 sample records for each exposure level
 */
router.get('/exposure-summary', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            // All content records that have exposure data (created after Phase 2)
            const records = await tx.contentRecord.findMany({
                where: { tenantId, exposureLevel: { not: null } },
                select: {
                    id: true,
                    ambassadorId: true,
                    severity: true,
                    archiveStatus: true,
                    compensationPosture: true,
                    exposureLevel: true,
                    requiresPrincipalReview: true,
                    exposureReasonCodes: true,
                    exposureSummary: true,
                    compensationMismatchWithCampaign: true,
                    campaignConformanceSummary: true,
                    capturedAt: true,
                    ambassador: { select: { displayName: true } },
                },
                orderBy: { capturedAt: 'desc' },
            });
            // Fetch compensation structures for comp type counts
            const compStructs = await tx.compensationStructure.findMany({
                where: { tenantId },
                select: {
                    promoterId: true,
                    compensationType: true,
                    compensationBasis: true,
                    transactionalityClass: true,
                },
            });
            // Count by exposureLevel
            const byLevel = {};
            for (const r of records) {
                const lvl = r.exposureLevel || 'UNKNOWN';
                byLevel[lvl] = (byLevel[lvl] || 0) + 1;
            }
            // Count by compensationType
            const byCompType = {};
            for (const c of compStructs) {
                const t = c.compensationType || 'NULL';
                byCompType[t] = (byCompType[t] || 0) + 1;
            }
            // Count requiring principal review
            const principalCount = records.filter(r => r.requiresPrincipalReview === true).length;
            // Sample records by level — up to 5 each
            const levels = ['PRINCIPAL_REQUIRED', 'PRINCIPAL_EXCEPTION', 'REVIEWER_PLUS_SUPERVISOR', 'REVIEWER', 'NONE'];
            const samples = {};
            for (const lvl of levels) {
                samples[lvl] = records
                    .filter(r => r.exposureLevel === lvl)
                    .slice(0, 5)
                    .map(r => ({
                    id: r.id,
                    promoterName: r.ambassador?.displayName ?? r.ambassadorId,
                    severity: r.severity,
                    archiveStatus: r.archiveStatus,
                    exposureLevel: r.exposureLevel,
                    requiresPrincipalReview: r.requiresPrincipalReview,
                    exposureSummary: r.exposureSummary,
                    exposureReasonCodes: safeParseJson(r.exposureReasonCodes),
                }));
            }
            // Compensation structures summary
            const compSummary = compStructs.map(c => ({
                promoterId: c.promoterId,
                compensationType: c.compensationType,
                compensationBasis: c.compensationBasis,
                transactionalityClass: c.transactionalityClass,
            }));
            // Phase 3 — routing source counts
            const totalRecords = await tx.contentRecord.count({ where: { tenantId } });
            const exposureRoutedPrincipal = records.filter(r => r.requiresPrincipalReview === true).length;
            const legacyRecords = totalRecords - records.length;
            // Phase 5 — transactionality + campaign mismatch counts
            const byTxnClass = {};
            for (const c of compStructs) {
                const t = c.transactionalityClass || 'NULL';
                byTxnClass[t] = (byTxnClass[t] || 0) + 1;
            }
            const mismatchCount = records.filter(r => r.compensationMismatchWithCampaign === true).length;
            return {
                totalRecords,
                totalRecordsWithExposure: records.length,
                legacyRecordsWithoutExposure: legacyRecords,
                countByExposureLevel: byLevel,
                countByCompensationType: byCompType,
                countByTransactionalityClass: byTxnClass,
                principalReviewRequired: principalCount,
                campaignMismatchCount: mismatchCount,
                routing: {
                    exposureRoutedPrincipal,
                    legacyFallbackRecords: legacyRecords,
                    note: 'Records with null exposure use posture-based legacy routing. New records use exposure-based routing.',
                },
                samples,
                compensationStructures: compSummary,
            };
        });
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /principal-dashboard
 *
 * Returns everything the Desk Oversight screen needs in one call:
 *   - principal identity + license from logged-in actor
 *   - firm info from tenant
 *   - supervised promoters with risk tier + open counts
 *   - metrics: principal-required pending, escalations, total decisions
 *   - principal queue: records where requiresPrincipalReview=true
 */
router.get('/principal-dashboard', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const actorId = req.user.id;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            const [actor, tenant, promoters, principalRecords, allEscalated] = await Promise.all([
                // Logged-in actor with license fields
                tx.internalActor.findFirst({
                    where: { id: actorId, tenantId },
                }),
                // Firm info
                tx.tenant.findFirst({
                    where: { id: tenantId },
                    select: { firmName: true, crdNumber: true, secRegistration: true },
                }),
                // Promoters assigned to this actor
                tx.ambassadorProfile.findMany({
                    where: { assignedSupervisorId: actorId, tenantId },
                    select: {
                        id: true, displayName: true, handle: true,
                        primaryPlatform: true, riskTier: true, status: true,
                    },
                }),
                // Records requiring principal review (the queue)
                tx.contentRecord.findMany({
                    where: { tenantId, requiresPrincipalReview: true },
                    include: {
                        ambassador: { select: { displayName: true, handle: true, primaryPlatform: true } },
                        campaign: { select: { campaignName: true } },
                    },
                    orderBy: { capturedAt: 'desc' },
                    take: 50,
                }),
                // Total escalated count
                tx.contentRecord.count({
                    where: { tenantId, archiveStatus: 'ESCALATED' },
                }),
            ]);
            // Per-promoter open record counts
            const promoterIds = promoters.map(p => p.id);
            const openCounts = promoterIds.length > 0
                ? await tx.contentRecord.groupBy({
                    by: ['ambassadorId'],
                    where: {
                        tenantId,
                        ambassadorId: { in: promoterIds },
                        archiveStatus: { in: ['PENDING_REVIEW', 'ESCALATED'] },
                    },
                    _count: true,
                })
                : [];
            const openCountMap = {};
            for (const g of openCounts) {
                openCountMap[g.ambassadorId] = g._count;
            }
            // Enrich promoters with open count
            const enrichedPromoters = promoters.map(p => ({
                ...p,
                openRecordCount: openCountMap[p.id] || 0,
            }));
            // Queue records — shape for frontend
            const queue = principalRecords.map(r => ({
                id: r.id,
                promoterName: r.ambassador?.displayName ?? '—',
                promoterHandle: r.ambassador?.handle ?? '',
                platform: r.sourcePlatform,
                campaign: r.campaign?.campaignName ?? '—',
                severity: r.severity,
                archiveStatus: r.archiveStatus,
                exposureLevel: r.exposureLevel,
                requiresPrincipalReview: r.requiresPrincipalReview,
                exposureSummary: r.exposureSummary,
                exposureReasonCodes: safeParseJson(r.exposureReasonCodes),
                compensationMismatchWithCampaign: r.compensationMismatchWithCampaign,
                capturedAt: r.capturedAt,
            }));
            return {
                principal: actor ? {
                    id: actor.id,
                    displayName: actor.displayName,
                    email: actor.email,
                    role: actor.role,
                    seriesLicense: actor.seriesLicense,
                    crdNumber: actor.crdNumber,
                    licenseStatus: actor.licenseStatus,
                    licenseExpiryDate: actor.licenseExpiryDate,
                    supervisoryScope: actor.supervisoryScope,
                } : null,
                firm: tenant,
                promoters: enrichedPromoters,
                metrics: {
                    principalQueueCount: principalRecords.length,
                    escalationsOpen: allEscalated,
                    promotersSupervised: promoters.length,
                },
                queue,
            };
        });
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// ════════════════════════════════════════════════════════════════
// DEMO SIMULATOR ENDPOINTS
// ════════════════════════════════════════════════════════════════
const demoSimulator_1 = require("../lib/demoSimulator");
const ContentRecordService = __importStar(require("../services/contentRecord.service"));
const ruleRegistry_1 = require("../lib/ruleRegistry");
const llmDetection_1 = require("../lib/llmDetection");
const llmDetection_constants_1 = require("../lib/llmDetection.constants");
const requireRole_1 = require("../middleware/requireRole");
const client_1 = require("@prisma/client");
const findingCopy_1 = require("../constants/findingCopy");
const transcription_service_1 = require("../services/transcription.service");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
// Multer for scan video uploads — temp storage, cleaned up after transcription
const scanUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, os_1.default.tmpdir()),
        filename: (_req, file, cb) => cb(null, 'scan-' + Date.now() + path_1.default.extname(file.originalname)),
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('video/') && !file.mimetype.startsWith('audio/')) {
            return cb(new Error('Only video/audio files accepted'));
        }
        cb(null, true);
    },
});
let _autoIngestInterval = null;
let _autoIngestTenantId = null;
let _autoIngestToken = null;
let _autoIngestTenantType = null;
/**
 * POST /simulate-ingest
 *
 * Picks 1-3 random scenarios and creates real ContentRecords
 * through the full pipeline. Each record gets phrase detection,
 * LLM analysis, severity, exposure, referral code matching.
 */
router.post('/simulate-ingest', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const count = Math.min(Math.max(Number(req.query.count) || 2, 1), 5);
        const tenantTypeFilter = req.query.tenantType || undefined;
        const scenarios = (0, demoSimulator_1.pickRandomScenarios)(count, tenantTypeFilter);
        const results = [];
        for (const s of scenarios) {
            try {
                const record = await ContentRecordService.createContentRecord(tenantId, {
                    ambassadorId: s.ambassadorId,
                    sourcePlatform: s.sourcePlatform,
                    contentType: s.contentType,
                    sourceUrl: s.sourceUrl,
                    bodyText: s.bodyText,
                    campaignId: s.campaignId,
                });
                results.push({
                    id: record.id,
                    ambassadorId: s.ambassadorId,
                    severity: record.severity,
                    archiveStatus: record.archiveStatus,
                    exposureLevel: record.exposureLevel,
                    requiresPrincipalReview: record.requiresPrincipalReview,
                });
            }
            catch (err) {
                results.push({
                    ambassadorId: s.ambassadorId,
                    error: err.message || 'creation failed',
                });
            }
        }
        return res.json({ ingested: results.length, results });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /demo-reset
 *
 * Purges all content records, detection records, and event logs.
 * Keeps structural data (promoters, compensation, affiliate links,
 * actors, campaigns, tenant). Then ingests 12 starter records
 * through the full pipeline so the system has content immediately.
 */
router.post('/demo-reset', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            // Order matters — foreign key constraints
            await tx.detectionRecord.deleteMany({ where: { tenantId } });
            await tx.archiveEventLog.deleteMany({ where: { tenantId } });
            // Evidence exports reference content records
            await tx.evidenceExport.deleteMany({ where: { tenantId } });
            await tx.contentMediaAsset.deleteMany({ where: { tenantId } });
            await tx.contentRecord.deleteMany({ where: { tenantId } });
        });
        // Ingest starter batch through the real pipeline
        const resetTenantType = req.query.tenantType || undefined;
        const scenarios = (0, demoSimulator_1.pickRandomScenarios)(12, resetTenantType);
        const results = [];
        for (const s of scenarios) {
            try {
                const record = await ContentRecordService.createContentRecord(tenantId, {
                    ambassadorId: s.ambassadorId,
                    sourcePlatform: s.sourcePlatform,
                    contentType: s.contentType,
                    sourceUrl: s.sourceUrl,
                    bodyText: s.bodyText,
                    campaignId: s.campaignId,
                });
                results.push({ id: record.id, severity: record.severity });
            }
            catch (err) {
                results.push({ error: err.message });
            }
        }
        return res.json({
            purged: true,
            starterRecords: results.length,
            message: 'Demo environment reset. ' + results.length + ' starter records created through the full pipeline.',
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /simulate-start
 *
 * Starts auto-ingestion: every intervalMs (default 5 minutes),
 * picks 1-2 random scenarios and ingests them. Runs until
 * simulate-stop is called.
 */
router.post('/simulate-start', async (req, res) => {
    if (_autoIngestInterval) {
        return res.json({ running: true, message: 'Auto-ingest already running.' });
    }
    const tenantId = req.user.tenantId;
    const intervalMs = Math.max(Number(req.query.interval) || 300000, 60000); // min 1 minute, default 5 minutes
    _autoIngestTenantId = tenantId;
    _autoIngestTenantType = req.query.tenantType || null;
    const runOnce = async () => {
        if (!_autoIngestTenantId)
            return;
        try {
            const count = Math.random() < 0.5 ? 1 : 2;
            const scenarios = (0, demoSimulator_1.pickRandomScenarios)(count, _autoIngestTenantType || undefined);
            for (const s of scenarios) {
                try {
                    await ContentRecordService.createContentRecord(_autoIngestTenantId, {
                        ambassadorId: s.ambassadorId,
                        sourcePlatform: s.sourcePlatform,
                        contentType: s.contentType,
                        sourceUrl: s.sourceUrl,
                        bodyText: s.bodyText,
                        campaignId: s.campaignId,
                    });
                }
                catch { /* skip individual failures */ }
            }
        }
        catch { /* skip cycle failures */ }
    };
    _autoIngestInterval = setInterval(runOnce, intervalMs);
    return res.json({
        running: true,
        intervalMs,
        message: 'Auto-ingest started. ' + (intervalMs / 1000) + 's between cycles. POST /debug/simulate-stop to stop.',
    });
});
/**
 * POST /simulate-stop
 *
 * Stops the auto-ingest cycle.
 */
router.post('/simulate-stop', async (_req, res) => {
    if (_autoIngestInterval) {
        clearInterval(_autoIngestInterval);
        _autoIngestInterval = null;
        _autoIngestTenantId = null;
        return res.json({ running: false, message: 'Auto-ingest stopped.' });
    }
    return res.json({ running: false, message: 'Auto-ingest was not running.' });
});
/**
 * GET /simulate-status
 */
router.get('/simulate-status', async (_req, res) => {
    return res.json({ running: !!_autoIngestInterval });
});
// ════════════════════════════════════════════════════════════════
// RULE ENGINE — read-only rule metadata (no phrases exposed)
// ════════════════════════════════════════════════════════════════
/**
 * GET /rules
 *
 * Returns metadata for all detection rules (phrase + LLM).
 * NEVER returns actual phrase lists — only pattern counts.
 * Requires COMPLIANCE_OFFICER, REVIEWER, REGISTERED_PRINCIPAL,
 * DESIGNATED_SUPERVISOR, or TENANT_ADMIN role.
 */
router.get('/rules', (0, requireRole_1.requireRole)(client_1.InternalActorRole.COMPLIANCE_OFFICER, client_1.InternalActorRole.REVIEWER, client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.DESIGNATED_SUPERVISOR, client_1.InternalActorRole.TENANT_ADMIN), async (_req, res) => {
    // Phrase detection rules — metadata only, no phrases
    const phraseRules = (0, ruleRegistry_1.getRuleMetadata)();
    // LLM detection rules
    const llmRules = llmDetection_constants_1.LLM_RULE_CODES.map(code => ({
        code,
        name: llmDetection_constants_1.LLM_RULE_CODE_NAME[code],
        description: llmDetection_constants_1.LLM_RULE_CODE_CATEGORY[code],
        severity: llmDetection_constants_1.LLM_SEVERITY_CEILING[code],
        category: 'AI Semantic Detection',
        active: true,
        patternCount: 0, // LLM rules don't use phrase patterns
    }));
    return res.json({
        phraseRules,
        llmRules,
        totalPhraseRules: phraseRules.length,
        totalLlmRules: llmRules.length,
        totalPatternsMonitored: phraseRules.reduce((sum, r) => sum + r.patternCount, 0),
    });
});
// ════════════════════════════════════════════════════════════════
// COMPLIANCE SCAN — analyze content without creating records
// ════════════════════════════════════════════════════════════════
/**
 * POST /compliance-scan
 *
 * Accepts an array of content items (plain text), runs each through
 * the full detection pipeline (phrase + LLM), and returns findings
 * without creating any database records. No compensation context —
 * pure content analysis.
 *
 * Body: { items: [{ text: string, label?: string }] }
 * Max 10 items per request.
 */
router.post('/compliance-scan', async (req, res, next) => {
    try {
        const items = req.body.items || [];
        if (!items.length)
            return res.status(400).json({ error: 'items array is required' });
        if (items.length > 10)
            return res.status(400).json({ error: 'Maximum 10 items per scan' });
        const results = [];
        let totalFindings = 0;
        const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const text = (item.text || '').trim();
            if (!text) {
                results.push({ index: i, label: item.label || 'Item ' + (i + 1), skipped: true, reason: 'empty text' });
                continue;
            }
            // Phrase detection (no compensation context — content-only scan)
            const phraseHits = (0, ruleRegistry_1.detectRuleHits)(text);
            // LLM detection — always run for compliance scan (no posture gate)
            let llmFindings = [];
            try {
                const llmResult = await (0, llmDetection_1.runLlmDetection)({
                    bodyText: text,
                    supervisionPosture: 'UNKNOWN',
                    compensationForm: 'UNKNOWN',
                    isTransactionBased: false,
                    isSecurityLinked: false,
                });
                llmFindings = llmResult.findings || [];
            }
            catch { /* LLM failure — continue with phrase-only */ }
            // Combine all hits
            const allHits = [
                ...phraseHits.map(h => ({ ruleCode: h.ruleCode, severity: h.severity, matchedPhrase: h.matchedPhrase, source: 'phrase' })),
                ...llmFindings.map((f) => ({ ruleCode: f.ruleCode, severity: f.severity, matchedPhrase: f.matchedPhrase, explanation: f.explanation, source: 'llm' })),
            ];
            // Compute severity from all hits
            const severity = allHits.length > 0
                ? (0, ruleRegistry_1.computeSeverityFromHits)(allHits.map(h => ({ ...h, ruleName: '', detectionMethod: 'PHRASE_MATCH' })))
                : 'LOW';
            // Group findings into plain-English categories
            const grouped = (0, findingCopy_1.groupDetections)(allHits.map(h => ({
                ruleCode: h.ruleCode,
                severity: h.severity,
                matchedPhrase: h.matchedPhrase,
            })));
            severityCounts[severity] = (severityCounts[severity] || 0) + 1;
            totalFindings += grouped.length;
            results.push({
                index: i,
                label: item.label || 'Item ' + (i + 1),
                textPreview: text.length > 200 ? text.slice(0, 197) + '...' : text,
                severity,
                findingCount: grouped.length,
                findings: grouped,
                note: 'Compensation context not available — exposure analysis requires onboarding.',
            });
        }
        return res.json({
            scanned: results.length,
            totalFindings,
            severityCounts,
            results,
            disclaimer: 'This scan was performed without compensation structure context. Exposure level, principal routing, referral code detection, and campaign conformance are only available after the promoter is onboarded into InfluWatch.',
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /compliance-scan-video
 *
 * Accepts a video/audio file upload, transcribes via Whisper,
 * then runs the same compliance scan. No records created.
 * File is deleted after transcription.
 */
router.post('/compliance-scan-video', (req, res, next) => {
    scanUpload.single('file')(req, res, (err) => {
        if (err)
            return res.status(400).json({ error: err.message });
        next();
    });
}, async (req, res, next) => {
    const filePath = req.file?.path;
    if (!filePath)
        return res.status(400).json({ error: 'Video file is required' });
    try {
        // Transcribe
        let transcript;
        try {
            transcript = await (0, transcription_service_1.transcribeFile)(filePath);
        }
        catch (err) {
            return res.status(422).json({ error: 'Transcription failed: ' + (err.message || 'unknown') });
        }
        finally {
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch { /* cleanup */ }
        }
        if (!transcript || !transcript.trim()) {
            return res.status(422).json({ error: 'No speech detected in video' });
        }
        // Run the same scan logic as the text endpoint
        const phraseHits = (0, ruleRegistry_1.detectRuleHits)(transcript);
        let llmFindings = [];
        try {
            const llmResult = await (0, llmDetection_1.runLlmDetection)({
                bodyText: transcript,
                supervisionPosture: 'UNKNOWN',
                compensationForm: 'UNKNOWN',
                isTransactionBased: false,
                isSecurityLinked: false,
            });
            llmFindings = llmResult.findings || [];
        }
        catch { /* LLM failure */ }
        const allHits = [
            ...phraseHits.map(h => ({ ruleCode: h.ruleCode, severity: h.severity, matchedPhrase: h.matchedPhrase, source: 'phrase' })),
            ...llmFindings.map((f) => ({ ruleCode: f.ruleCode, severity: f.severity, matchedPhrase: f.matchedPhrase, explanation: f.explanation, source: 'llm' })),
        ];
        const severity = allHits.length > 0
            ? (0, ruleRegistry_1.computeSeverityFromHits)(allHits.map(h => ({ ...h, ruleName: '', detectionMethod: 'PHRASE_MATCH' })))
            : 'LOW';
        const grouped = (0, findingCopy_1.groupDetections)(allHits.map(h => ({
            ruleCode: h.ruleCode, severity: h.severity, matchedPhrase: h.matchedPhrase,
        })));
        return res.json({
            transcript,
            wordCount: transcript.split(/\s+/).filter(Boolean).length,
            severity,
            findingCount: grouped.length,
            findings: grouped,
            note: 'Compensation context not available — exposure analysis requires onboarding.',
            disclaimer: 'This scan was performed without compensation structure context. Exposure level, principal routing, referral code detection, and campaign conformance are only available after the promoter is onboarded into InfluWatch.',
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /compliance-scan-url
 *
 * Accepts a video URL, downloads + transcribes via Whisper,
 * then runs compliance analysis. No records created.
 *
 * Body: { url: string }
 */
router.post('/compliance-scan-url', async (req, res, next) => {
    try {
        const { url } = req.body;
        if (!url)
            return res.status(400).json({ error: 'url is required' });
        // Transcribe from URL
        const transcript = await (0, transcription_service_1.transcribeUrl)(url);
        if (!transcript) {
            return res.status(422).json({ error: 'Could not download or transcribe the video. The URL may be inaccessible or the format unsupported.' });
        }
        // Run detection
        const phraseHits = (0, ruleRegistry_1.detectRuleHits)(transcript);
        let llmFindings = [];
        try {
            const llmResult = await (0, llmDetection_1.runLlmDetection)({
                bodyText: transcript,
                supervisionPosture: 'UNKNOWN',
                compensationForm: 'UNKNOWN',
                isTransactionBased: false,
                isSecurityLinked: false,
            });
            llmFindings = llmResult.findings || [];
        }
        catch { /* LLM failure */ }
        const allHits = [
            ...phraseHits.map(h => ({ ruleCode: h.ruleCode, severity: h.severity, matchedPhrase: h.matchedPhrase, source: 'phrase' })),
            ...llmFindings.map((f) => ({ ruleCode: f.ruleCode, severity: f.severity, matchedPhrase: f.matchedPhrase, explanation: f.explanation, source: 'llm' })),
        ];
        const severity = allHits.length > 0
            ? (0, ruleRegistry_1.computeSeverityFromHits)(allHits.map(h => ({ ...h, ruleName: '', detectionMethod: 'PHRASE_MATCH' })))
            : 'LOW';
        const grouped = (0, findingCopy_1.groupDetections)(allHits.map(h => ({
            ruleCode: h.ruleCode, severity: h.severity, matchedPhrase: h.matchedPhrase,
        })));
        return res.json({
            sourceUrl: url,
            transcript,
            wordCount: transcript.split(/\s+/).filter(Boolean).length,
            severity,
            findingCount: grouped.length,
            findings: grouped,
            note: 'Compensation context not available — exposure analysis requires onboarding.',
            disclaimer: 'This scan was performed without compensation structure context. Exposure level, principal routing, referral code detection, and campaign conformance are only available after the promoter is onboarded into InfluWatch.',
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /compliance-scan-image
 *
 * Accepts a screenshot image upload. Sends it to Claude's vision
 * API to extract visible text + assess compliance. No records created.
 */
const imageUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, os_1.default.tmpdir()),
        filename: (_req, file, cb) => cb(null, 'scan-img-' + Date.now() + path_1.default.extname(file.originalname)),
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for images
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files accepted'));
        }
        cb(null, true);
    },
});
router.post('/compliance-scan-image', (req, res, next) => {
    imageUpload.single('file')(req, res, (err) => {
        if (err)
            return res.status(400).json({ error: err.message });
        next();
    });
}, async (req, res, next) => {
    const filePath = req.file?.path;
    if (!filePath)
        return res.status(400).json({ error: 'Image file is required' });
    try {
        // Read image as base64
        const imageBuffer = fs_1.default.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;
        // Clean up file immediately
        try {
            fs_1.default.unlinkSync(filePath);
        }
        catch { /* cleanup */ }
        // Send to Claude vision for compliance analysis
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured — image analysis unavailable' });
        }
        const client = new sdk_1.default({ apiKey });
        const visionResponse = await client.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 2000,
            temperature: 0,
            system: [
                'You are a FINRA compliance analyst reviewing a screenshot of a social media post from a compensated external promoter.',
                'The compensation structure is unknown — analyze based on content only.',
                '',
                'First, extract all visible text from the image (caption, hashtags, comments, bio text, overlaid text, etc.).',
                '',
                'Then analyze the extracted text for:',
                '(a) Solicitation language directing someone toward a specific investment transaction',
                '(b) Missing or inadequate compensation disclosure',
                '(c) Performance claims or guarantees',
                '(d) Urgency or pressure tactics',
                '(e) Misleading or unbalanced statements about risk or returns',
                '',
                'Return a JSON object with these fields:',
                '  extractedText: the full text extracted from the image',
                '  platform: the social media platform visible in the screenshot (TikTok, Instagram, YouTube, Twitter/X, or Unknown)',
                '  findings: array of { ruleCode (LLM-001 through LLM-005), severity (CRITICAL/HIGH/MEDIUM/LOW), matchedPhrase (verbatim from extracted text), explanation (one sentence for a CCO) }',
                '',
                'Return ONLY valid JSON. No markdown, no preamble.',
            ].join('\n'),
            messages: [{
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Image } },
                        { type: 'text', text: 'Analyze this social media post screenshot for compliance violations.' },
                    ],
                }],
        });
        // Parse Claude's response
        const textBlocks = visionResponse.content
            .filter((b) => b.type === 'text')
            .map(b => b.text);
        const rawText = textBlocks.join('\n').trim();
        let parsed;
        try {
            let jsonText = rawText;
            if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
            }
            parsed = JSON.parse(jsonText);
        }
        catch {
            return res.json({
                extractedText: rawText,
                platform: 'Unknown',
                severity: 'MEDIUM',
                findingCount: 0,
                findings: [],
                rawResponse: rawText,
                note: 'Claude returned a response but it could not be parsed as JSON. The extracted text is shown above.',
                disclaimer: 'This scan was performed without compensation structure context.',
            });
        }
        const extractedText = parsed.extractedText || '';
        const platform = parsed.platform || 'Unknown';
        const rawFindings = Array.isArray(parsed.findings) ? parsed.findings : [];
        // Group findings using the standard findingCopy pipeline
        const grouped = (0, findingCopy_1.groupDetections)(rawFindings.map((f) => ({
            ruleCode: f.ruleCode || 'LLM-005',
            severity: f.severity || 'MEDIUM',
            matchedPhrase: f.matchedPhrase || '',
        })));
        const severity = rawFindings.length > 0
            ? (0, ruleRegistry_1.computeSeverityFromHits)(rawFindings.map((f) => ({
                ruleCode: f.ruleCode || 'LLM-005',
                severity: f.severity || 'MEDIUM',
                matchedPhrase: f.matchedPhrase || '',
                ruleName: '',
                detectionMethod: 'LLM_ANALYSIS',
            })))
            : 'LOW';
        return res.json({
            extractedText,
            platform,
            severity,
            findingCount: grouped.length,
            findings: grouped,
            note: 'Compensation context not available — exposure analysis requires onboarding.',
            disclaimer: 'This scan was performed without compensation structure context. Exposure level, principal routing, referral code detection, and campaign conformance are only available after the promoter is onboarded into InfluWatch.',
        });
    }
    catch (err) {
        next(err);
    }
});
function safeParseJson(val) {
    if (!val)
        return [];
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
exports.default = router;
//# sourceMappingURL=debug.routes.js.map