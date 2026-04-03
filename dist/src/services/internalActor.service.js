"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — Internal Actors
//
// Source-of-truth for supervisory principals, reviewers,
// and compliance officers. Powers User Management screen
// and Register Promoter supervisor dropdown.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInternalActors = listInternalActors;
exports.listSupervisors = listSupervisors;
exports.getInternalActorById = getInternalActorById;
const tenantContext_1 = require("../utils/tenantContext");
const client_1 = require("@prisma/client");
const SUPERVISOR_SELECT = {
    id: true,
    displayName: true,
    email: true,
    role: true,
    status: true,
    seriesLicense: true,
    mfaEnabled: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
};
/**
 * List all internal actors. Optionally filter by role or status.
 */
async function listInternalActors(tenantId, opts) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.internalActor.findMany({
            where: {
                tenantId,
                ...(opts?.role ? { role: opts.role } : {}),
                ...(opts?.status ? { status: opts.status } : {}),
            },
            select: SUPERVISOR_SELECT,
            orderBy: { displayName: 'asc' },
        });
    });
}
/**
 * List only supervisory-capable actors (REGISTERED_PRINCIPAL + DESIGNATED_SUPERVISOR).
 * Used by the Register Promoter dropdown and assignment patch endpoint.
 */
async function listSupervisors(tenantId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.internalActor.findMany({
            where: {
                tenantId,
                role: {
                    in: [
                        client_1.InternalActorRole.REGISTERED_PRINCIPAL,
                        client_1.InternalActorRole.DESIGNATED_SUPERVISOR,
                    ],
                },
                status: client_1.InternalActorStatus.ACTIVE,
            },
            select: SUPERVISOR_SELECT,
            orderBy: { displayName: 'asc' },
        });
    });
}
/**
 * Fetch a single internal actor by id.
 */
async function getInternalActorById(tenantId, id) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.internalActor.findFirst({
            where: { id, tenantId },
            select: SUPERVISOR_SELECT,
        });
    });
}
//# sourceMappingURL=internalActor.service.js.map