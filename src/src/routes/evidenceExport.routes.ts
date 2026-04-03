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

export default router;
