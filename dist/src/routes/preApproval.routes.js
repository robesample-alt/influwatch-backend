"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Pre-Approval Requests
//
// GET   /api/influwatch/pre-approvals              — list, ?status=
// POST  /api/influwatch/pre-approvals              — submit new
// PATCH /api/influwatch/pre-approvals/:id/decision — record decision
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
const PreApprovalService = __importStar(require("../services/preApproval.service"));
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /pre-approvals
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const status = req.query.status;
        if (status && !PreApprovalService.VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status filter',
                validValues: [...PreApprovalService.VALID_STATUSES],
            });
        }
        const requests = await PreApprovalService.listRequests(status);
        return res.status(200).json({ count: requests.length, requests });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /pre-approvals
// ─────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { ambassadorId, submittedBy, contentType, platform, contentPreview, requiredBy, assignedPrincipalId, slaHours, } = req.body;
        if (!ambassadorId)
            return res.status(400).json({ error: 'ambassadorId is required' });
        if (!submittedBy)
            return res.status(400).json({ error: 'submittedBy is required' });
        if (!contentType)
            return res.status(400).json({ error: 'contentType is required' });
        if (!platform)
            return res.status(400).json({ error: 'platform is required' });
        if (!contentPreview)
            return res.status(400).json({ error: 'contentPreview is required' });
        const record = await PreApprovalService.createRequest({
            ambassadorId,
            submittedBy,
            contentType,
            platform,
            contentPreview: String(contentPreview).slice(0, 500),
            requiredBy: requiredBy ? new Date(requiredBy) : null,
            assignedPrincipalId: assignedPrincipalId ?? null,
            slaHours: slaHours != null ? Number(slaHours) : 48,
        });
        return res.status(201).json(record);
    }
    catch (err) {
        if (err?.code === 'P2003') {
            return res.status(404).json({
                error: 'Ambassador or assigned principal not found',
                ambassadorId: req.body.ambassadorId,
            });
        }
        next(err);
    }
});
// ─────────────────────────────────────────
// PATCH /pre-approvals/:id/decision
// ─────────────────────────────────────────
router.patch('/:id/decision', (0, requireRole_1.requireRole)(client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.DESIGNATED_SUPERVISOR, client_1.InternalActorRole.COMPLIANCE_OFFICER, client_1.InternalActorRole.TENANT_ADMIN), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { decision, status } = req.body;
        const decidedBy = req.user.id;
        if (!decision)
            return res.status(400).json({ error: 'decision is required' });
        if (!status)
            return res.status(400).json({ error: 'status is required' });
        if (!PreApprovalService.VALID_DECISION_STATUSES.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                validValues: [...PreApprovalService.VALID_DECISION_STATUSES],
            });
        }
        const record = await PreApprovalService.decideRequest(id, decision, decidedBy, status);
        if (!record)
            return res.status(404).json({ error: 'Pre-approval request not found', id });
        return res.status(200).json(record);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=preApproval.routes.js.map