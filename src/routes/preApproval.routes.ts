// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Pre-Approval Requests
//
// GET   /api/influwatch/pre-approvals              — list, ?status=
// POST  /api/influwatch/pre-approvals              — submit new
// PATCH /api/influwatch/pre-approvals/:id/decision — record decision
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { InternalActorRole } from '@prisma/client';
import * as PreApprovalService from '../services/preApproval.service';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// ─────────────────────────────────────────
// GET /pre-approvals
// ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;

    if (status && !PreApprovalService.VALID_STATUSES.includes(status as any)) {
      return res.status(400).json({
        error:       'Invalid status filter',
        validValues: [...PreApprovalService.VALID_STATUSES],
      });
    }

    const requests = await PreApprovalService.listRequests(status);
    return res.status(200).json({ count: requests.length, requests });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /pre-approvals
// ─────────────────────────────────────────

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      ambassadorId,
      submittedBy,
      contentType,
      platform,
      contentPreview,
      requiredBy,
      assignedPrincipalId,
      slaHours,
    } = req.body;

    if (!ambassadorId)   return res.status(400).json({ error: 'ambassadorId is required' });
    if (!submittedBy)    return res.status(400).json({ error: 'submittedBy is required' });
    if (!contentType)    return res.status(400).json({ error: 'contentType is required' });
    if (!platform)       return res.status(400).json({ error: 'platform is required' });
    if (!contentPreview) return res.status(400).json({ error: 'contentPreview is required' });

    const record = await PreApprovalService.createRequest({
      ambassadorId,
      submittedBy,
      contentType,
      platform,
      contentPreview: String(contentPreview).slice(0, 500),
      requiredBy:          requiredBy          ? new Date(requiredBy) : null,
      assignedPrincipalId: assignedPrincipalId ?? null,
      slaHours:            slaHours != null    ? Number(slaHours) : 48,
    });

    return res.status(201).json(record);
  } catch (err: any) {
    if (err?.code === 'P2003') {
      return res.status(404).json({
        error: 'Ambassador or assigned principal not found',
        ambassadorId: req.body.ambassadorId,
      });
    }
    next(err);
  }
});

// ─────────────────────────────────────────
// PATCH /pre-approvals/:id/decision
// ─────────────────────────────────────────

router.patch('/:id/decision', requireRole(InternalActorRole.REGISTERED_PRINCIPAL, InternalActorRole.DESIGNATED_SUPERVISOR, InternalActorRole.COMPLIANCE_OFFICER, InternalActorRole.TENANT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id }              = req.params;
    const { decision, status } = req.body;
    const decidedBy           = req.user!.id;

    if (!decision)  return res.status(400).json({ error: 'decision is required' });
    if (!status)    return res.status(400).json({ error: 'status is required' });

    if (!PreApprovalService.VALID_DECISION_STATUSES.includes(status as any)) {
      return res.status(400).json({
        error:       'Invalid status',
        validValues: [...PreApprovalService.VALID_DECISION_STATUSES],
      });
    }

    const record = await PreApprovalService.decideRequest(
      id,
      decision,
      decidedBy,
      status as PreApprovalService.DecisionStatus,
    );
    if (!record) return res.status(404).json({ error: 'Pre-approval request not found', id });

    return res.status(200).json(record);
  } catch (err) {
    next(err);
  }
});

export default router;
