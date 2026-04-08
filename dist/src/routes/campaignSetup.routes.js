"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Routes — Campaign Supervision Setup
//
// POST   /campaigns/:id/promoters     — assign promoter
// GET    /campaigns/:id/promoters     — list assignments
// DELETE /campaigns/:id/promoters/:pid — remove (soft)
// POST   /campaigns/:id/policy        — create/update policy
// GET    /campaigns/:id/policy        — get policy
// POST   /campaigns/:id/activate      — activate campaign
// POST   /campaigns/:id/pause         — pause campaign
// GET    /campaigns/:id/setup-status  — checklist status
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenantContext_1 = require("../utils/tenantContext");
const requireRole_1 = require("../middleware/requireRole");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// POST /campaigns/:id/promoters
// ─────────────────────────────────────────
router.post('/:id/promoters', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const campaignId = req.params.id;
        const { promoterId, compensationStructureId, assignedPrincipalId, agreementReference } = req.body;
        if (!promoterId || !compensationStructureId) {
            return res.status(400).json({ error: 'promoterId and compensationStructureId are required' });
        }
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            // Validate campaign exists
            const campaign = await tx.campaign.findFirst({ where: { id: campaignId, tenantId } });
            if (!campaign)
                throw Object.assign(new Error('Campaign not found'), { status: 404 });
            // Validate promoter exists
            const promoter = await tx.ambassadorProfile.findFirst({ where: { id: promoterId, tenantId } });
            if (!promoter)
                throw Object.assign(new Error('Promoter not found'), { status: 404 });
            // Validate comp structure exists
            const comp = await tx.compensationStructure.findFirst({ where: { id: compensationStructureId, tenantId } });
            if (!comp)
                throw Object.assign(new Error('Compensation structure not found'), { status: 404 });
            return tx.campaignPromoter.upsert({
                where: { campaignId_promoterId: { campaignId, promoterId } },
                update: {
                    compensationStructureId,
                    assignedPrincipalId: assignedPrincipalId ?? null,
                    agreementReference: agreementReference ?? null,
                    status: 'ACTIVE',
                },
                create: {
                    tenantId, campaignId, promoterId, compensationStructureId,
                    assignedPrincipalId: assignedPrincipalId ?? null,
                    agreementReference: agreementReference ?? null,
                    updatedAt: new Date(),
                },
                include: {
                    promoter: { select: { displayName: true, handle: true } },
                    compensationStructure: { select: { compensationType: true, compensationForm: true, supervisionPosture: true } },
                    assignedPrincipal: { select: { displayName: true } },
                },
            });
        });
        return res.status(201).json(result);
    }
    catch (err) {
        if (err.status === 404)
            return res.status(404).json({ error: err.message });
        next(err);
    }
});
// ─────────────────────────────────────────
// GET /campaigns/:id/promoters
// ─────────────────────────────────────────
router.get('/:id/promoters', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.campaignPromoter.findMany({
                where: { campaignId: req.params.id, tenantId, status: 'ACTIVE' },
                include: {
                    promoter: { select: { displayName: true, handle: true, primaryPlatform: true, riskTier: true } },
                    compensationStructure: { select: { compensationType: true, compensationForm: true, supervisionPosture: true, transactionalityClass: true } },
                    assignedPrincipal: { select: { displayName: true } },
                },
                orderBy: { createdAt: 'asc' },
            });
        });
        return res.json({ count: result.length, promoters: result });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// DELETE /campaigns/:id/promoters/:pid — soft remove
