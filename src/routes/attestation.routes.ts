// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Supervisory Attestations
//
// POST /api/influwatch/certifications   — create attestation
// GET  /api/influwatch/certifications   — list attestations
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { InternalActorRole } from '@prisma/client';
import * as AttestationService from '../services/attestation.service';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// ─────────────────────────────────────────
// POST /certifications
//
// Record a new supervisory attestation.
// Required: principalId, periodLabel, periodStart, periodEnd, promotersInScope
// Optional: supervisoryNote
// ─────────────────────────────────────────

router.post('/', requireRole(InternalActorRole.REGISTERED_PRINCIPAL, InternalActorRole.DESIGNATED_SUPERVISOR, InternalActorRole.TENANT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { periodLabel, periodStart, periodEnd, promotersInScope, supervisoryNote } = req.body;

    const principalId = req.user!.id;
    if (!periodLabel)      return res.status(400).json({ error: 'periodLabel is required' });
    if (!periodStart)      return res.status(400).json({ error: 'periodStart is required' });
    if (!periodEnd)        return res.status(400).json({ error: 'periodEnd is required' });
    if (promotersInScope == null) return res.status(400).json({ error: 'promotersInScope is required' });

    const attestation = await AttestationService.createAttestation({
      principalId,
      periodLabel,
      periodStart:      new Date(periodStart),
      periodEnd:        new Date(periodEnd),
      promotersInScope: Number(promotersInScope),
      supervisoryNote,
    });

    return res.status(201).json(attestation);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /certifications
//
// List all supervisory attestations, newest first.
// Optional: ?period=Q1+2026 filters by periodLabel (exact match).
// ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period       = req.query.period as string | undefined;
    const attestations = await AttestationService.listAttestations(period);

    return res.status(200).json({ count: attestations.length, attestations });
  } catch (err) {
    next(err);
  }
});

export default router;
