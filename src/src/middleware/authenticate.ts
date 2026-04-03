// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Middleware — JWT authentication
//
// Reads the Authorization: Bearer <token> header, verifies the
// JWT, and attaches the decoded payload to req.user.
//
// Returns 401 if the header is missing, malformed, or the
// token is invalid or expired.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { verifyToken, ActorTokenPayload } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      user?: ActorTokenPayload;
    }
  }
}

export function authenticate(
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
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
