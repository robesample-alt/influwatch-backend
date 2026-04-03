// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Utils — Email alerts (Resend)
//
// All functions are no-ops if RESEND_API_KEY is not set.
// Safe to deploy without configuring email.
// ============================================================

import { Resend } from 'resend';

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

const FROM    = process.env.ALERT_EMAIL_FROM ?? 'alerts@influwatch.fundurex.com';
const TO_LIST = (process.env.ALERT_EMAIL_TO ?? '').split(',').map(e => e.trim()).filter(Boolean);

export async function sendEscalationAlert(opts: {
  recordId:     string;
  ambassadorId: string;
  ruleCodes:    string[];
  level:        string;
}): Promise<void> {
  const resend = getClient();
  if (!resend || TO_LIST.length === 0) return; // silent no-op

  const subject = `[InfluWatch] Escalation: ${opts.level} — ${opts.ambassadorId}`;
  const text    = [
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
  } catch (err) {
    // Log but do not throw — email failure must never break the API response
    console.error('[mailer] Failed to send escalation alert:', err);
  }
}
