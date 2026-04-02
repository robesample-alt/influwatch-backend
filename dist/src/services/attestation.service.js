"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — SupervisoryAttestation
//
// createAttestation — record a formal supervisory sign-off
// listAttestations  — retrieve attestations, optionally by period
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAttestation = createAttestation;
exports.listAttestations = listAttestations;
const prisma_1 = __importDefault(require("../utils/prisma"));
// ─────────────────────────────────────────
// PRINCIPAL INCLUDE SHAPE
// Reused across both queries
// ─────────────────────────────────────────
const principalSelect = {
    id: true,
    displayName: true,
    email: true,
    role: true,
};
// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────
/**
 * Record a formal supervisory attestation.
 * Returns the created record with principal details included.
 * Logs creation to console for Phase 1 audit trail.
 */
async function createAttestation(input) {
    const attestation = await prisma_1.default.supervisoryAttestation.create({
        data: {
            principalId: input.principalId,
            periodLabel: input.periodLabel,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            promotersInScope: input.promotersInScope,
            supervisoryNote: input.supervisoryNote ?? null,
        },
        include: {
            principal: { select: principalSelect },
        },
    });
    // Phase 1 audit trail — ArchiveEventLog is content-record scoped, so log here
    console.log(`[ATTESTATION CREATED] id=${attestation.id} ` +
        `principal=${attestation.principal.email} ` +
        `period="${attestation.periodLabel}" ` +
        `promotersInScope=${attestation.promotersInScope} ` +
        `certifiedAt=${attestation.certifiedAt.toISOString()}`);
    return attestation;
}
// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────
/**
 * List all supervisory attestations, newest first.
 * Optionally filtered by periodLabel (exact match).
 * Includes principal displayName, email, and role.
 */
async function listAttestations(periodLabel) {
    return prisma_1.default.supervisoryAttestation.findMany({
        where: periodLabel ? { periodLabel } : undefined,
        include: { principal: { select: principalSelect } },
        orderBy: { certifiedAt: 'desc' },
    });
}
//# sourceMappingURL=attestation.service.js.map