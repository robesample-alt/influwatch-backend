"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Route handlers — Ambassador / Promoter
//
// Powers the Promoter Registry and Promoter Detail screens.
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
exports.listAmbassadors = listAmbassadors;
exports.createAmbassador = createAmbassador;
exports.updateAssignment = updateAssignment;
exports.getMonitorSummary = getMonitorSummary;
exports.getAmbassadorDetail = getAmbassadorDetail;
const AmbassadorService = __importStar(require("../services/ambassador.service"));
// ─────────────────────────────────────────
// GET /ambassadors
// List all ambassador profiles.
// Powers the Promoter Registry screen.
// ─────────────────────────────────────────
async function listAmbassadors(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const ambassadors = await AmbassadorService.listAmbassadors(tenantId);
        return res.status(200).json(ambassadors);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// POST /ambassadors
// Register a new promoter.
// Powers the Register Promoter screen.
// ─────────────────────────────────────────
async function createAmbassador(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const { displayName, handle, email, primaryPlatform, riskTier, assignedSupervisorId, supervisoryRelationship, compensation } = req.body;
        if (!displayName || !handle || !primaryPlatform) {
            return res.status(400).json({
                error: 'displayName, handle, and primaryPlatform are required',
            });
        }
        // Counsel-reviewed acknowledgment is required for elevated postures.
        if (compensation && (compensation.supervisionPosture === 'CRITICAL' || compensation.supervisionPosture === 'HIGH')) {
            if (compensation.acknowledged !== true) {
                return res.status(400).json({
                    error: 'Counsel-reviewed acknowledgment is required for transaction-based or potentially-transactional compensation arrangements.',
                });
            }
        }
        const ambassador = await AmbassadorService.createAmbassador(tenantId, {
            displayName,
            handle,
            email,
            primaryPlatform,
            riskTier: riskTier ?? undefined,
            assignedSupervisorId: assignedSupervisorId ?? undefined,
            supervisoryRelationship: supervisoryRelationship ?? 'SUPERVISED',
            compensation: compensation ?? undefined,
            actorId: req.user.id,
        });
        return res.status(201).json(ambassador);
    }
    catch (err) {
        if (err.validationErrors)
            return res.status(400).json({ error: err.message });
        next(err);
    }
}
// ─────────────────────────────────────────
// PATCH /ambassadors/:id/assignment
// Update the assigned supervisor for a promoter.
// Body: { assignedSupervisorId: string | null }
// ─────────────────────────────────────────
async function updateAssignment(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const { id } = req.params;
        const { assignedSupervisorId } = req.body;
        if (assignedSupervisorId === undefined) {
            return res.status(400).json({
                error: 'assignedSupervisorId is required (pass null to unassign)',
            });
        }
        const ambassador = await AmbassadorService.assignSupervisor(tenantId, id, assignedSupervisorId);
        return res.status(200).json(ambassador);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /ambassadors/monitor
// All promoters with capture statistics.
// Powers the Account Monitor screen.
// Must be mounted BEFORE /:id to avoid route shadowing.
// ─────────────────────────────────────────
async function getMonitorSummary(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const data = await AmbassadorService.getMonitorSummary(tenantId);
        return res.status(200).json(data);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /ambassadors/:id
// Full ambassador detail — profile + all content records + derived counts.
// Powers the Promoter Detail screen.
// ─────────────────────────────────────────
async function getAmbassadorDetail(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const detail = await AmbassadorService.getAmbassadorDetail(tenantId, req.params.id);
        if (!detail) {
            return res.status(404).json({ error: 'Ambassador not found', id: req.params.id });
        }
        return res.status(200).json(detail);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=ambassador.routes.js.map