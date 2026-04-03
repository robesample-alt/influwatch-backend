// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Middleware — Role-based access control
//
// requireRole(...roles) returns a middleware that returns 403
// if req.user.role is not in the allowed list.
// Must be used AFTER authenticate middleware.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { InternalActorRole } from '@prisma/client';

export function requireRole(...roles: InternalActorRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!(roles as string[]).includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient role', requiredOneOf: roles });
      return;
    }
    next();
  };
}
