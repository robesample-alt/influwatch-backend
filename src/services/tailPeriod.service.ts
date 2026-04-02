// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — TailPeriod
//
// listTailPeriods(status?)  — list all, optional status filter
// createTailPeriod(input)   — create a new tail period
// closeTailPeriod(id, ...)  — close an active tail period
// ============================================================

import prisma from '../utils/prisma';

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
export async function listTailPeriods(status?: string) {
  return prisma.tailPeriod.findMany({
    where:   status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { ambassador: { select: ambassadorSelect } },
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
export async function createTailPeriod(input: CreateTailPeriodInput) {
  return prisma.tailPeriod.create({
    data: {
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
}

// ─────────────────────────────────────────
// CLOSE
// ─────────────────────────────────────────

/**
 * Close a tail period.
 * Returns null if the tail period is not found.
 */
export async function closeTailPeriod(
  id:           string,
  closedBy:     string,
  closedReason: string,
) {
  const existing = await prisma.tailPeriod.findUnique({ where: { id } });
  if (!existing) return null;

  return prisma.tailPeriod.update({
    where: { id },
    data: {
      status:       'CLOSED',
      closedAt:     new Date(),
      closedBy,
      closedReason,
    },
    include: { ambassador: { select: ambassadorSelect } },
  });
}
