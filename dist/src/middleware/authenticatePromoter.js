"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Middleware — Promoter JWT authentication
//
// Validates the promoter JWT and attaches { ambassadorId, tenantId,
// email } to req.promoter. Separate from authenticate (internal
// actor) — the two auth surfaces share the JWT_SECRET but have
// distinct token payloads and routes never overlap.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticatePromoter = authenticatePromoter;
const promoterAuth_1 = require("../utils/promoterAuth");
function authenticatePromoter(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        req.promoter = (0, promoterAuth_1.verifyPromoterToken)(token);
        next();
    }
    catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
//# sourceMappingURL=authenticatePromoter.js.map