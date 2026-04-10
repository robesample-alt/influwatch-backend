// ============================================================
// FUNDUREX — INFLUWATCH
// Middleware — Promoter JWT authentication
//
// Validates the promoter JWT and attaches { ambassadorId, tenantId,
// email } to req.promoter. Separate from authenticate (internal
// actor) — the two auth surfaces share the JWT_SECRET but have
// distinct token payloads and routes never overlap.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { verifyPromoterToken, PromoterTokenPayload } from '../utils/promoterAuth';

declare global {
  namespace Express {
    interface Request {
      promoter?: PromoterTokenPayload;
    }
  }
}

export function authenticatePromoter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.promoter = verifyPromoterToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
