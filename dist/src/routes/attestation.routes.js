"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Supervisory Attestations
//
// POST /api/influwatch/certifications   — create attestation
// GET  /api/influwatch/certifications   — list attestations
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const AttestationService = __importStar(require("../services/attestation.service"));
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// POST /certifications
//
// Record a new supervisory attestation.
// Required: principalId, periodLabel, periodStart, periodEnd, promotersInScope
// Optional: supervisoryNote
// ─────────────────────────────────────────
router.post('/', (0, requireRole_1.requireRole)(client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.DESIGNATED_SUPERVISOR, client_1.InternalActorRole.TENANT_ADMIN), async (req, res, next) => {
    try {
        const { periodLabel, periodStart, periodEnd, promotersInScope, supervisoryNote } = req.body;
        const principalId = req.user.id;
        if (!periodLabel)
            return res.status(400).json({ error: 'periodLabel is required' });
        if (!periodStart)
            return res.status(400).json({ error: 'periodStart is required' });
        if (!periodEnd)
            return res.status(400).json({ error: 'periodEnd is required' });
        if (promotersInScope == null)
            return res.status(400).json({ error: 'promotersInScope is required' });
        const attestation = await AttestationService.createAttestation({
            principalId,
            periodLabel,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            promotersInScope: Number(promotersInScope),
            supervisoryNote,
        });
        return res.status(201).json(attestation);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// GET /certifications
//
// List all supervisory attestations, newest first.
// Optional: ?period=Q1+2026 filters by periodLabel (exact match).
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const period = req.query.period;
        const attestations = await AttestationService.listAttestations(period);
        return res.status(200).json({ count: attestations.length, attestations });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=attestation.routes.js.map