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
const pdfGenerator_1 = require("../lib/pdfGenerator");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /exports
//
// List all evidence exports, newest first.
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const exports = await EvidenceExportService.listExports(tenantId);
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
        const tenantId = req.user.tenantId;
        const generatedBy = req.user.id;
        if (!exportType)
            return res.status(400).json({ error: 'exportType is required' });
        if (!EvidenceExportService.VALID_EXPORT_TYPES.includes(exportType)) {
            return res.status(400).json({
                error: 'Invalid exportType',
                validValues: [...EvidenceExportService.VALID_EXPORT_TYPES],
            });
        }
        const record = await EvidenceExportService.generateExport(tenantId, {
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
// ─────────────────────────────────────────
// POST /exports/generate
//
// Build a promoter evidence PDF package and stream it as the response.
// Also records an EvidenceExport row for audit.
//
// Body: { ambassadorId, dateFrom?, dateTo? }
// ─────────────────────────────────────────
router.post('/generate', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const generatedBy = req.user.id;
        const { ambassadorId, dateFrom, dateTo } = req.body;
        if (!ambassadorId)
            return res.status(400).json({ error: 'ambassadorId is required' });
        const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const toDate = dateTo ? new Date(dateTo) : new Date();
        const pkg = await EvidenceExportService.buildPromoterEvidencePackage(tenantId, ambassadorId, fromDate, toDate);
        // Record the export
        await EvidenceExportService.generateExport(tenantId, {
            exportType: 'PROMOTER_HISTORY',
            generatedBy,
            dateRangeStart: fromDate,
            dateRangeEnd: toDate,
            ambassadorId,
            recordCount: pkg.records.length,
            notes: 'PDF evidence package for ' + pkg.promoter.displayName,
        });
        const filename = `InfluWatch_Evidence_${pkg.promoter.id}_${fromDate.toISOString().slice(0, 10)}_to_${toDate.toISOString().slice(0, 10)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await (0, pdfGenerator_1.generateEvidencePdf)(pkg, res);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=evidenceExport.routes.js.map