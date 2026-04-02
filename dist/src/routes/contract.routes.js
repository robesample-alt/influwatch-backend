"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Promoter Contracts & Agreements
//
// GET  /api/influwatch/contracts      — list all contracts
// GET  /api/influwatch/contracts/:id  — single contract
// POST /api/influwatch/contracts      — create new contract
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
const ContractService = __importStar(require("../services/contract.service"));
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /contracts
//
// List all promoter contracts, newest first.
// Optional: ?ambassadorId=<id> filters to one promoter.
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const ambassadorId = req.query.ambassadorId;
        const contracts = await ContractService.listContracts(ambassadorId);
        return res.status(200).json({ count: contracts.length, contracts });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// GET /contracts/:id
//
// Retrieve a single contract by primary key.
// ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const contract = await ContractService.getContract(req.params.id);
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found', id: req.params.id });
        }
        return res.status(200).json(contract);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /contracts
//
// Create a new promoter contract.
// Required: ambassadorId, agreementType, contractId,
//           signedDate, effectiveDate
// ─────────────────────────────────────────
router.post('/', (0, requireRole_1.requireRole)(client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.DESIGNATED_SUPERVISOR, client_1.InternalActorRole.COMPLIANCE_OFFICER, client_1.InternalActorRole.TENANT_ADMIN), async (req, res, next) => {
    try {
        const { ambassadorId, agreementType, contractId, signedDate, effectiveDate, expiryDate, monitoringConsent, disclosureAck, disclosureRuleEnforced, compensationCap, compensationType, compensationRate, status, notes, } = req.body;
        if (!ambassadorId)
            return res.status(400).json({ error: 'ambassadorId is required' });
        if (!agreementType)
            return res.status(400).json({ error: 'agreementType is required' });
        if (!contractId)
            return res.status(400).json({ error: 'contractId is required' });
        if (!signedDate)
            return res.status(400).json({ error: 'signedDate is required' });
        if (!effectiveDate)
            return res.status(400).json({ error: 'effectiveDate is required' });
        const contract = await ContractService.createContract({
            ambassadorId,
            agreementType,
            contractId,
            signedDate: new Date(signedDate),
            effectiveDate: new Date(effectiveDate),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            monitoringConsent,
            disclosureAck,
            disclosureRuleEnforced,
            compensationCap: compensationCap != null ? Number(compensationCap) : null,
            compensationType,
            compensationRate,
            status,
            notes,
        });
        return res.status(201).json(contract);
    }
    catch (err) {
        // Unique constraint on contractId
        if (err?.code === 'P2002') {
            return res.status(409).json({ error: 'A contract with this contractId already exists' });
        }
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=contract.routes.js.map