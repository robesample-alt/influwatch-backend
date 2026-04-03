// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — PreApprovalRequest
//
// listRequests(tenantId, status?)         — list all, optional status filter
// createRequest(tenantId, input)          — submit a new pre-approval request
// decideRequest(tenantId, id, ...)        — record a decision on a request
// ============================================================

import { withTenantContext } from '../utils/tenantContext';

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
export async function listRequests(tenantId: string, status?: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.preApprovalRequest.findMany({
      where:   { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        ambassador:        { select: ambassadorSelect },
        assignedPrincipal: { select: principalSelect },
      },
    });
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
export async function createRequest(tenantId: string, input: CreateRequestInput) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.preApprovalRequest.create({
      data: {
        tenantId,
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
  tenantId:  string,
  id:        string,
  decision:  string,
  decidedBy: string,
  status:    DecisionStatus,
) {
  return withTenantContext({ tenantId }, async (tx) => {
    const existing = await tx.preApprovalRequest.findFirst({ where: { id, tenantId } });
    if (!existing) return null;

    return tx.preApprovalRequest.update({
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
  });
}
