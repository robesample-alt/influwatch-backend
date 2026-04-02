// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Route handlers — Internal Actors
//
// Powers the User Management screen.
// GET /internal-actors returns all actors.
// GET /internal-actors/supervisors returns only supervisory-role actors.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import * as InternalActorService from '../services/internalActor.service';
import { InternalActorRole, InternalActorStatus } from '@prisma/client';

// ─────────────────────────────────────────
// GET /internal-actors
// List all internal actors. Optional ?role= and ?status= filters.
// Powers the User Management table.
// ─────────────────────────────────────────

export async function listInternalActors(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const role   = req.query.role   as InternalActorRole   | undefined;
    const status = req.query.status as InternalActorStatus | undefined;
    const actors = await InternalActorService.listInternalActors({ role, status });
    return res.status(200).json(actors);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// GET /internal-actors/supervisors
// Supervisory-capable actors only (REGISTERED_PRINCIPAL + DESIGNATED_SUPERVISOR, ACTIVE).
// Powers the Register Promoter supervisor dropdown.
// Must be mounted BEFORE /:id to avoid route shadowing.
// ─────────────────────────────────────────

export async function listSupervisors(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const supervisors = await InternalActorService.listSupervisors();
    return res.status(200).json(supervisors);
  } catch (err) {
    next(err);
  }
}
