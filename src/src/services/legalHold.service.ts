// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — LegalHold
//
// listHolds(tenantId, status?)           — all holds, optional status filter
// createHold(tenantId, input)            — create a new legal hold
// releaseHold(tenantId, id, by, reason)  — set status RELEASED
// ============================================================

import { withTenantContext } from '../utils/tenantContext';

// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────

/**
 * List all legal holds, newest first.
 * Optionally filtered by status (e.g. 'ACTIVE', 'RELEASED').
 */
export async function listHolds(tenantId: string, status?: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.legalHold.findMany({
      where:   { tenantId, ...(status ? { status } : {}) },
      orderBy: { datePlaced: 'desc' },
    });
  });
}

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

export interface CreateHoldInput {
  holdName:       string;
  holdType:       string;
  scope:          string;
  recordsFrozen?: number;
  placedBy:       string;
  legalAuthority: string;
  datePlaced?:    Date;
  basis:          string;
  status?:        string;
}

/**
 * Create a new legal hold record.
 */
export async function createHold(tenantId: string, input: CreateHoldInput) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.legalHold.create({
      data: {
        tenantId,
        holdName:      input.holdName,
        holdType:      input.holdType,
        scope:         input.scope,
        recordsFrozen: input.recordsFrozen ?? 0,
        placedBy:      input.placedBy,
        legalAuthority:input.legalAuthority,
        datePlaced:    input.datePlaced    ?? new Date(),
        basis:         input.basis,
        status:        input.status        ?? 'ACTIVE',
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
export async function releaseHold(
  tenantId:      string,
  id:            string,
  releasedBy:    string,
  releaseReason: string,
) {
  return withTenantContext({ tenantId }, async (tx) => {
    const existing = await tx.legalHold.findFirst({ where: { id, tenantId } });
    if (!existing) return null;

    return tx.legalHold.update({
      where: { id },
      data: {
        status:        'RELEASED',
        releasedBy,
        releasedAt:    new Date(),
        releaseReason,
      },
    });
  });
}
