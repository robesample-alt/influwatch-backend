"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Utils — Promoter JWT auth (separate from internal actor auth)
//
// Promoter tokens have a 'PROMOTER' role and carry ambassadorId
// instead of internal actor id. They expire in 7 days. The token
// payload is intentionally distinct from ActorTokenPayload to
// prevent the two auth surfaces from being interchangeable.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signPromoterToken = signPromoterToken;
exports.verifyPromoterToken = verifyPromoterToken;
exports.generateMagicLinkToken = generateMagicLinkToken;
exports.hashMagicLinkToken = hashMagicLinkToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
function signPromoterToken(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET environment variable is not set');
    return jsonwebtoken_1.default.sign({ ambassadorId: payload.ambassadorId, tenantId: payload.tenantId, email: payload.email, role: 'PROMOTER' }, secret, { expiresIn: '7d' });
}
function verifyPromoterToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET environment variable is not set');
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    if (decoded.role !== 'PROMOTER') {
        throw new Error('Not a promoter token');
    }
    return {
        ambassadorId: decoded.ambassadorId,
        tenantId: decoded.tenantId,
        email: decoded.email,
        role: 'PROMOTER',
    };
}
// ── Magic link helpers ────────────────────────────────────────
function generateMagicLinkToken() {
    // Generate 32 random bytes — base64url-encoded for the URL
    const token = crypto_1.default.randomBytes(32).toString('base64url');
    const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
}
function hashMagicLinkToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
//# sourceMappingURL=promoterAuth.js.map