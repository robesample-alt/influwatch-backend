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
let _autoIngestInterval = null;
let _autoIngestTenantId = null;
let _autoIngestToken = null;
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
        const scenarios = (0, demoSimulator_1.pickRandomScenarios)(count);
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
        const scenarios = (0, demoSimulator_1.pickRandomScenarios)(12);
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
    const runOnce = async () => {
        if (!_autoIngestTenantId)
            return;
        try {
            const count = Math.random() < 0.5 ? 1 : 2;
            const scenarios = (0, demoSimulator_1.pickRandomScenarios)(count);
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