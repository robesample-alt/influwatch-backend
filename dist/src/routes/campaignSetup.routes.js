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
// POST /campaigns — create new campaign
// ─────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { campaignName, campaignType } = req.body;
        if (!campaignName || !campaignType) {
            return res.status(400).json({ error: 'campaignName and campaignType are required' });
        }
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.campaign.create({
                data: {
                    tenantId,
                    campaignName,
                    campaignType,
                    status: 'DRAFT',
                },
            });
        });
        return res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// GET /campaigns — list all campaigns
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.campaign.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                select: { id: true, campaignName: true, campaignType: true, status: true, createdAt: true },
            });
        });
        return res.json({ campaigns: result });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// GET /campaigns/overview
// Cross-campaign supervisory dashboard. Returns each campaign with
// counts of promoters, content this week, pending review, principal
// required, last activity, and a derived risk level for sorting.
// All aggregations run in a single tenant-scoped transaction.
// ─────────────────────────────────────────
router.get('/overview', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            // Single fetch of campaigns + grouped aggregations.
            const campaigns = await tx.campaign.findMany({
                where: { tenantId },
                select: {
                    id: true,
                    campaignName: true,
                    campaignType: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            if (campaigns.length === 0)
                return { campaigns: [], summary: { totalActive: 0, totalPendingReview: 0, totalPrincipalRequired: 0, totalPromoters: 0 } };
            const campaignIds = campaigns.map(c => c.id);
            // Promoter counts per campaign
            const promoterGroups = await tx.campaignPromoter.groupBy({
                by: ['campaignId'],
                where: { tenantId, campaignId: { in: campaignIds }, status: 'ACTIVE' },
                _count: { _all: true },
            });
            const promoterCountMap = new Map();
            for (const g of promoterGroups) {
                if (g.campaignId)
                    promoterCountMap.set(g.campaignId, g._count._all);
            }
            // Content this week (last 7 days) per campaign
            const contentWeekGroups = await tx.contentRecord.groupBy({
                by: ['campaignId'],
                where: {
                    tenantId,
                    campaignId: { in: campaignIds },
                    capturedAt: { gte: sevenDaysAgo },
                },
                _count: { _all: true },
            });
            const contentWeekMap = new Map();
            for (const g of contentWeekGroups) {
                if (g.campaignId)
                    contentWeekMap.set(g.campaignId, g._count._all);
            }
            // Pending review per campaign
            const pendingGroups = await tx.contentRecord.groupBy({
                by: ['campaignId'],
                where: {
                    tenantId,
                    campaignId: { in: campaignIds },
                    archiveStatus: 'PENDING_REVIEW',
                },
                _count: { _all: true },
            });
            const pendingMap = new Map();
            for (const g of pendingGroups) {
                if (g.campaignId)
                    pendingMap.set(g.campaignId, g._count._all);
            }
            // Principal required per campaign (only counted while still pending)
            const principalGroups = await tx.contentRecord.groupBy({
                by: ['campaignId'],
                where: {
                    tenantId,
                    campaignId: { in: campaignIds },
                    requiresPrincipalReview: true,
                    archiveStatus: 'PENDING_REVIEW',
                },
                _count: { _all: true },
            });
            const principalMap = new Map();
            for (const g of principalGroups) {
                if (g.campaignId)
                    principalMap.set(g.campaignId, g._count._all);
            }
            // Last activity (max capturedAt) per campaign
            const lastActivityGroups = await tx.contentRecord.groupBy({
                by: ['campaignId'],
                where: { tenantId, campaignId: { in: campaignIds } },
                _max: { capturedAt: true },
            });
            const lastActivityMap = new Map();
            for (const g of lastActivityGroups) {
                if (g.campaignId)
                    lastActivityMap.set(g.campaignId, g._max.capturedAt);
            }
            // Build per-campaign overview rows
            const enriched = campaigns.map(c => {
                const promoterCount = promoterCountMap.get(c.id) ?? 0;
                const contentThisWeek = contentWeekMap.get(c.id) ?? 0;
                const pendingReview = pendingMap.get(c.id) ?? 0;
                const principalRequired = principalMap.get(c.id) ?? 0;
                const lastActivity = lastActivityMap.get(c.id) ?? null;
                let riskLevel;
                if (principalRequired > 0)
                    riskLevel = 'CRITICAL';
                else if (pendingReview > 10)
                    riskLevel = 'HIGH';
                else if (pendingReview > 0)
                    riskLevel = 'MEDIUM';
                else
                    riskLevel = 'LOW';
                return {
                    id: c.id,
                    campaignName: c.campaignName,
                    campaignType: c.campaignType,
                    status: c.status,
                    createdAt: c.createdAt,
                    promoterCount,
                    contentThisWeek,
                    pendingReview,
                    principalRequired,
                    lastActivity,
                    riskLevel,
                };
            });
            // Tenant-wide summary metrics
            const ACTIVE_STATUSES = new Set(['LIVE', 'APPROVED']);
            const summary = {
                totalActive: enriched.filter(e => ACTIVE_STATUSES.has(e.status)).length,
                totalPendingReview: enriched.reduce((acc, e) => acc + e.pendingReview, 0),
                totalPrincipalRequired: enriched.reduce((acc, e) => acc + e.principalRequired, 0),
                totalPromoters: enriched.reduce((acc, e) => acc + e.promoterCount, 0),
            };
            return { campaigns: enriched, summary };
        });
        return res.json(result);
    }
    catch (err) {
        next(err);
    }
});
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
            // ── Readiness gate ──────────────────────────────────────
            const issues = [];
            const activePromoters = await tx.campaignPromoter.findMany({
                where: { campaignId, tenantId, status: 'ACTIVE' },
                include: { compensationStructure: { select: { id: true } } },
            });
            if (activePromoters.length === 0) {
                issues.push('No active promoters assigned to this campaign');
            }
            const missingComp = activePromoters.filter(p => !p.compensationStructureId);
            if (missingComp.length > 0) {
                issues.push(`${missingComp.length} promoter(s) missing compensation structure`);
            }
            const policy = await tx.campaignPolicy.findFirst({ where: { campaignId, tenantId } });
            if (!policy) {
                issues.push('No campaign policy defined');
            }
            if (policy && !policy.activatedByPrincipalId && !actorId) {
                issues.push('Campaign policy has no assigned principal');
            }
            if (issues.length > 0) {
                throw Object.assign(new Error('Campaign not ready to activate'), { status: 400, issues });
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
        if (err.status === 400) {
            return res.status(400).json({
                error: err.message,
                issues: err.issues || [err.message],
            });
        }
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