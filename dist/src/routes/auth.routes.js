"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Route handlers — Authentication
//
// POST /api/influwatch/auth/login
// Returns a signed JWT for a valid internal actor.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../utils/auth");
// ─────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'email and password are required' });
        return;
    }
    const actor = await prisma_1.default.internalActor.findUnique({
        where: { email },
        select: { id: true, displayName: true, email: true, role: true, status: true, passwordHash: true },
    });
    if (!actor || !actor.passwordHash) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const passwordValid = await bcrypt_1.default.compare(password, actor.passwordHash);
    if (!passwordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const token = (0, auth_1.signToken)({ id: actor.id, role: actor.role, email: actor.email });
    res.status(200).json({
        token,
        actor: {
            id: actor.id,
            displayName: actor.displayName,
            email: actor.email,
            role: actor.role,
        },
    });
}
//# sourceMappingURL=auth.routes.js.map