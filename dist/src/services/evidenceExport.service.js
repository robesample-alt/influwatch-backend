"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — EvidenceExport
//
// listExports()       — all exports, newest first
// generateExport(input) — create export record with checksum
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_EXPORT_TYPES = void 0;
exports.listExports = listExports;
exports.generateExport = generateExport;
const crypto_1 = require("crypto");
const prisma_1 = __importDefault(require("../utils/prisma"));
const VALID_EXPORT_TYPES = [
    'FLAG_EVIDENCE',
    'PROMOTER_HISTORY',
    'AUDIT_TRAIL',
    'CERT_REPORT',
];
exports.VALID_EXPORT_TYPES = VALID_EXPORT_TYPES;
// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────
/**
 * List all evidence exports, newest first.
 */
async function listExports() {
    return prisma_1.default.evidenceExport.findMany({
        orderBy: { generatedAt: 'desc' },
    });
}
/**
 * Create a new evidence export record.
 * Computes a SHA-256 package checksum from the export metadata
 * (type + generatedBy + timestamp + scope) so the record is
 * tamper-evident without requiring the actual file payload.
 */
async function generateExport(input) {
    const generatedAt = new Date();
    // Build a deterministic string from the export parameters
    const checksumSource = [
        input.exportType,
        input.generatedBy,
        generatedAt.toISOString(),
        input.dateRangeStart?.toISOString() ?? 'null',
        input.dateRangeEnd?.toISOString() ?? 'null',
        input.ambassadorId ?? 'null',
        String(input.recordCount ?? 0),
    ].join('::');
    const packageChecksum = (0, crypto_1.createHash)('sha256')
        .update(checksumSource, 'utf8')
        .digest('hex');
    return prisma_1.default.evidenceExport.create({
        data: {
            exportType: input.exportType,
            generatedBy: input.generatedBy,
            generatedAt,
            dateRangeStart: input.dateRangeStart ?? null,
            dateRangeEnd: input.dateRangeEnd ?? null,
            ambassadorId: input.ambassadorId ?? null,
            recordCount: input.recordCount ?? 0,
            packageChecksum,
            status: 'COMPLETE',
            notes: input.notes ?? null,
        },
    });
}
//# sourceMappingURL=evidenceExport.service.js.map