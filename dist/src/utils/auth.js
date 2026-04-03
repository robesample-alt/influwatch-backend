"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Utils — JWT auth
//
// signToken   — issue a signed JWT for an internal actor
// verifyToken — verify and decode a JWT, throws if invalid
//
// Secret is read from process.env.JWT_SECRET at call time.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signToken(actor) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET environment variable is not set');
    return jsonwebtoken_1.default.sign({ id: actor.id, role: actor.role, email: actor.email, tenantId: actor.tenantId }, secret, { expiresIn: '24h' });
}
function verifyToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET environment variable is not set');
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    return { id: decoded.id, role: decoded.role, email: decoded.email, tenantId: decoded.tenantId };
}
//# sourceMappingURL=auth.js.map