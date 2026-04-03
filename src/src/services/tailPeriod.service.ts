// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — TailPeriod
//
// listTailPeriods(tenantId, status?)  — list all, optional status filter
// createTailPeriod(tenantId, input)   — create a new tail period
// closeTailPeriod(tenantId, id, ...)  — close an active tail period
// ============================================================

import { withTenantContext } from '../utils/tenantContext';

const ambassadorSelect = {
  id:          true,
  displayName: true,
  handle:      true,
  riskTier:    true,
  status:      true,
};

// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────

/**
 * List all tail periods, newest first.
 * Optionally filter by status (ACTIVE | CLOSED | EXPIRED).
 */
export async function listTailPeriods(tenantId: string, status?: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.tailPeriod.findMany({
      where:   { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { ambassador: { select: ambassadorSelect } },
    });
  });
}

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

export interface CreateTailPeriodInput {
  ambassadorId:    string;
  contractEndDate: Date;
  tailDays:        number;
  tailStartDate:   Date;
  tailEndDate:     Date;
  reason?:         string | null;
  riskTier?:       string | null;
  tailType?:       string;
}

/**
 * Create a new tail period.
 */
export async function createTailPeriod(tenantId: string, input: CreateTailPeriodInput) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.tailPeriod.create({
      data: {
        tenantId,
        ambassadorId:    input.ambassadorId,
        contractEndDate: input.contractEndDate,
        tailDays:        input.tailDays,
        tailStartDate:   input.tailStartDate,
        tailEndDate:     input.tailEndDate,
        reason:          input.reason          ?? null,
        riskTier:        input.riskTier        ?? null,
        tailType:        input.tailType        ?? 'STANDARD',
        status:          'ACTIVE',
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
export async function closeTailPeriod(
  tenantId:     string,
  id:           string,
  closedBy:     string,
  closedReason: string,
) {
  return withTenantContext({ tenantId }, async (tx) => {
    const existing = await tx.tailPeriod.findFirst({ where: { id, tenantId } });
    if (!existing) return null;

    return tx.tailPeriod.update({
      where: { id },
      data: {
        status:       'CLOSED',
        closedAt:     new Date(),
        closedBy,
        closedReason,
      },
      include: { ambassador: { select: ambassadorSelect } },
    });
  });
}
