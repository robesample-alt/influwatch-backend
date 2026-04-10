// ============================================================
// FUNDUREX — INFLUWATCH
// Utils — Promoter JWT auth (separate from internal actor auth)
//
// Promoter tokens have a 'PROMOTER' role and carry ambassadorId
// instead of internal actor id. They expire in 7 days. The token
// payload is intentionally distinct from ActorTokenPayload to
// prevent the two auth surfaces from being interchangeable.
// ============================================================

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface PromoterTokenPayload {
  ambassadorId: string;
  tenantId:     string;
  email:        string;
  role:         'PROMOTER';
}

export function signPromoterToken(payload: Omit<PromoterTokenPayload, 'role'>): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');

  return jwt.sign(
    { ambassadorId: payload.ambassadorId, tenantId: payload.tenantId, email: payload.email, role: 'PROMOTER' },
    secret,
    { expiresIn: '7d' }
  );
}

export function verifyPromoterToken(token: string): PromoterTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');

  const decoded = jwt.verify(token, secret) as PromoterTokenPayload;
  if (decoded.role !== 'PROMOTER') {
    throw new Error('Not a promoter token');
  }
  return {
    ambassadorId: decoded.ambassadorId,
    tenantId:     decoded.tenantId,
    email:        decoded.email,
    role:         'PROMOTER',
  };
}

// ── Magic link helpers ────────────────────────────────────────

export function generateMagicLinkToken(): { token: string; tokenHash: string } {
  // Generate 32 random bytes — base64url-encoded for the URL
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashMagicLinkToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
