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

// ─────────────────────────────────────────
// BUILD PROMOTER EVIDENCE PACKAGE
//
// Assembles all data needed to render a PDF evidence package
// for a single promoter over a date range. Returns the shape
// expected by the pdfGenerator.
// ─────────────────────────────────────────

import type { EvidencePackageInput } from '../lib/pdfGenerator';

export async function buildPromoterEvidencePackage(
  tenantId: string,
  ambassadorId: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<EvidencePackageInput> {
  return withTenantContext({ tenantId }, async (tx) => {
    const tenant = await tx.tenant.findFirst({
      where: { id: tenantId },
      select: { firmName: true, crdNumber: true, secRegistration: true },
    });

    const promoter = await tx.ambassadorProfile.findFirst({
      where: { id: ambassadorId, tenantId },
      select: { id: true, displayName: true, handle: true, primaryPlatform: true, riskTier: true },
    });

    if (!tenant) throw new Error('Tenant not found');
    if (!promoter) throw new Error('Promoter not found');

    const compensation = await tx.compensationStructure.findFirst({
      where: { promoterId: ambassadorId, tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        compensationForm:    true,
        compensationTrigger: true,
        productType:         true,
        supervisionPosture:  true,
        requiresDisclosure:  true,
      },
    });

    const records = await tx.contentRecord.findMany({
      where: {
        tenantId,
        ambassadorId,
        capturedAt: { gte: dateFrom, lte: dateTo },
      },
      include: {
        detectionRecords: {
          select: { ruleCode: true, ruleName: true, matchedPhrase: true, severity: true },
        },
        eventLog: {
          orderBy: { createdAt: 'asc' },
          select: { eventType: true, eventNote: true, actorId: true, createdAt: true },
        },
      },
      orderBy: { capturedAt: 'desc' },
    });

    const attestations = await tx.supervisoryAttestation.findMany({
      where: {
        tenantId,
        certifiedAt: { gte: dateFrom, lte: dateTo },
      },
      include: {
        principal: { select: { displayName: true, role: true } },
      },
      orderBy: { certifiedAt: 'desc' },
    });

    return {
      tenant: {
        firmName:        tenant.firmName,
        crdNumber:       tenant.crdNumber,
        secRegistration: tenant.secRegistration,
      },
      promoter: {
        id:              promoter.id,
        displayName:     promoter.displayName,
        handle:          promoter.handle,
        primaryPlatform: promoter.primaryPlatform,
        riskTier:        promoter.riskTier,
      },
      compensation: compensation || null,
      dateRange: { from: dateFrom, to: dateTo },
      records: records.map((r: any) => ({
        id:                  r.id,
        sourcePlatform:      r.sourcePlatform,
        contentType:         r.contentType,
        sourceUrl:           r.sourceUrl,
        bodyText:            r.bodyText,
        transcriptText:      r.transcriptText,
        postedAt:            r.postedAt,
        capturedAt:          r.capturedAt,
        archiveStatus:       r.archiveStatus,
        severity:            r.severity,
        compensationPosture: r.compensationPosture,
        checksum:            r.checksum,
        detections:          r.detectionRecords || [],
        events:              r.eventLog || [],
      })),
      attestations: attestations.map((a: any) => ({
        principalName:   a.principal.displayName,
        principalRole:   a.principal.role,
        periodLabel:     a.periodLabel,
        certifiedAt:     a.certifiedAt,
        supervisoryNote: a.supervisoryNote,
      })),
      generatedAt: new Date(),
    };
  });
}
