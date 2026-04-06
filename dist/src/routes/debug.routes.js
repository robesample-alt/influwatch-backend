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