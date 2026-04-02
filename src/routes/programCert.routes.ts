// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Annual Supervisory Program Certifications
//
// GET  /api/influwatch/program-certifications — list all
// POST /api/influwatch/program-certifications — create new
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { InternalActorRole } from '@prisma/client';
import * as ProgramCertService from '../services/programCert.service';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// ─────────────────────────────────────────
// GET /program-certifications
//
// List all annual program certifications, newest first.
// ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certs = await ProgramCertService.listProgramCerts();
    return res.status(200).json({ count: certs.length, certs });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /program-certifications
//
// Create a new annual program certification.
// Required: principalId, certificationYear, rulesCertified,
//           supervisorySystemAdequate
// ─────────────────────────────────────────

router.post('/', requireRole(InternalActorRole.REGISTERED_PRINCIPAL, InternalActorRole.TENANT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      certificationYear,
      rulesCertified,
      supervisorySystemAdequate,
      findings,
      certificationNote,
    } = req.body;

    const principalId = req.user!.id;
    if (!certificationYear)
      return res.status(400).json({ error: 'certificationYear is required' });
    if (!rulesCertified)
      return res.status(400).json({ error: 'rulesCertified is required' });
    if (supervisorySystemAdequate === undefined || supervisorySystemAdequate === null)
      return res.status(400).json({ error: 'supervisorySystemAdequate is required' });

    const year = Number(certificationYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100)
      return res.status(400).json({ error: 'certificationYear must be a valid 4-digit year' });

    const cert = await ProgramCertService.createProgramCert({
      principalId,
      certificationYear:         year,
      rulesCertified,
      supervisorySystemAdequate: Boolean(supervisorySystemAdequate),
      findings:                  findings          ?? null,
      certificationNote:         certificationNote ?? null,
    });

    return res.status(201).json(cert);
  } catch (err: any) {
    // FK violation — principalId does not exist
    if (err?.code === 'P2003') {
      return res.status(404).json({ error: 'Principal not found', principalId: req.user?.id });
    }
    next(err);
  }
});

export default router;
