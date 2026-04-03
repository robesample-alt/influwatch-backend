"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — TailPeriod
//
// listTailPeriods(tenantId, status?)  — list all, optional status filter
// createTailPeriod(tenantId, input)   — create a new tail period
// closeTailPeriod(tenantId, id, ...)  — close an active tail period
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTailPeriods = listTailPeriods;
exports.createTailPeriod = createTailPeriod;
exports.closeTailPeriod = closeTailPeriod;
const tenantContext_1 = require("../utils/tenantContext");
const ambassadorSelect = {
    id: true,
    displayName: true,
    handle: true,
    riskTier: true,
    status: true,
};
// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────
/**
 * List all tail periods, newest first.
 * Optionally filter by status (ACTIVE | CLOSED | EXPIRED).
 */
async function listTailPeriods(tenantId, status) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.tailPeriod.findMany({
            where: { tenantId, ...(status ? { status } : {}) },
            orderBy: { createdAt: 'desc' },
            include: { ambassador: { select: ambassadorSelect } },
        });
    });
}
/**
 * Create a new tail period.
 */
async function createTailPeriod(tenantId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.tailPeriod.create({
            data: {
                tenantId,
                ambassadorId: input.ambassadorId,
                contractEndDate: input.contractEndDate,
                tailDays: input.tailDays,
                tailStartDate: input.tailStartDate,
                tailEndDate: input.tailEndDate,
                reason: input.reason ?? null,
                riskTier: input.riskTier ?? null,
                tailType: input.tailType ?? 'STANDARD',
                status: 'ACTIVE',
                postContractFlags: 0,
            },
            include: { ambassador: { select: ambassadorSelect } },
        });
    });
}
// ─────────────────────────────────────────
// CLOSE
// ─────────────────────────────────────────
/**
 * Close a tail period.
 * Returns null if the tail period is not found.
 */
async function closeTailPeriod(tenantId, id, closedBy, closedReason) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const existing = await tx.tailPeriod.findFirst({ where: { id, tenantId } });
        if (!existing)
            return null;
        return tx.tailPeriod.update({
            where: { id },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                closedBy,
                closedReason,
            },
            include: { ambassador: { select: ambassadorSelect } },
        });
    });
}
//# sourceMappingURL=tailPeriod.service.js.map