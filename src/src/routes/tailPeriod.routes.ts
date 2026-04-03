// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Tail Periods
//
// GET   /api/influwatch/tail-periods          — list all, ?status=
// POST  /api/influwatch/tail-periods          — create new
// PATCH /api/influwatch/tail-periods/:id/close — close a tail period
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import * as TailPeriodService from '../services/tailPeriod.service';

const router = Router();

const VALID_TAIL_TYPES = ['STANDARD', 'EXTENDED', 'REGULATORY'] as const;
const VALID_STATUSES   = ['ACTIVE', 'CLOSED', 'EXPIRED'] as const;

// ─────────────────────────────────────────
// GET /tail-periods
// ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const status = req.query.status as string | undefined;

    if (status && !VALID_STATUSES.includes(status as any)) {
      return res.status(400).json({
        error:       'Invalid status filter',
        validValues: [...VALID_STATUSES],
      });
    }

    const tailPeriods = await TailPeriodService.listTailPeriods(tenantId, status);
    return res.status(200).json({ count: tailPeriods.length, tailPeriods });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /tail-periods
// ─────────────────────────────────────────

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      ambassadorId,
      contractEndDate,
      tailDays,
      tailStartDate,
      tailEndDate,
      reason,
      riskTier,
      tailType,
    } = req.body;

    const tenantId = req.user!.tenantId;

    if (!ambassadorId)    return res.status(400).json({ error: 'ambassadorId is required' });
    if (!contractEndDate) return res.status(400).json({ error: 'contractEndDate is required' });
    if (tailDays == null) return res.status(400).json({ error: 'tailDays is required' });
    if (!tailStartDate)   return res.status(400).json({ error: 'tailStartDate is required' });
    if (!tailEndDate)     return res.status(400).json({ error: 'tailEndDate is required' });

    const tailDaysNum = Number(tailDays);
    if (!Number.isInteger(tailDaysNum) || tailDaysNum < 1) {
      return res.status(400).json({ error: 'tailDays must be a positive integer' });
    }

    if (tailType && !VALID_TAIL_TYPES.includes(tailType as any)) {
      return res.status(400).json({
        error:       'Invalid tailType',
        validValues: [...VALID_TAIL_TYPES],
      });
    }

    const record = await TailPeriodService.createTailPeriod(tenantId, {
      ambassadorId,
      contractEndDate: new Date(contractEndDate),
      tailDays:        tailDaysNum,
      tailStartDate:   new Date(tailStartDate),
      tailEndDate:     new Date(tailEndDate),
      reason:          reason   ?? null,
      riskTier:        riskTier ?? null,
      tailType:        tailType ?? 'STANDARD',
    });

    return res.status(201).json(record);
  } catch (err: any) {
    // FK violation — ambassadorId does not exist
    if (err?.code === 'P2003') {
      return res.status(404).json({ error: 'Ambassador not found', ambassadorId: req.body.ambassadorId });
    }
    next(err);
  }
});

// ─────────────────────────────────────────
// PATCH /tail-periods/:id/close
// ─────────────────────────────────────────

router.patch('/:id/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id }           = req.params;
    const { closedBy, closedReason } = req.body;

    if (!closedBy)     return res.status(400).json({ error: 'closedBy is required' });
    if (!closedReason) return res.status(400).json({ error: 'closedReason is required' });

    const record = await TailPeriodService.closeTailPeriod(tenantId, id, closedBy, closedReason);
    if (!record) return res.status(404).json({ error: 'Tail period not found', id });

    return res.status(200).json(record);
  } catch (err) {
    next(err);
  }
});

export default router;
