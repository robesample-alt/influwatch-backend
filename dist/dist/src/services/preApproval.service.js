"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — PreApprovalRequest
//
// listRequests(tenantId, status?)         — list all, optional status filter
// createRequest(tenantId, input)          — submit a new pre-approval request
// decideRequest(tenantId, id, ...)        — record a decision on a request
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_STATUSES = exports.VALID_DECISION_STATUSES = void 0;
exports.listRequests = listRequests;
exports.createRequest = createRequest;
exports.decideRequest = decideRequest;
const tenantContext_1 = require("../utils/tenantContext");
const ambassadorSelect = {
    id: true,
    displayName: true,
    handle: true,
    riskTier: true,
    status: true,
};
const principalSelect = {
    id: true,
    displayName: true,
    email: true,
    role: true,
};
const VALID_DECISION_STATUSES = ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'];
exports.VALID_DECISION_STATUSES = VALID_DECISION_STATUSES;
const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'];
exports.VALID_STATUSES = VALID_STATUSES;
// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────
/**
 * List all pre-approval requests, newest first.
 * Optionally filter by status.
 */
async function listRequests(tenantId, status) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.preApprovalRequest.findMany({
            where: { tenantId, ...(status ? { status } : {}) },
            orderBy: { createdAt: 'desc' },
            include: {
                ambassador: { select: ambassadorSelect },
                assignedPrincipal: { select: principalSelect },
            },
        });
    });
}
/**
 * Submit a new pre-approval request.
 */
async function createRequest(tenantId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.preApprovalRequest.create({
            data: {
                tenantId,
                ambassadorId: input.ambassadorId,
                submittedBy: input.submittedBy,
                contentType: input.contentType,
                platform: input.platform,
                contentPreview: input.contentPreview,
                requiredBy: input.requiredBy ?? null,
                assignedPrincipalId: input.assignedPrincipalId ?? null,
                slaHours: input.slaHours ?? 48,
                status: 'PENDING',
            },
            include: {
                ambassador: { select: ambassadorSelect },
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
async function decideRequest(tenantId, id, decision, decidedBy, status) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const existing = await tx.preApprovalRequest.findFirst({ where: { id, tenantId } });
        if (!existing)
            return null;
        return tx.preApprovalRequest.update({
            where: { id },
            data: {
                status,
                decision,
                decidedBy,
                decidedAt: new Date(),
            },
            include: {
                ambassador: { select: ambassadorSelect },
                assignedPrincipal: { select: principalSelect },
            },
        });
    });
}
//# sourceMappingURL=preApproval.service.js.map