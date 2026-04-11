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
const PORTAL_URL = process.env.PORTAL_URL ?? 'https://influwatch-app.vercel.app/portal.html';
function buildMagicLinkUrl(token) {
    // PORTAL_URL may already contain a path (e.g. /portal.html) — append ?token=
    const sep = PORTAL_URL.includes('?') ? '&' : '?';
    return `${PORTAL_URL}${sep}token=${encodeURIComponent(token)}`;
}
function buttonHtml(url, label) {
    return `<a href="${url}" style="background:#1F3864;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;display:inline-block;">${label}</a>`;
}
async function sendPromoterInvite(opts) {
    const resend = getClient();
    if (!resend)
        return; // silent no-op
    const magicLinkUrl = buildMagicLinkUrl(opts.token);
    const subject = `You've been invited to the InfluWatch compliance portal`;
    const text = [
        `Hi ${opts.promoterName},`,
        ``,
        `${opts.firmName} has registered you as a promoter in their compliance supervision system.`,
        ``,
        `Click the link below to access your portal. It expires in 72 hours.`,
        ``,
        magicLinkUrl,
        ``,
        `If you weren't expecting this email, you can safely ignore it.`,
        ``,
        `— The InfluWatch team`,
    ].join('\n');
    const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.5;max-width:560px;">
      <p>Hi ${opts.promoterName},</p>
      <p><strong>${opts.firmName}</strong> has registered you as a promoter in their compliance supervision system.</p>
      <p>Click the button below to access your portal. It expires in 72 hours.</p>
      <p style="margin:24px 0;">${buttonHtml(magicLinkUrl, 'Access Your Portal')}</p>
      <p style="font-size:12px;color:#666;">Or copy this link: <a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
      <p style="font-size:12px;color:#666;">If you weren't expecting this email, you can safely ignore it.</p>
      <p style="font-size:12px;color:#666;">— The InfluWatch team</p>
    </div>
  `.trim();
    try {
        await resend.emails.send({ from: FROM, to: opts.email, subject, text, html });
    }
    catch (err) {
        console.error('[mailer] Failed to send promoter invite:', err);
    }
}
async function sendPromoterLoginLink(opts) {
    const resend = getClient();
    if (!resend)
        return;
    const magicLinkUrl = buildMagicLinkUrl(opts.token);
    const subject = `Your InfluWatch login link`;
    const text = [
        `Hi ${opts.promoterName},`,
        ``,
        `Here's your login link. It expires in 60 minutes.`,
        ``,
        magicLinkUrl,
        ``,
        `If you didn't request this, you can safely ignore it.`,
        ``,
        `— The InfluWatch team`,
    ].join('\n');
    const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.5;max-width:560px;">
      <p>Hi ${opts.promoterName},</p>
      <p>Here's your login link. It expires in 60 minutes.</p>
      <p style="margin:24px 0;">${buttonHtml(magicLinkUrl, 'Log In To Portal')}</p>
      <p style="font-size:12px;color:#666;">Or copy this link: <a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
      <p style="font-size:12px;color:#666;">If you didn't request this, you can safely ignore it.</p>
      <p style="font-size:12px;color:#666;">— The InfluWatch team</p>
    </div>
  `.trim();
    try {
        await resend.emails.send({ from: FROM, to: opts.email, subject, text, html });
    }
    catch (err) {
        console.error('[mailer] Failed to send promoter login link:', err);
    }
}
//# sourceMappingURL=mailer.js.map