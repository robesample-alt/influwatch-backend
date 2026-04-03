// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — EvidenceExport
//
// listExports(tenantId)         — all exports, newest first
// generateExport(tenantId, input) — create export record with checksum
// ============================================================

import { createHash } from 'crypto';
import { withTenantContext } from '../utils/tenantContext';

const VALID_EXPORT_TYPES = [
  'FLAG_EVIDENCE',
  'PROMOTER_HISTORY',
  'AUDIT_TRAIL',
  'CERT_REPORT',
] as const;

export type ExportType = typeof VALID_EXPORT_TYPES[number];

// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────

/**
 * List all evidence exports, newest first.
 */
export async function listExports(tenantId: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.evidenceExport.findMany({
      where:   { tenantId },
      orderBy: { generatedAt: 'desc' },
    });
  });
}

// ─────────────────────────────────────────
// GENERATE
// ─────────────────────────────────────────

export interface GenerateExportInput {
  exportType:      string;
  generatedBy:     string;
  dateRangeStart?: Date | null;
  dateRangeEnd?:   Date | null;
  ambassadorId?:   string | null;
  recordCount?:    number;
  notes?:          string | null;
}

/**
 * Create a new evidence export record.
 * Computes a SHA-256 package checksum from the export metadata
 * (type + generatedBy + timestamp + scope) so the record is
 * tamper-evident without requiring the actual file payload.
 */
export async function generateExport(tenantId: string, input: GenerateExportInput) {
  return withTenantContext({ tenantId }, async (tx) => {
    const generatedAt = new Date();

    // Build a deterministic string from the export parameters
    const checksumSource = [
      input.exportType,
      input.generatedBy,
      generatedAt.toISOString(),
      input.dateRangeStart?.toISOString() ?? 'null',
      input.dateRangeEnd?.toISOString()   ?? 'null',
      input.ambassadorId                  ?? 'null',
      String(input.recordCount            ?? 0),
    ].join('::');

    const packageChecksum = createHash('sha256')
      .update(checksumSource, 'utf8')
      .digest('hex');

    return tx.evidenceExport.create({
      data: {
        tenantId,
        exportType:     input.exportType,
        generatedBy:    input.generatedBy,
        generatedAt,
        dateRangeStart: input.dateRangeStart ?? null,
        dateRangeEnd:   input.dateRangeEnd   ?? null,
        ambassadorId:   input.ambassadorId   ?? null,
        recordCount:    input.recordCount    ?? 0,
        packageChecksum,
        status:         'COMPLETE',
        notes:          input.notes          ?? null,
      },
    });
  });
}

export { VALID_EXPORT_TYPES };
