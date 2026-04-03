// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — SupervisoryAttestation
//
// createAttestation — record a formal supervisory sign-off
// listAttestations  — retrieve attestations, optionally by period
// ============================================================

import { withTenantContext } from '../utils/tenantContext';

// ─────────────────────────────────────────
// PRINCIPAL INCLUDE SHAPE
// Reused across both queries
// ─────────────────────────────────────────

const principalSelect = {
  id:          true,
  displayName: true,
  email:       true,
  role:        true,
} as const;

// ─────────────────────────────────────────
// INPUT TYPE
// ─────────────────────────────────────────

export interface CreateAttestationInput {
  principalId:      string;
  periodLabel:      string;
  periodStart:      Date;
  periodEnd:        Date;
  promotersInScope: number;
  supervisoryNote?: string;
}

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

/**
 * Record a formal supervisory attestation.
 * Returns the created record with principal details included.
 * Logs creation to console for Phase 1 audit trail.
 */
export async function createAttestation(tenantId: string, input: CreateAttestationInput) {
  return withTenantContext({ tenantId }, async (tx) => {
    const attestation = await tx.supervisoryAttestation.create({
      data: {
        tenantId,
        principalId:      input.principalId,
        periodLabel:      input.periodLabel,
        periodStart:      input.periodStart,
        periodEnd:        input.periodEnd,
        promotersInScope: input.promotersInScope,
        supervisoryNote:  input.supervisoryNote ?? null,
      },
      include: {
        principal: { select: principalSelect },
      },
    });

    // Phase 1 audit trail — ArchiveEventLog is content-record scoped, so log here
    console.log(
      `[ATTESTATION CREATED] id=${attestation.id} ` +
      `principal=${attestation.principal.email} ` +
      `period="${attestation.periodLabel}" ` +
      `promotersInScope=${attestation.promotersInScope} ` +
      `certifiedAt=${attestation.certifiedAt.toISOString()}`
    );

    return attestation;
  });
}

// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────

/**
 * List all supervisory attestations, newest first.
 * Optionally filtered by periodLabel (exact match).
 * Includes principal displayName, email, and role.
 */
export async function listAttestations(tenantId: string, periodLabel?: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.supervisoryAttestation.findMany({
      where:   { tenantId, ...(periodLabel ? { periodLabel } : {}) },
      include: { principal: { select: principalSelect } },
      orderBy: { certifiedAt: 'desc' },
    });
  });
}
