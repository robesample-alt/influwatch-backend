// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Affiliate Links
//
// GET   /api/influwatch/affiliate-links                    — list all (optional ?promoterId=)
// POST  /api/influwatch/affiliate-links                    — create new affiliate link
// PATCH /api/influwatch/affiliate-links/:id/deactivate     — set active = false
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// ─────────────────────────────────────────
// GET /affiliate-links
//
// List all affiliate links, newest first.
// Optional: ?promoterId= filters to one promoter.
// ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promoterId = req.query.promoterId as string | undefined;

    const links = await prisma.affiliateLink.findMany({
      where:   promoterId ? { promoterId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ count: links.length, links });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /affiliate-links
//
// Create a new affiliate link.
// Required: url, promoterId
// Optional: campaignId, compensationStructureId,
//           isSecuritiesOffering, offeringType, linkType
// ─────────────────────────────────────────

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      url,
      promoterId,
      campaignId,
      compensationStructureId,
      isSecuritiesOffering,
      offeringType,
      linkType,
    } = req.body;

    if (!url)        return res.status(400).json({ error: 'url is required' });
    if (!promoterId) return res.status(400).json({ error: 'promoterId is required' });
    if (!linkType)   return res.status(400).json({ error: 'linkType is required' });

    const link = await prisma.affiliateLink.create({
      data: {
        url,
        promoterId,
        campaignId:              campaignId              ?? null,
        compensationStructureId: compensationStructureId ?? null,
        isSecuritiesOffering:    Boolean(isSecuritiesOffering ?? false),
        offeringType:            offeringType            ?? null,
        linkType,
        active:                  true,
      },
    });

    return res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// PATCH /affiliate-links/:id/deactivate
//
// Deactivate an affiliate link.
// Sets active = false — does not delete the record.
// ─────────────────────────────────────────

router.patch('/:id/deactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.affiliateLink.findUnique({
      where:  { id: req.params.id },
      select: { id: true, active: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Affiliate link not found', id: req.params.id });
    }

    const link = await prisma.affiliateLink.update({
      where: { id: req.params.id },
      data:  { active: false },
    });

    return res.status(200).json(link);
  } catch (err) {
    next(err);
  }
});

export default router;
