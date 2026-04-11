// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Route handlers — Ambassador / Promoter
//
// Powers the Promoter Registry and Promoter Detail screens.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import * as AmbassadorService from '../services/ambassador.service';

// ─────────────────────────────────────────
// GET /ambassadors
// List all ambassador profiles.
// Powers the Promoter Registry screen.
// ─────────────────────────────────────────

export async function listAmbassadors(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = req.user!.tenantId;
    const ambassadors = await AmbassadorService.listAmbassadors(tenantId);
    return res.status(200).json(ambassadors);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// POST /ambassadors
// Register a new promoter.
// Powers the Register Promoter screen.
// ─────────────────────────────────────────

export async function createAmbassador(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = req.user!.tenantId;
    const { displayName, handle, email, primaryPlatform, riskTier, assignedSupervisorId, supervisoryRelationship, compensation } = req.body;

    if (!displayName || !handle || !primaryPlatform) {
      return res.status(400).json({
        error: 'displayName, handle, and primaryPlatform are required',
      });
    }

    // Counsel-reviewed acknowledgment is required for elevated postures.
    if (compensation && (compensation.supervisionPosture === 'CRITICAL' || compensation.supervisionPosture === 'HIGH')) {
      if (compensation.acknowledged !== true) {
        return res.status(400).json({
          error: 'Counsel-reviewed acknowledgment is required for transaction-based or potentially-transactional compensation arrangements.',
        });
      }
    }

    const ambassador = await AmbassadorService.createAmbassador(tenantId, {
      displayName,
      handle,
      email,
      primaryPlatform,
      riskTier:                riskTier ?? undefined,
      assignedSupervisorId:   assignedSupervisorId ?? undefined,
      supervisoryRelationship: supervisoryRelationship ?? 'SUPERVISED',
      compensation:            compensation ?? undefined,
      actorId:                 req.user!.id,
    });

    return res.status(201).json(ambassador);
  } catch (err: any) {
    if (err.validationErrors) return res.status(400).json({ error: err.message });
    next(err);
  }
}

// ─────────────────────────────────────────
// PATCH /ambassadors/:id/assignment
// Update the assigned supervisor for a promoter.
// Body: { assignedSupervisorId: string | null }
// ─────────────────────────────────────────

export async function updateAssignment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = req.user!.tenantId;
    const { id }                 = req.params;
    const { assignedSupervisorId } = req.body;

    if (assignedSupervisorId === undefined) {
      return res.status(400).json({
        error: 'assignedSupervisorId is required (pass null to unassign)',
      });
    }

    const ambassador = await AmbassadorService.assignSupervisor(tenantId, id, assignedSupervisorId);
    return res.status(200).json(ambassador);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// GET /ambassadors/monitor
// All promoters with capture statistics.
// Powers the Account Monitor screen.
// Must be mounted BEFORE /:id to avoid route shadowing.
// ─────────────────────────────────────────

export async function getMonitorSummary(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = req.user!.tenantId;
    const data = await AmbassadorService.getMonitorSummary(tenantId);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// GET /ambassadors/:id
// Full ambassador detail — profile + all content records + derived counts.
// Powers the Promoter Detail screen.
// ─────────────────────────────────────────

export async function getAmbassadorDetail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = req.user!.tenantId;
    const detail = await AmbassadorService.getAmbassadorDetail(tenantId, req.params.id);
    if (!detail) {
      return res.status(404).json({ error: 'Ambassador not found', id: req.params.id });
    }
    return res.status(200).json(detail);
  } catch (err) {
    next(err);
  }
}
