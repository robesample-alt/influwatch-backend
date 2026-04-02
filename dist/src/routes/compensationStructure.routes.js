"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Compensation Structures
//
// GET  /api/influwatch/compensation-structures              — list all
// POST /api/influwatch/compensation-structures              — create new
// GET  /api/influwatch/compensation-structures/:promoterId  — get by promoter
//
// Classification is always computed server-side from compensationForm,
// compensationTrigger, and productType. Classification fields in the
// request body are silently ignored.
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
const CompensationService = __importStar(require("../services/compensationStructure.service"));
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /compensation-structures
//
// List all compensation structures, newest first.
// Each record includes ambassador profile details.
// ─────────────────────────────────────────
router.get('/', async (_req, res, next) => {
    try {
        const structures = await CompensationService.listCompensationStructures();
        return res.status(200).json({ count: structures.length, structures });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /compensation-structures
//
// Create a new compensation structure for a promoter.
// Required: promoterId, compensationForm, compensationTrigger,
//           productType, writtenAgreementRequired
// Optional: campaignId, agreementReference, notes
//
// Classification fields (isTransactionBased, isSecurityLinked, etc.)
// are always computed — never read from the request body.
// ─────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { promoterId, campaignId, compensationForm, compensationTrigger, productType, writtenAgreementRequired, agreementReference, notes, } = req.body;
        if (!promoterId)
            return res.status(400).json({ error: 'promoterId is required' });
        if (!compensationForm)
            return res.status(400).json({ error: 'compensationForm is required' });
        if (!compensationTrigger)
            return res.status(400).json({ error: 'compensationTrigger is required' });
        if (!productType)
            return res.status(400).json({ error: 'productType is required' });
        if (writtenAgreementRequired === undefined || writtenAgreementRequired === null) {
            return res.status(400).json({ error: 'writtenAgreementRequired is required' });
        }
        const structure = await CompensationService.createCompensationStructure({
            promoterId,
            campaignId: campaignId ?? null,
            compensationForm,
            compensationTrigger,
            productType,
            writtenAgreementRequired: Boolean(writtenAgreementRequired),
            agreementReference: agreementReference ?? null,
            notes: notes ?? null,
        });
        return res.status(201).json(structure);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// GET /compensation-structures/:promoterId
//
// Return the most recent compensation structure for a promoter.
// Returns 404 if none exists.
// ─────────────────────────────────────────
router.get('/:promoterId', async (req, res, next) => {
    try {
        const structure = await CompensationService.getCompensationStructure(req.params.promoterId);
        if (!structure) {
            return res.status(404).json({
                error: 'No compensation structure found for this promoter',
                promoterId: req.params.promoterId,
            });
        }
        return res.status(200).json(structure);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=compensationStructure.routes.js.map