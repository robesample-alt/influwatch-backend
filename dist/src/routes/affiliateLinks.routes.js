"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Affiliate Links
//
// GET   /api/influwatch/affiliate-links                    — list all (optional ?promoterId=)
// POST  /api/influwatch/affiliate-links                    — create new affiliate link
// PATCH /api/influwatch/affiliate-links/:id/deactivate     — set active = false
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /affiliate-links
//
// List all affiliate links, newest first.
// Optional: ?promoterId= filters to one promoter.
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const promoterId = req.query.promoterId;
        const links = await prisma_1.default.affiliateLink.findMany({
            where: promoterId ? { promoterId } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ count: links.length, links });
    }
    catch (err) {
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
router.post('/', async (req, res, next) => {
    try {
        const { url, promoterId, campaignId, compensationStructureId, isSecuritiesOffering, offeringType, linkType, } = req.body;
        if (!url)
            return res.status(400).json({ error: 'url is required' });
        if (!promoterId)
            return res.status(400).json({ error: 'promoterId is required' });
        if (!linkType)
            return res.status(400).json({ error: 'linkType is required' });
        const link = await prisma_1.default.affiliateLink.create({
            data: {
                url,
                promoterId,
                campaignId: campaignId ?? null,
                compensationStructureId: compensationStructureId ?? null,
                isSecuritiesOffering: Boolean(isSecuritiesOffering ?? false),
                offeringType: offeringType ?? null,
                linkType,
                active: true,
            },
        });
        return res.status(201).json(link);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// PATCH /affiliate-links/:id/deactivate
//
// Deactivate an affiliate link.
// Sets active = false — does not delete the record.
// ─────────────────────────────────────────
router.patch('/:id/deactivate', async (req, res, next) => {
    try {
        const existing = await prisma_1.default.affiliateLink.findUnique({
            where: { id: req.params.id },
            select: { id: true, active: true },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Affiliate link not found', id: req.params.id });
        }
        const link = await prisma_1.default.affiliateLink.update({
            where: { id: req.params.id },
            data: { active: false },
        });
        return res.status(200).json(link);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=affiliateLinks.routes.js.map