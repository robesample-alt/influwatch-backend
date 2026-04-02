import { Request, Response, NextFunction } from 'express';
import { ActorTokenPayload } from '../utils/auth';
declare global {
    namespace Express {
        interface Request {
            user?: ActorTokenPayload;
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=authenticate.d.ts.map