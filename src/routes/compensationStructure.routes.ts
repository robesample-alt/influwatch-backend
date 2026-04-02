// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Compensation Structures
//
// GET  /api/influwatch/compensation-structures              — list all
// POST /api/influwatch/compensation-structures              — create new
// GET  /api/influwatch/compensation-structures/:promoterId  — get by promoter
//
// Classification is always computed server-side from compensationForm,
// compensationTrigger, and productType. Classification fields in the
// request body are silently ignored.
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import * as CompensationService from '../services/compensationStructure.service';

const router = Router();

// ─────────────────────────────────────────
// GET /compensation-structures
//
// List all compensation structures, newest first.
// Each record includes ambassador profile details.
// ─────────────────────────────────────────

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const structures = await CompensationService.listCompensationStructures();
    return res.status(200).json({ count: structures.length, structures });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /compensation-structures
//
// Create a new compensation structure for a promoter.
// Required: promoterId, compensationForm, compensationTrigger,
//           productType, writtenAgreementRequired
// Optional: campaignId, agreementReference, notes
//
// Classification fields (isTransactionBased, isSecurityLinked, etc.)
// are always computed — never read from the request body.
// ─────────────────────────────────────────

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      promoterId,
      campaignId,
      compensationForm,
      compensationTrigger,
      productType,
      writtenAgreementRequired,
      agreementReference,
      notes,
    } = req.body;

    if (!promoterId)            return res.status(400).json({ error: 'promoterId is required' });
    if (!compensationForm)      return res.status(400).json({ error: 'compensationForm is required' });
    if (!compensationTrigger)   return res.status(400).json({ error: 'compensationTrigger is required' });
    if (!productType)           return res.status(400).json({ error: 'productType is required' });
    if (writtenAgreementRequired === undefined || writtenAgreementRequired === null) {
      return res.status(400).json({ error: 'writtenAgreementRequired is required' });
    }

    const structure = await CompensationService.createCompensationStructure({
      promoterId,
      campaignId:               campaignId               ?? null,
      compensationForm,
      compensationTrigger,
      productType,
      writtenAgreementRequired: Boolean(writtenAgreementRequired),
      agreementReference:       agreementReference        ?? null,
      notes:                    notes                     ?? null,
    });

    return res.status(201).json(structure);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /compensation-structures/:promoterId
//
// Return the most recent compensation structure for a promoter.
// Returns 404 if none exists.
// ─────────────────────────────────────────

router.get('/:promoterId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const structure = await CompensationService.getCompensationStructure(req.params.promoterId);
    if (!structure) {
      return res.status(404).json({
        error:      'No compensation structure found for this promoter',
        promoterId: req.params.promoterId,
      });
    }
    return res.status(200).json(structure);
  } catch (err) {
    next(err);
  }
});

export default router;
