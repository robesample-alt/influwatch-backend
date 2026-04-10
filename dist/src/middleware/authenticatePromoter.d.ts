import { Request, Response, NextFunction } from 'express';
import { PromoterTokenPayload } from '../utils/promoterAuth';
declare global {
    namespace Express {
        interface Request {
            promoter?: PromoterTokenPayload;
        }
    }
}
export declare function authenticatePromoter(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=authenticatePromoter.d.ts.map