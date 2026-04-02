"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Tail Periods
//
// GET   /api/influwatch/tail-periods          — list all, ?status=
// POST  /api/influwatch/tail-periods          — create new
// PATCH /api/influwatch/tail-periods/:id/close — close a tail period
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
const TailPeriodService = __importStar(require("../services/tailPeriod.service"));
const router = (0, express_1.Router)();
const VALID_TAIL_TYPES = ['STANDARD', 'EXTENDED', 'REGULATORY'];
const VALID_STATUSES = ['ACTIVE', 'CLOSED', 'EXPIRED'];
// ─────────────────────────────────────────
// GET /tail-periods
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const status = req.query.status;
        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status filter',
                validValues: [...VALID_STATUSES],
            });
        }
        const tailPeriods = await TailPeriodService.listTailPeriods(status);
        return res.status(200).json({ count: tailPeriods.length, tailPeriods });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /tail-periods
// ─────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { ambassadorId, contractEndDate, tailDays, tailStartDate, tailEndDate, reason, riskTier, tailType, } = req.body;
        if (!ambassadorId)
            return res.status(400).json({ error: 'ambassadorId is required' });
        if (!contractEndDate)
            return res.status(400).json({ error: 'contractEndDate is required' });
        if (tailDays == null)
            return res.status(400).json({ error: 'tailDays is required' });
        if (!tailStartDate)
            return res.status(400).json({ error: 'tailStartDate is required' });
        if (!tailEndDate)
            return res.status(400).json({ error: 'tailEndDate is required' });
        const tailDaysNum = Number(tailDays);
        if (!Number.isInteger(tailDaysNum) || tailDaysNum < 1) {
            return res.status(400).json({ error: 'tailDays must be a positive integer' });
        }
        if (tailType && !VALID_TAIL_TYPES.includes(tailType)) {
            return res.status(400).json({
                error: 'Invalid tailType',
                validValues: [...VALID_TAIL_TYPES],
            });
        }
        const record = await TailPeriodService.createTailPeriod({
            ambassadorId,
            contractEndDate: new Date(contractEndDate),
            tailDays: tailDaysNum,
            tailStartDate: new Date(tailStartDate),
            tailEndDate: new Date(tailEndDate),
            reason: reason ?? null,
            riskTier: riskTier ?? null,
            tailType: tailType ?? 'STANDARD',
        });
        return res.status(201).json(record);
    }
    catch (err) {
        // FK violation — ambassadorId does not exist
        if (err?.code === 'P2003') {
            return res.status(404).json({ error: 'Ambassador not found', ambassadorId: req.body.ambassadorId });
        }
        next(err);
    }
});
// ─────────────────────────────────────────
// PATCH /tail-periods/:id/close
// ─────────────────────────────────────────
router.patch('/:id/close', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { closedBy, closedReason } = req.body;
        if (!closedBy)
            return res.status(400).json({ error: 'closedBy is required' });
        if (!closedReason)
            return res.status(400).json({ error: 'closedReason is required' });
        const record = await TailPeriodService.closeTailPeriod(id, closedBy, closedReason);
        if (!record)
            return res.status(404).json({ error: 'Tail period not found', id });
        return res.status(200).json(record);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=tailPeriod.routes.js.map