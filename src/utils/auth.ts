// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Utils — JWT auth
//
// signToken   — issue a signed JWT for an internal actor
// verifyToken — verify and decode a JWT, throws if invalid
//
// Secret is read from process.env.JWT_SECRET at call time.
// ============================================================

import jwt from 'jsonwebtoken';

export interface ActorTokenPayload {
  id:    string;
  role:  string;
  email: string;
}

export function signToken(actor: ActorTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');

  return jwt.sign(
    { id: actor.id, role: actor.role, email: actor.email },
    secret,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): ActorTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');

  const decoded = jwt.verify(token, secret) as ActorTokenPayload;
  return { id: decoded.id, role: decoded.role, email: decoded.email };
}
