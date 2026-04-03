"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — TenantConfig
//
// getConfig(tenantId)          — returns config, creates with defaults if absent
// updateConfig(tenantId, input) — updates config with provided fields
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
const tenantContext_1 = require("../utils/tenantContext");
const DEFAULT_CONFIG = {
    pollIntervalMinutes: 60,
    historicalBackfillDays: 30,
    authErrorAlertThreshold: 3,
    gapReportThreshold: 2,
    postContractTailDays: 60,
    slaThresholdCritical: 24,
    slaThresholdHigh: 48,
    slaThresholdMedium: 120,
    slaThresholdLow: 240,
    retentionYears: 7,
    objectLockMode: 'COMPLIANCE',
};
// ─────────────────────────────────────────
// GET
// ─────────────────────────────────────────
/**
 * Return the tenant config row for the given tenantId.
 * If it doesn't exist, creates it with defaults so the
 * app always has a valid config to read.
 */
async function getConfig(tenantId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.tenantConfig.upsert({
            where: { tenantId },
            create: { tenantId, ...DEFAULT_CONFIG },
            update: {},
        });
    });
}
/**
 * Update the tenant config with the provided fields.
 * Only supplied fields are changed — all others are preserved.
 * Returns the full updated config record.
 */
async function updateConfig(tenantId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.tenantConfig.update({
            where: { tenantId },
            data: input,
        });
    });
}
//# sourceMappingURL=tenantConfig.service.js.map