import { Request, Response, NextFunction } from 'express';
import { InternalActorRole } from '@prisma/client';
export declare function requireRole(...roles: InternalActorRole[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=requireRole.d.ts.map