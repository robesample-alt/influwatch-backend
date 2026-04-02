// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — Internal Actors
//
// Source-of-truth for supervisory principals, reviewers,
// and compliance officers. Powers User Management screen
// and Register Promoter supervisor dropdown.
// ============================================================

import prisma from '../utils/prisma';
import { InternalActorRole, InternalActorStatus } from '@prisma/client';

const SUPERVISOR_SELECT = {
  id:            true,
  displayName:   true,
  email:         true,
  role:          true,
  status:        true,
  seriesLicense: true,
  mfaEnabled:    true,
  lastLoginAt:   true,
  createdAt:     true,
  updatedAt:     true,
} as const;

/**
 * List all internal actors. Optionally filter by role or status.
 */
export async function listInternalActors(opts?: {
  role?:   InternalActorRole;
  status?: InternalActorStatus;
}) {
  return prisma.internalActor.findMany({
    where: {
      ...(opts?.role   ? { role:   opts.role   } : {}),
      ...(opts?.status ? { status: opts.status } : {}),
    },
    select:  SUPERVISOR_SELECT,
    orderBy: { displayName: 'asc' },
  });
}

/**
 * List only supervisory-capable actors (REGISTERED_PRINCIPAL + DESIGNATED_SUPERVISOR).
 * Used by the Register Promoter dropdown and assignment patch endpoint.
 */
export async function listSupervisors() {
  return prisma.internalActor.findMany({
    where: {
      role: {
        in: [
          InternalActorRole.REGISTERED_PRINCIPAL,
          InternalActorRole.DESIGNATED_SUPERVISOR,
        ],
      },
      status: InternalActorStatus.ACTIVE,
    },
    select:  SUPERVISOR_SELECT,
    orderBy: { displayName: 'asc' },
  });
}

/**
 * Fetch a single internal actor by id.
 */
export async function getInternalActorById(id: string) {
  return prisma.internalActor.findUnique({
    where:  { id },
    select: SUPERVISOR_SELECT,
  });
}
