"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — Internal Actors
//
// Source-of-truth for supervisory principals, reviewers,
// and compliance officers. Powers User Management screen
// and Register Promoter supervisor dropdown.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInternalActors = listInternalActors;
exports.listSupervisors = listSupervisors;
exports.getInternalActorById = getInternalActorById;
const prisma_1 = __importDefault(require("../utils/prisma"));
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
async function listInternalActors(opts) {
    return prisma_1.default.internalActor.findMany({
        where: {
            ...(opts?.role ? { role: opts.role } : {}),
            ...(opts?.status ? { status: opts.status } : {}),
        },
        select: SUPERVISOR_SELECT,
        orderBy: { displayName: 'asc' },
    });
}
/**
 * List only supervisory-capable actors (REGISTERED_PRINCIPAL + DESIGNATED_SUPERVISOR).
 * Used by the Register Promoter dropdown and assignment patch endpoint.
 */
async function listSupervisors() {
    return prisma_1.default.internalActor.findMany({
        where: {
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
}
/**
 * Fetch a single internal actor by id.
 */
async function getInternalActorById(id) {
    return prisma_1.default.internalActor.findUnique({
        where: { id },
        select: SUPERVISOR_SELECT,
    });
}
//# sourceMappingURL=internalActor.service.js.map