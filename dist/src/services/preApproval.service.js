"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — PreApprovalRequest
//
// listRequests(status?)         — list all, optional status filter
// createRequest(input)          — submit a new pre-approval request
// decideRequest(id, ...)        — record a decision on a request
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_STATUSES = exports.VALID_DECISION_STATUSES = void 0;
exports.listRequests = listRequests;
exports.createRequest = createRequest;
exports.decideRequest = decideRequest;
const prisma_1 = __importDefault(require("../utils/prisma"));
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
async function listRequests(status) {
    return prisma_1.default.preApprovalRequest.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            ambassador: { select: ambassadorSelect },
            assignedPrincipal: { select: principalSelect },
        },
    });
}
/**
 * Submit a new pre-approval request.
 */
async function createRequest(input) {
    return prisma_1.default.preApprovalRequest.create({
        data: {
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
}
// ─────────────────────────────────────────
// DECIDE
// ─────────────────────────────────────────
/**
 * Record a decision on a pre-approval request.
 * Returns null if the request is not found.
 */
async function decideRequest(id, decision, decidedBy, status) {
    const existing = await prisma_1.default.preApprovalRequest.findUnique({ where: { id } });
    if (!existing)
        return null;
    return prisma_1.default.preApprovalRequest.update({
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
}
//# sourceMappingURL=preApproval.service.js.map