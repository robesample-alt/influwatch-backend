"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Utils — Email alerts (Resend)
//
// All functions are no-ops if RESEND_API_KEY is not set.
// Safe to deploy without configuring email.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEscalationAlert = sendEscalationAlert;
exports.sendPromoterInvite = sendPromoterInvite;
exports.sendPromoterLoginLink = sendPromoterLoginLink;
const resend_1 = require("resend");
let client = null;
function getClient() {
    if (!process.env.RESEND_API_KEY)
        return null;
    if (!client)
        client = new resend_1.Resend(process.env.RESEND_API_KEY);
    return client;
}
const FROM = process.env.ALERT_EMAIL_FROM ?? 'alerts@influwatch.fundurex.com';
const TO_LIST = (process.env.ALERT_EMAIL_TO ?? '').split(',').map(e => e.trim()).filter(Boolean);
async function sendEscalationAlert(opts) {
    const resend = getClient();
    if (!resend || TO_LIST.length === 0)
        return; // silent no-op
    const subject = `[InfluWatch] Escalation: ${opts.level} — ${opts.ambassadorId}`;
    const text = [
        `A content record has been escalated.`,
        ``,
        `Record ID   : ${opts.recordId}`,
        `Ambassador  : ${opts.ambassadorId}`,
        `Level       : ${opts.level}`,
        `Rules hit   : ${opts.ruleCodes.join(', ')}`,
        ``,
        `Log in to InfluWatch to review this record.`,
    ].join('\n');
    try {
        await resend.emails.send({ from: FROM, to: TO_LIST, subject, text });
    }
    catch (err) {
        // Log but do not throw — email failure must never break the API response
        console.error('[mailer] Failed to send escalation alert:', err);
    }
}
// ── Promoter Portal — magic link emails ───────────────────────
const PORTAL_URL = process.env.PORTAL_URL ?? 'https://portal.influwatch.app';
async function sendPromoterInvite(opts) {
    const resend = getClient();
    if (!resend)
        return; // silent no-op
    const link = `${PORTAL_URL}/?token=${encodeURIComponent(opts.token)}`;
    const subject = `You've been invited to the InfluWatch compliance portal`;
    const text = [
        `Hi ${opts.promoterName},`,
        ``,
        `${opts.firmName} has registered you as a promoter in their compliance supervision system.`,
        ``,
        `Click the link below to access your portal. It expires in 72 hours.`,
        ``,
        link,
        ``,
        `If you weren't expecting this email, you can safely ignore it.`,
        ``,
        `— The InfluWatch team`,
    ].join('\n');
    try {
        await resend.emails.send({ from: FROM, to: opts.email, subject, text });
    }
    catch (err) {
        console.error('[mailer] Failed to send promoter invite:', err);
    }
}
async function sendPromoterLoginLink(opts) {
    const resend = getClient();
    if (!resend)
        return;
    const link = `${PORTAL_URL}/?token=${encodeURIComponent(opts.token)}`;
    const subject = `Your InfluWatch login link`;
    const text = [
        `Hi ${opts.promoterName},`,
        ``,
        `Here's your login link. It expires in 60 minutes.`,
        ``,
        link,
        ``,
        `If you didn't request this, you can safely ignore it.`,
        ``,
        `— The InfluWatch team`,
    ].join('\n');
    try {
        await resend.emails.send({ from: FROM, to: opts.email, subject, text });
    }
    catch (err) {
        console.error('[mailer] Failed to send promoter login link:', err);
    }
}
//# sourceMappingURL=mailer.js.map