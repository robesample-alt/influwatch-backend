"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Evidence Exports
//
// GET  /api/influwatch/exports — list all export records
// POST /api/influwatch/exports — generate a new export package
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
const EvidenceExportService = __importStar(require("../services/evidenceExport.service"));
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /exports
//
// List all evidence exports, newest first.
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const exports = await EvidenceExportService.listExports();
        return res.status(200).json({ count: exports.length, exports });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /exports
//
// Generate a new evidence export package.
// Required: exportType, generatedBy
// Optional: dateRangeStart, dateRangeEnd, ambassadorId,
//           recordCount, notes
// ─────────────────────────────────────────
router.post('/', (0, requireRole_1.requireRole)(client_1.InternalActorRole.COMPLIANCE_OFFICER, client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.TENANT_ADMIN), async (req, res, next) => {
    try {
        const { exportType, dateRangeStart, dateRangeEnd, ambassadorId, recordCount, notes, } = req.body;
        const generatedBy = req.user.id;
        if (!exportType)
            return res.status(400).json({ error: 'exportType is required' });
        if (!EvidenceExportService.VALID_EXPORT_TYPES.includes(exportType)) {
            return res.status(400).json({
                error: 'Invalid exportType',
                validValues: [...EvidenceExportService.VALID_EXPORT_TYPES],
            });
        }
        const record = await EvidenceExportService.generateExport({
            exportType,
            generatedBy,
            dateRangeStart: dateRangeStart ? new Date(dateRangeStart) : null,
            dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd) : null,
            ambassadorId: ambassadorId ?? null,
            recordCount: recordCount != null ? Number(recordCount) : 0,
            notes: notes ?? null,
        });
        return res.status(201).json(record);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=evidenceExport.routes.js.map