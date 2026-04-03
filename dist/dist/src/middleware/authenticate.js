"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const auth_1 = require("../utils/auth");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        req.user = (0, auth_1.verifyToken)(token);
        next();
    }
    catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
//# sourceMappingURL=authenticate.js.map