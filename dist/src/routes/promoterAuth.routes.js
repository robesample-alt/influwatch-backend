"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Routes — Promoter Portal Auth
//
// Magic-link authentication for promoter-facing portal.
// These routes are PUBLIC (no internal actor JWT required).
// Tenant resolution happens via the email lookup, not via
// a tenant header — promoters cannot specify their own tenant.
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
// POST /promoter-auth/request-link
//
// Public. Accepts an email, looks up matching ambassador profile
// across all tenants, generates a magic link, sends via email.
// Always returns 200 — never reveals whether the email exists.
// ─────────────────────────────────────────
router.post('/auth/request-link', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'email is required' });
        }
        const normalized = email.trim().toLowerCase();
        // Find ambassador by email handle or recorded email
        // (AmbassadorProfile.handle is the social handle, not email — we look
        //  for any matching ambassadorEmail field if it exists, otherwise
        //  fall back to handle equality)
        const ambassador = await (0, tenantContext_1.withSystemContext)('Promoter portal — magic link lookup', async (tx) => {
            // Try email-like fields first
            return tx.ambassadorProfile.findFirst({
                where: { handle: { equals: normalized, mode: 'insensitive' } },
                select: { id: true, tenantId: true, displayName: true },
            });
        });
        if (!ambassador) {
            // Silent — never reveal whether the email exists
            return res.status(200).json({ message: 'If this email is registered, a login link has been sent.' });
        }
        // Generate token
        const { token, tokenHash } = (0, promoterAuth_1.generateMagicLinkToken)();
        // Determine expiry — 72h for first invite, 60min for subsequent
        const previousLinks = await (0, tenantContext_1.withTenantContext)({ tenantId: ambassador.tenantId }, async (tx) => {
            return tx.promoterMagicLink.count({
                where: { ambassadorId: ambassador.id, usedAt: { not: null } },
            });
        });
        const expiryHours = previousLinks === 0 ? 72 : 1;
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
        await (0, tenantContext_1.withTenantContext)({ tenantId: ambassador.tenantId }, async (tx) => {
            await tx.promoterMagicLink.create({
                data: {
                    ambassadorId: ambassador.id,
                    tenantId: ambassador.tenantId,
                    email: normalized,
                    tokenHash,
                    expiresAt,
                },
            });
        });
        // Send the email
        if (previousLinks === 0) {
            // Need firm name for invite — fetch tenant
            const tenant = await (0, tenantContext_1.withSystemContext)('Promoter invite — tenant lookup', async (tx) => {
                return tx.tenant.findFirst({ where: { id: ambassador.tenantId }, select: { firmName: true } });
            });
            await (0, mailer_1.sendPromoterInvite)({
                email: normalized,
                promoterName: ambassador.displayName,
                firmName: tenant?.firmName || 'Your firm',
                token,
            });
        }
        else {
            await (0, mailer_1.sendPromoterLoginLink)({
                email: normalized,
                promoterName: ambassador.displayName,
                token,
            });
        }
        logger_1.default.info({ ambassadorId: ambassador.id }, 'Promoter magic link sent');
        return res.status(200).json({ message: 'If this email is registered, a login link has been sent.' });
    }
    catch (err) {
        logger_1.default.error({ err }, 'Promoter request-link error');
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /promoter/auth/verify
//
// Public. Accepts a token, validates against promoter_magic_links,
// marks it used, returns a promoter JWT.
// ─────────────────────────────────────────
router.post('/auth/verify', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'token is required' });
        }
        const tokenHash = (0, promoterAuth_1.hashMagicLinkToken)(token);
        const link = await (0, tenantContext_1.withSystemContext)('Promoter token verify', async (tx) => {
            return tx.promoterMagicLink.findFirst({
                where: { tokenHash },
                include: {
                    ambassador: { select: { id: true, displayName: true, tenantId: true } },
                },
            });
        });
        if (!link) {
            return res.status(401).json({ error: 'Invalid or expired link' });
        }
        if (link.usedAt) {
            return res.status(401).json({ error: 'Link already used' });
        }
        if (link.expiresAt < new Date()) {
            return res.status(401).json({ error: 'Link expired' });
        }
        // Mark used
        await (0, tenantContext_1.withTenantContext)({ tenantId: link.tenantId }, async (tx) => {
            await tx.promoterMagicLink.update({
                where: { id: link.id },
                data: { usedAt: new Date() },
            });
        });
        // Issue promoter JWT
        const jwt = (0, promoterAuth_1.signPromoterToken)({
            ambassadorId: link.ambassadorId,
            tenantId: link.tenantId,
            email: link.email,
        });
        return res.status(200).json({
            token: jwt,
            promoter: {
                id: link.ambassadorId,
                displayName: link.ambassador.displayName,
                email: link.email,
            },
        });
    }
    catch (err) {
        logger_1.default.error({ err }, 'Promoter verify error');
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=promoterAuth.routes.js.map