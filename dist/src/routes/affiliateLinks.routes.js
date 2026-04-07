"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Affiliate Links
//
// GET   /api/influwatch/affiliate-links                    — list all (optional ?promoterId=)
// POST  /api/influwatch/affiliate-links                    — create new affiliate link
// PATCH /api/influwatch/affiliate-links/:id/deactivate     — set active = false
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenantContext_1 = require("../utils/tenantContext");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /affiliate-links
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const promoterId = req.query.promoterId;
        const links = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.affiliateLink.findMany({
                where: { tenantId, ...(promoterId ? { promoterId } : {}) },
                orderBy: { createdAt: 'desc' },
            });
        });
        return res.status(200).json({ count: links.length, links });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /affiliate-links
// ─────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { url, referralCode, promoterId, campaignId, compensationStructureId, isSecuritiesOffering, offeringType, linkType, } = req.body;
        const tenantId = req.user.tenantId;
        if (!url)
            return res.status(400).json({ error: 'url is required' });
        if (!promoterId)
            return res.status(400).json({ error: 'promoterId is required' });
        if (!linkType)
            return res.status(400).json({ error: 'linkType is required' });
        const link = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.affiliateLink.create({
                data: {
                    tenantId,
                    url,
                    referralCode: referralCode ?? null,
                    promoterId,
                    campaignId: campaignId ?? null,
                    compensationStructureId: compensationStructureId ?? null,
                    isSecuritiesOffering: Boolean(isSecuritiesOffering ?? false),
                    offeringType: offeringType ?? null,
                    linkType,
                    active: true,
                },
            });
        });
        return res.status(201).json(link);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// PATCH /affiliate-links/:id/deactivate
// ─────────────────────────────────────────
router.patch('/:id/deactivate', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const link = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            const existing = await tx.affiliateLink.findFirst({
                where: { id: req.params.id, tenantId },
                select: { id: true, active: true },
            });
            if (!existing)
                return null;
            return tx.affiliateLink.update({
                where: { id: req.params.id },
                data: { active: false },
            });
        });
        if (!link) {
            return res.status(404).json({ error: 'Affiliate link not found', id: req.params.id });
        }
        return res.status(200).json(link);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// PATCH /affiliate-links/:id/confirm
// Confirms an auto-discovered link — sets active=true, linkStatus=CONFIRMED
// ─────────────────────────────────────────
router.patch('/:id/confirm', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const link = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            const existing = await tx.affiliateLink.findFirst({
                where: { id: req.params.id, tenantId },
            });
            if (!existing)
                return null;
            return tx.affiliateLink.update({
                where: { id: req.params.id },
                data: { active: true, linkStatus: 'CONFIRMED' },
            });
        });
        if (!link)
            return res.status(404).json({ error: 'Not found' });
        return res.json(link);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// PATCH /affiliate-links/:id/dismiss
// Dismisses an auto-discovered link — sets linkStatus=DISMISSED, keeps inactive
// ─────────────────────────────────────────
router.patch('/:id/dismiss', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const link = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            const existing = await tx.affiliateLink.findFirst({
                where: { id: req.params.id, tenantId },
            });
            if (!existing)
                return null;
            return tx.affiliateLink.update({
                where: { id: req.params.id },
                data: { active: false, linkStatus: 'DISMISSED' },
            });
        });
        if (!link)
            return res.status(404).json({ error: 'Not found' });
        return res.json(link);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=affiliateLinks.routes.js.map