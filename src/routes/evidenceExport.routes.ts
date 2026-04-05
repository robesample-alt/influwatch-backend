// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Evidence Exports
//
// GET  /api/influwatch/exports — list all export records
// POST /api/influwatch/exports — generate a new export package
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { InternalActorRole } from '@prisma/client';
import * as EvidenceExportService from '../services/evidenceExport.service';
import { requireRole } from '../middleware/requireRole';
import { generateEvidencePdf } from '../lib/pdfGenerator';

const router = Router();

// ─────────────────────────────────────────
// GET /exports
//
// List all evidence exports, newest first.
// ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const exports = await EvidenceExportService.listExports(tenantId);
    return res.status(200).json({ count: exports.length, exports });
  } catch (err) {
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

router.post('/', requireRole(InternalActorRole.COMPLIANCE_OFFICER, InternalActorRole.REGISTERED_PRINCIPAL, InternalActorRole.TENANT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      exportType,
      dateRangeStart,
      dateRangeEnd,
      ambassadorId,
      recordCount,
      notes,
    } = req.body;

    const tenantId = req.user!.tenantId;
    const generatedBy = req.user!.id;

    if (!exportType)   return res.status(400).json({ error: 'exportType is required' });

    if (!EvidenceExportService.VALID_EXPORT_TYPES.includes(exportType)) {
      return res.status(400).json({
        error:       'Invalid exportType',
        validValues: [...EvidenceExportService.VALID_EXPORT_TYPES],
      });
    }

    const record = await EvidenceExportService.generateExport(tenantId, {
      exportType,
      generatedBy,
      dateRangeStart: dateRangeStart ? new Date(dateRangeStart) : null,
      dateRangeEnd:   dateRangeEnd   ? new Date(dateRangeEnd)   : null,
      ambassadorId:   ambassadorId   ?? null,
      recordCount:    recordCount    != null ? Number(recordCount) : 0,
      notes:          notes          ?? null,
    });

    return res.status(201).json(record);
  } catch (err) {
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

router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId    = req.user!.tenantId;
    const generatedBy = req.user!.id;
    const { ambassadorId, dateFrom, dateTo } = req.body;

    if (!ambassadorId) return res.status(400).json({ error: 'ambassadorId is required' });

    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const toDate   = dateTo   ? new Date(dateTo)   : new Date();

    const pkg = await EvidenceExportService.buildPromoterEvidencePackage(
      tenantId,
      ambassadorId,
      fromDate,
      toDate,
    );

    // Record the export
    await EvidenceExportService.generateExport(tenantId, {
      exportType:     'PROMOTER_HISTORY',
      generatedBy,
      dateRangeStart: fromDate,
      dateRangeEnd:   toDate,
      ambassadorId,
      recordCount:    pkg.records.length,
      notes:          'PDF evidence package for ' + pkg.promoter.displayName,
    });

    const filename = `InfluWatch_Evidence_${pkg.promoter.id}_${fromDate.toISOString().slice(0, 10)}_to_${toDate.toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await generateEvidencePdf(pkg, res);
  } catch (err) {
    next(err);
  }
});

export default router;
