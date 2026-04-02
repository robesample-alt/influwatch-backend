"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — TenantConfig
//
// getConfig()    — returns TC-001, creates with defaults if absent
// updateConfig() — updates TC-001 with provided fields
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
const prisma_1 = __importDefault(require("../utils/prisma"));
const TENANT_ID = 'TC-001';
const DEFAULT_CONFIG = {
    firmName: 'Meridian Capital Partners',
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
 * Return the single tenant config row (TC-001).
 * If it doesn't exist, creates it with defaults so the
 * app always has a valid config to read.
 */
async function getConfig() {
    return prisma_1.default.tenantConfig.upsert({
        where: { id: TENANT_ID },
        create: { id: TENANT_ID, ...DEFAULT_CONFIG },
        update: {},
    });
}
/**
 * Update TC-001 with the provided fields.
 * Only supplied fields are changed — all others are preserved.
 * Returns the full updated config record.
 */
async function updateConfig(input) {
    return prisma_1.default.tenantConfig.update({
        where: { id: TENANT_ID },
        data: input,
    });
}
//# sourceMappingURL=tenantConfig.service.js.map