"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — TailPeriod
//
// listTailPeriods(status?)  — list all, optional status filter
// createTailPeriod(input)   — create a new tail period
// closeTailPeriod(id, ...)  — close an active tail period
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTailPeriods = listTailPeriods;
exports.createTailPeriod = createTailPeriod;
exports.closeTailPeriod = closeTailPeriod;
const prisma_1 = __importDefault(require("../utils/prisma"));
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
async function listTailPeriods(status) {
    return prisma_1.default.tailPeriod.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: { ambassador: { select: ambassadorSelect } },
    });
}
/**
 * Create a new tail period.
 */
async function createTailPeriod(input) {
    return prisma_1.default.tailPeriod.create({
        data: {
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
}
// ─────────────────────────────────────────
// CLOSE
// ─────────────────────────────────────────
/**
 * Close a tail period.
 * Returns null if the tail period is not found.
 */
async function closeTailPeriod(id, closedBy, closedReason) {
    const existing = await prisma_1.default.tailPeriod.findUnique({ where: { id } });
    if (!existing)
        return null;
    return prisma_1.default.tailPeriod.update({
        where: { id },
        data: {
            status: 'CLOSED',
            closedAt: new Date(),
            closedBy,
            closedReason,
        },
        include: { ambassador: { select: ambassadorSelect } },
    });
}
//# sourceMappingURL=tailPeriod.service.js.map