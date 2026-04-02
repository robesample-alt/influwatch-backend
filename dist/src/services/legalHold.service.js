"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — LegalHold
//
// listHolds(status?)           — all holds, optional status filter
// createHold(input)            — create a new legal hold
// releaseHold(id, by, reason)  — set status RELEASED
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHolds = listHolds;
exports.createHold = createHold;
exports.releaseHold = releaseHold;
const prisma_1 = __importDefault(require("../utils/prisma"));
// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────
/**
 * List all legal holds, newest first.
 * Optionally filtered by status (e.g. 'ACTIVE', 'RELEASED').
 */
async function listHolds(status) {
    return prisma_1.default.legalHold.findMany({
        where: status ? { status } : undefined,
        orderBy: { datePlaced: 'desc' },
    });
}
/**
 * Create a new legal hold record.
 */
async function createHold(input) {
    return prisma_1.default.legalHold.create({
        data: {
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
}
// ─────────────────────────────────────────
// RELEASE
// ─────────────────────────────────────────
/**
 * Release a legal hold by setting status to RELEASED
 * and recording who released it and why.
 * Returns null if the hold does not exist.
 */
async function releaseHold(id, releasedBy, releaseReason) {
    const existing = await prisma_1.default.legalHold.findUnique({ where: { id } });
    if (!existing)
        return null;
    return prisma_1.default.legalHold.update({
        where: { id },
        data: {
            status: 'RELEASED',
            releasedBy,
            releasedAt: new Date(),
            releaseReason,
        },
    });
}
//# sourceMappingURL=legalHold.service.js.map