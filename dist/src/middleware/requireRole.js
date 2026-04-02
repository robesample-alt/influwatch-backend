"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Middleware — Role-based access control
//
// requireRole(...roles) returns a middleware that returns 403
// if req.user.role is not in the allowed list.
// Must be used AFTER authenticate middleware.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden: insufficient role', requiredOneOf: roles });
            return;
        }
        next();
    };
}
//# sourceMappingURL=requireRole.js.map