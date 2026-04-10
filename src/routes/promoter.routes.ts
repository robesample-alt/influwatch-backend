// ============================================================
// FUNDUREX — INFLUWATCH
// Routes — Promoter Portal API
//
// Authenticated with authenticatePromoter middleware.
// All routes scoped to req.promoter.ambassadorId / tenantId.
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { withTenantContext } from '../utils/tenantContext';

const router = Router();

// ─────────────────────────────────────────
// GET /promoter/profile
// ─────────────────────────────────────────

router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ambassadorId, tenantId, email } = req.promoter!;

    const result = await withTenantContext({ tenantId }, async (tx) => {
      const [ambassador, comp, campaigns, tenant] = await Promise.all([
        tx.ambassadorProfile.findFirst({
          where: { id: ambassadorId, tenantId },
        }),
        tx.compensationStructure.findFirst({
          where: { promoterId: ambassadorId, tenantId },
          orderBy: { createdAt: 'desc' },
        }),
        tx.campaignPromoter.findMany({
          where: { promoterId: ambassadorId, tenantId, status: 'ACTIVE' },
          include: {
            campaign: { select: { id: true, campaignName: true, status: true } },
          },
        }),
        tx.tenant.findFirst({
          where: { id: tenantId },
          select: { firmName: true },
        }),
      ]);

      // Determine monitoring status
      let monitoringStatus = 'ACTIVE';
      if (ambassador?.status === 'INACTIVE' || ambassador?.status === 'SUSPENDED') {
        monitoringStatus = 'SUSPENDED';
      }
      if (ambassador?.supervisoryRelationship === 'TAIL_PERIOD') {
        monitoringStatus = 'TAIL_PERIOD';
      }

      return {
        ambassador: ambassador ? {
          id: ambassador.id,
          displayName: ambassador.displayName,
          handle: ambassador.handle,
          primaryPlatform: ambassador.primaryPlatform,
          riskTier: ambassador.riskTier,
          status: ambassador.status,
        } : null,
        compensation: comp ? {
          compensationType: comp.compensationType,
          compensationForm: comp.compensationForm,
          supervisionPosture: comp.supervisionPosture,
          isTransactionBased: comp.isTransactionBased,
          transactionalityClass: comp.transactionalityClass,
        } : null,
        campaigns: campaigns.map(cp => ({
          id: cp.campaign?.id,
          name: cp.campaign?.campaignName,
          status: cp.campaign?.status,
        })),
        firmName: tenant?.firmName || 'Your firm',
        email,
        monitoringStatus,
      };
    });

    return res.status(200).json(result);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// GET /promoter/submissions
// ─────────────────────────────────────────

router.get('/submissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ambassadorId, tenantId } = req.promoter!;

    const submissions = await withTenantContext({ tenantId }, async (tx) => {
      return tx.promoterSubmission.findMany({
        where: { ambassadorId, tenantId },
        orderBy: { createdAt: 'desc' },
      });
    });

    return res.status(200).json({ submissions });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// POST /promoter/submit
// ─────────────────────────────────────────

router.post('/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ambassadorId, tenantId } = req.promoter!;
    const { platform, contentType, draftText, url, notes } = req.body;

    if (!platform || !contentType) {
      return res.status(400).json({ error: 'platform and contentType are required' });
    }
    if (!draftText && !url) {
      return res.status(400).json({ error: 'Either draftText or url is required' });
    }

    const result = await withTenantContext({ tenantId }, async (tx) => {
      return tx.promoterSubmission.create({
        data: {
          tenantId,
          ambassadorId,
          platform,
          contentType,
          draftText: draftText ?? null,
          url: url ?? null,
          notes: notes ?? null,
          status: 'PENDING',
        },
      });
    });

    return res.status(201).json(result);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// PATCH /promoter/submissions/:id/revise
// ─────────────────────────────────────────

router.patch('/submissions/:id/revise', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ambassadorId, tenantId } = req.promoter!;
    const { draftText, url, notes } = req.body;

    const result = await withTenantContext({ tenantId }, async (tx) => {
      const existing = await tx.promoterSubmission.findFirst({
        where: { id: req.params.id, ambassadorId, tenantId },
      });
      if (!existing) {
        throw Object.assign(new Error('Submission not found'), { status: 404 });
      }
      if (existing.status !== 'REJECTED') {
        throw Object.assign(new Error('Only REJECTED submissions can be revised'), { status: 400 });
      }

      return tx.promoterSubmission.update({
        where: { id: req.params.id },
        data: {
          draftText: draftText ?? existing.draftText,
          url: url ?? existing.url,
          notes: notes ?? existing.notes,
          status: 'PENDING',
          reviewedBy: null,
          reviewedAt: null,
          reviewNotes: null,
        },
      });
    });

    return res.status(200).json(result);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
