// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — LegalHold
//
// listHolds(status?)           — all holds, optional status filter
// createHold(input)            — create a new legal hold
// releaseHold(id, by, reason)  — set status RELEASED
// ============================================================

import prisma from '../utils/prisma';

// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────

/**
 * List all legal holds, newest first.
 * Optionally filtered by status (e.g. 'ACTIVE', 'RELEASED').
 */
export async function listHolds(status?: string) {
  return prisma.legalHold.findMany({
    where:   status ? { status } : undefined,
    orderBy: { datePlaced: 'desc' },
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
export async function createHold(input: CreateHoldInput) {
  return prisma.legalHold.create({
    data: {
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
  id:            string,
  releasedBy:    string,
  releaseReason: string,
) {
  const existing = await prisma.legalHold.findUnique({ where: { id } });
  if (!existing) return null;

  return prisma.legalHold.update({
    where: { id },
    data: {
      status:        'RELEASED',
      releasedBy,
      releasedAt:    new Date(),
      releaseReason,
    },
  });
}
