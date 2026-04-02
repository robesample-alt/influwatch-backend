// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Legal Holds
//
// GET   /api/influwatch/legal-holds           — list all holds
// POST  /api/influwatch/legal-holds           — create new hold
// PATCH /api/influwatch/legal-holds/:id/release — release a hold
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { InternalActorRole } from '@prisma/client';
import * as LegalHoldService from '../services/legalHold.service';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// ─────────────────────────────────────────
// GET /legal-holds
//
// List all legal holds, optional ?status= filter.
// ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const holds  = await LegalHoldService.listHolds(status);
    return res.status(200).json({ count: holds.length, holds });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /legal-holds
//
// Create a new legal hold.
// Required: holdName, holdType, scope, placedBy, legalAuthority, basis
// ─────────────────────────────────────────

router.post('/', requireRole(InternalActorRole.REGISTERED_PRINCIPAL, InternalActorRole.DESIGNATED_SUPERVISOR, InternalActorRole.COMPLIANCE_OFFICER, InternalActorRole.TENANT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      holdName,
      holdType,
      scope,
      recordsFrozen,
      legalAuthority,
      datePlaced,
      basis,
      status,
    } = req.body;

    const placedBy = req.user!.id;

    if (!holdName)       return res.status(400).json({ error: 'holdName is required' });
    if (!holdType)       return res.status(400).json({ error: 'holdType is required' });
    if (!scope)          return res.status(400).json({ error: 'scope is required' });
    if (!legalAuthority) return res.status(400).json({ error: 'legalAuthority is required' });
    if (!basis)          return res.status(400).json({ error: 'basis is required' });

    const hold = await LegalHoldService.createHold({
      holdName,
      holdType,
      scope,
      recordsFrozen: recordsFrozen != null ? Number(recordsFrozen) : 0,
      placedBy,
      legalAuthority,
      datePlaced:    datePlaced ? new Date(datePlaced) : undefined,
      basis,
      status,
    });

    return res.status(201).json(hold);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// PATCH /legal-holds/:id/release
//
// Release an active hold.
// Required: releasedBy, releaseReason
// ─────────────────────────────────────────

router.patch('/:id/release', requireRole(InternalActorRole.REGISTERED_PRINCIPAL, InternalActorRole.COMPLIANCE_OFFICER, InternalActorRole.TENANT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { releaseReason } = req.body;
    const releasedBy = req.user!.id;

    if (!releaseReason) return res.status(400).json({ error: 'releaseReason is required' });

    const hold = await LegalHoldService.releaseHold(req.params.id, releasedBy, releaseReason);
    if (!hold) {
      return res.status(404).json({ error: 'Legal hold not found', id: req.params.id });
    }

    return res.status(200).json(hold);
  } catch (err) {
    next(err);
  }
});

export default router;
