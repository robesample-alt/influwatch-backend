"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — LegalHold
//
// listHolds(tenantId, status?)           — all holds, optional status filter
// createHold(tenantId, input)            — create a new legal hold
// releaseHold(tenantId, id, by, reason)  — set status RELEASED
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHolds = listHolds;
exports.createHold = createHold;
exports.releaseHold = releaseHold;
const tenantContext_1 = require("../utils/tenantContext");
// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────
/**
 * List all legal holds, newest first.
 * Optionally filtered by status (e.g. 'ACTIVE', 'RELEASED').
 */
async function listHolds(tenantId, status) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.legalHold.findMany({
            where: { tenantId, ...(status ? { status } : {}) },
            orderBy: { datePlaced: 'desc' },
        });
    });
}
/**
 * Create a new legal hold record.
 */
async function createHold(tenantId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.legalHold.create({
            data: {
                tenantId,
                holdName: input.holdName,
                holdType: input.holdType,
                scope: input.scope,
                recordsFrozen: input.recordsFrozen ?? 0,
                placedBy: input.placedBy,
                legalAuthority: input.legalAuthority,
                datePlaced: input.datePlaced ?? new Date(),
                basis: input.basis,
                status: input.status ?? 'ACTIVE',
            },
        });
    });
}
// ─────────────────────────────────────────
// RELEASE
// ─────────────────────────────────────────
/**
 * Release a legal hold by setting status to RELEASED
 * and recording who released it and why.
 * Returns null if the hold does not exist.
 */
async function releaseHold(tenantId, id, releasedBy, releaseReason) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const existing = await tx.legalHold.findFirst({ where: { id, tenantId } });
        if (!existing)
            return null;
        return tx.legalHold.update({
            where: { id },
            data: {
                status: 'RELEASED',
                releasedBy,
                releasedAt: new Date(),
                releaseReason,
            },
        });
    });
}
//# sourceMappingURL=legalHold.service.js.map