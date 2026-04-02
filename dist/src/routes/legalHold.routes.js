"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Legal Holds
//
// GET   /api/influwatch/legal-holds           — list all holds
// POST  /api/influwatch/legal-holds           — create new hold
// PATCH /api/influwatch/legal-holds/:id/release — release a hold
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
const LegalHoldService = __importStar(require("../services/legalHold.service"));
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /legal-holds
//
// List all legal holds, optional ?status= filter.
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const status = req.query.status;
        const holds = await LegalHoldService.listHolds(status);
        return res.status(200).json({ count: holds.length, holds });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /legal-holds
//
// Create a new legal hold.
// Required: holdName, holdType, scope, placedBy, legalAuthority, basis
// ─────────────────────────────────────────
router.post('/', (0, requireRole_1.requireRole)(client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.DESIGNATED_SUPERVISOR, client_1.InternalActorRole.COMPLIANCE_OFFICER, client_1.InternalActorRole.TENANT_ADMIN), async (req, res, next) => {
    try {
        const { holdName, holdType, scope, recordsFrozen, legalAuthority, datePlaced, basis, status, } = req.body;
        const placedBy = req.user.id;
        if (!holdName)
            return res.status(400).json({ error: 'holdName is required' });
        if (!holdType)
            return res.status(400).json({ error: 'holdType is required' });
        if (!scope)
            return res.status(400).json({ error: 'scope is required' });
        if (!legalAuthority)
            return res.status(400).json({ error: 'legalAuthority is required' });
        if (!basis)
            return res.status(400).json({ error: 'basis is required' });
        const hold = await LegalHoldService.createHold({
            holdName,
            holdType,
            scope,
            recordsFrozen: recordsFrozen != null ? Number(recordsFrozen) : 0,
            placedBy,
            legalAuthority,
            datePlaced: datePlaced ? new Date(datePlaced) : undefined,
            basis,
            status,
        });
        return res.status(201).json(hold);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// PATCH /legal-holds/:id/release
//
// Release an active hold.
// Required: releasedBy, releaseReason
// ─────────────────────────────────────────
router.patch('/:id/release', (0, requireRole_1.requireRole)(client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.COMPLIANCE_OFFICER, client_1.InternalActorRole.TENANT_ADMIN), async (req, res, next) => {
    try {
        const { releaseReason } = req.body;
        const releasedBy = req.user.id;
        if (!releaseReason)
            return res.status(400).json({ error: 'releaseReason is required' });
        const hold = await LegalHoldService.releaseHold(req.params.id, releasedBy, releaseReason);
        if (!hold) {
            return res.status(404).json({ error: 'Legal hold not found', id: req.params.id });
        }
        return res.status(200).json(hold);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=legalHold.routes.js.map