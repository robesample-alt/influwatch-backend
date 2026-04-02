// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — PreApprovalRequest
//
// listRequests(status?)         — list all, optional status filter
// createRequest(input)          — submit a new pre-approval request
// decideRequest(id, ...)        — record a decision on a request
// ============================================================

import prisma from '../utils/prisma';

const ambassadorSelect = {
  id:          true,
  displayName: true,
  handle:      true,
  riskTier:    true,
  status:      true,
};

const principalSelect = {
  id:          true,
  displayName: true,
  email:       true,
  role:        true,
};

const VALID_DECISION_STATUSES = ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'] as const;
export type DecisionStatus = typeof VALID_DECISION_STATUSES[number];
export { VALID_DECISION_STATUSES };

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'] as const;
export { VALID_STATUSES };

// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────

/**
 * List all pre-approval requests, newest first.
 * Optionally filter by status.
 */
export async function listRequests(status?: string) {
  return prisma.preApprovalRequest.findMany({
    where:   status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      ambassador:        { select: ambassadorSelect },
      assignedPrincipal: { select: principalSelect },
    },
  });
}

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

export interface CreateRequestInput {
  ambassadorId:        string;
  submittedBy:         string;
  contentType:         string;
  platform:            string;
  contentPreview:      string;
  requiredBy?:         Date | null;
  assignedPrincipalId?: string | null;
  slaHours?:           number;
}

/**
 * Submit a new pre-approval request.
 */
export async function createRequest(input: CreateRequestInput) {
  return prisma.preApprovalRequest.create({
    data: {
      ambassadorId:        input.ambassadorId,
      submittedBy:         input.submittedBy,
      contentType:         input.contentType,
      platform:            input.platform,
      contentPreview:      input.contentPreview,
      requiredBy:          input.requiredBy          ?? null,
      assignedPrincipalId: input.assignedPrincipalId ?? null,
      slaHours:            input.slaHours            ?? 48,
      status:              'PENDING',
    },
    include: {
      ambassador:        { select: ambassadorSelect },
      assignedPrincipal: { select: principalSelect },
    },
  });
}

// ─────────────────────────────────────────
// DECIDE
// ─────────────────────────────────────────

/**
 * Record a decision on a pre-approval request.
 * Returns null if the request is not found.
 */
export async function decideRequest(
  id:        string,
  decision:  string,
  decidedBy: string,
  status:    DecisionStatus,
) {
  const existing = await prisma.preApprovalRequest.findUnique({ where: { id } });
  if (!existing) return null;

  return prisma.preApprovalRequest.update({
    where: { id },
    data: {
      status,
      decision,
      decidedBy,
      decidedAt: new Date(),
    },
    include: {
      ambassador:        { select: ambassadorSelect },
      assignedPrincipal: { select: principalSelect },
    },
  });
}
