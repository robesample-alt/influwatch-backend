"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Routes — Promoter Submissions (Internal Actor side)
//
// CCO/principal-facing routes for reviewing promoter portal
// submissions and sending portal invitations.
// All routes require internal actor JWT (authenticate middleware).
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenantContext_1 = require("../utils/tenantContext");
const promoterAuth_1 = require("../utils/promoterAuth");
const mailer_1 = require("../utils/mailer");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /promoter-submissions
// List promoter submissions for the tenant.
// Optional ?status=PENDING|APPROVED|REJECTED filter.
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const status = req.query.status;
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.promoterSubmission.findMany({
                where: {
                    tenantId,
                    ...(status ? { status } : {}),
                },
                include: {
                    ambassador: { select: { id: true, displayName: true, handle: true, primaryPlatform: true } },
                    reviewer: { select: { id: true, displayName: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        });
        return res.status(200).json({ count: result.length, submissions: result });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// PATCH /promoter-submissions/:id/review
// Approve or reject a submission.
// ─────────────────────────────────────────
router.patch('/:id/review', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const actorId = req.user.id;
        const { status, reviewNotes } = req.body;
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'status must be APPROVED or REJECTED' });
        }
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            const existing = await tx.promoterSubmission.findFirst({
                where: { id: req.params.id, tenantId },
            });
            if (!existing) {
                throw Object.assign(new Error('Submission not found'), { status: 404 });
            }
            return tx.promoterSubmission.update({
                where: { id: req.params.id },
                data: {
                    status,
                    reviewNotes: reviewNotes ?? null,
                    reviewedBy: actorId,
                    reviewedAt: new Date(),
                },
                include: {
                    ambassador: { select: { displayName: true, handle: true } },
                    reviewer: { select: { displayName: true } },
                },
            });
        });
        return res.status(200).json(result);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ error: err.message });
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /promoter-submissions/send-invite
// Send a portal invite (magic link) to a promoter.
// Body: { ambassadorId: string, email: string }
// ─────────────────────────────────────────
router.post('/send-invite', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const { ambassadorId, email } = req.body;
        if (!ambassadorId || !email) {
            return res.status(400).json({ error: 'ambassadorId and email are required' });
        }
        const normalized = email.trim().toLowerCase();
        const result = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            const ambassador = await tx.ambassadorProfile.findFirst({
                where: { id: ambassadorId, tenantId },
            });
            if (!ambassador) {
                throw Object.assign(new Error('Ambassador not found'), { status: 404 });
            }
            const tenant = await tx.tenant.findFirst({
                where: { id: tenantId },
                select: { firmName: true },
            });
            const { token, tokenHash } = (0, promoterAuth_1.generateMagicLinkToken)();
            const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h for invite
            await tx.promoterMagicLink.create({
                data: {
                    ambassadorId,
                    tenantId,
                    email: normalized,
                    tokenHash,
                    expiresAt,
                },
            });
            return { ambassador, tenant, token };
        });
        await (0, mailer_1.sendPromoterInvite)({
            email: normalized,
            promoterName: result.ambassador.displayName,
            firmName: result.tenant?.firmName || 'Your firm',
            token: result.token,
        });
        logger_1.default.info({ ambassadorId }, 'Portal invite sent by internal actor');
        return res.status(200).json({ ok: true, message: 'Invite sent' });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ error: err.message });
        next(err);
    }
});
// ─────────────────────────────────────────
// GET /promoter-submissions/portal-status/:ambassadorId
// Returns INVITED / ACTIVE / NOT_INVITED for a promoter.
// ─────────────────────────────────────────
router.get('/portal-status/:ambassadorId', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const ambassadorId = req.params.ambassadorId;
        const links = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
            return tx.promoterMagicLink.findMany({
                where: { ambassadorId, tenantId },
                orderBy: { createdAt: 'desc' },
            });
        });
        let status = 'NOT_INVITED';
        if (links.some(l => l.usedAt !== null)) {
            status = 'ACTIVE';
        }
        else if (links.length > 0) {
            status = 'INVITED';
        }
        return res.status(200).json({ status, lastInvitedAt: links[0]?.createdAt ?? null });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=promoterSubmissions.routes.js.map