// ─────────────────────────────────────────
router.delete('/:id/promoters/:pid', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            const existing = await tx.campaignPromoter.findFirst({
                where: { campaignId: req.params.id, promoterId: req.params.pid, tenantId },
            });
            if (!existing)
                return null;
            return tx.campaignPromoter.update({
                where: { id: existing.id },
                data: { status: 'REMOVED' },
            });
        });
        if (!result)
            return res.status(404).json({ error: 'Assignment not found' });
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /campaigns/:id/policy
// ─────────────────────────────────────────
router.post('/:id/policy', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const campaignId = req.params.id;
        const { allowedCompensationTypes, transactionalityTolerance, requiresPrincipalForAll } = req.body;
        if (!allowedCompensationTypes || !Array.isArray(allowedCompensationTypes)) {
            return res.status(400).json({ error: 'allowedCompensationTypes must be an array' });
        }
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.campaignPolicy.upsert({
                where: { campaignId },
                update: {
                    allowedCompensationTypes: JSON.stringify(allowedCompensationTypes),
                    transactionalityTolerance: transactionalityTolerance || 'ALLOW_ALL',
                    requiresPrincipalForAll: Boolean(requiresPrincipalForAll),
                },
                create: {
                    tenantId, campaignId,
                    allowedCompensationTypes: JSON.stringify(allowedCompensationTypes),
                    transactionalityTolerance: transactionalityTolerance || 'ALLOW_ALL',
                    requiresPrincipalForAll: Boolean(requiresPrincipalForAll),
                    updatedAt: new Date(),
                },
            });
        });
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// GET /campaigns/:id/policy
// ─────────────────────────────────────────
router.get('/:id/policy', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.campaignPolicy.findFirst({ where: { campaignId: req.params.id, tenantId } });
        });
        if (!result)
            return res.status(404).json({ error: 'No policy found for this campaign' });
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /campaigns/:id/activate
// ─────────────────────────────────────────
router.post('/:id/activate', (0, requireRole_1.requireRole)(client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.DESIGNATED_SUPERVISOR), async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const actorId = req.user.id;
        const campaignId = req.params.id;
        const { activationNote } = req.body;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            // Validate prerequisites
            const promoterCount = await tx.campaignPromoter.count({
                where: { campaignId, tenantId, status: 'ACTIVE' },
            });
            if (promoterCount === 0) {
                throw Object.assign(new Error('Cannot activate — no promoters assigned'), { status: 400 });
            }
            const policy = await tx.campaignPolicy.findFirst({ where: { campaignId, tenantId } });
            if (!policy) {
                throw Object.assign(new Error('Cannot activate — no campaign policy defined'), { status: 400 });
            }
            // Record activation on policy
            await tx.campaignPolicy.update({
                where: { id: policy.id },
                data: {
                    activatedAt: new Date(),
                    activatedByPrincipalId: actorId,
                    activationNote: activationNote || 'Campaign activated for supervision.',
                },
            });
            // Set campaign status to LIVE
            return tx.campaign.update({
                where: { id: campaignId },
                data: { status: 'LIVE' },
            });
        });
        return res.json(result);
    }
    catch (err) {
        if (err.status === 400)
            return res.status(400).json({ error: err.message });
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /campaigns/:id/pause
// ─────────────────────────────────────────
router.post('/:id/pause', (0, requireRole_1.requireRole)(client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.DESIGNATED_SUPERVISOR), async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.campaign.update({
                where: { id: req.params.id },
                data: { status: 'PAUSED' },
            });
        });
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// GET /campaigns/:id/setup-status
// ─────────────────────────────────────────
router.get('/:id/setup-status', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const campaignId = req.params.id;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            const [campaign, promoterCount, policy] = await Promise.all([
                tx.campaign.findFirst({ where: { id: campaignId, tenantId } }),
                tx.campaignPromoter.count({ where: { campaignId, tenantId, status: 'ACTIVE' } }),
                tx.campaignPolicy.findFirst({ where: { campaignId, tenantId } }),
            ]);
            return {
                campaign: campaign ? { id: campaign.id, name: campaign.campaignName, status: campaign.status } : null,
                checklist: {
                    hasPromoters: promoterCount > 0,
                    promoterCount,
                    hasPolicy: !!policy,
                    policyActivated: !!policy?.activatedAt,
                    activatedBy: policy?.activatedByPrincipalId ?? null,
                    activatedAt: policy?.activatedAt ?? null,
                },
                readyToActivate: promoterCount > 0 && !!policy,
            };
        });
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=campaignSetup.routes.js.map