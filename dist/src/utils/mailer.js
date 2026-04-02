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
//# sourceMappingURL=mailer.js.map