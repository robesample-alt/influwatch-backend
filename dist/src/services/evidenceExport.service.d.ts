declare const VALID_EXPORT_TYPES: readonly ["FLAG_EVIDENCE", "PROMOTER_HISTORY", "AUDIT_TRAIL", "CERT_REPORT"];
export type ExportType = typeof VALID_EXPORT_TYPES[number];
/**
 * List all evidence exports, newest first.
 */
export declare function listExports(): Promise<{
    id: string;
    notes: string | null;
    ambassadorId: string | null;
    status: string;
    exportType: string;
    generatedBy: string;
    generatedAt: Date;
    dateRangeStart: Date | null;
    dateRangeEnd: Date | null;
    recordCount: number;
    packageChecksum: string | null;
}[]>;
export interface GenerateExportInput {
    exportType: string;
    generatedBy: string;
    dateRangeStart?: Date | null;
    dateRangeEnd?: Date | null;
    ambassadorId?: string | null;
    recordCount?: number;
    notes?: string | null;
}
/**
 * Create a new evidence export record.
 * Computes a SHA-256 package checksum from the export metadata
 * (type + generatedBy + timestamp + scope) so the record is
 * tamper-evident without requiring the actual file payload.
 */
export declare function generateExport(input: GenerateExportInput): Promise<{
    id: string;
    notes: string | null;
    ambassadorId: string | null;
    status: string;
    exportType: string;
    generatedBy: string;
    generatedAt: Date;
    dateRangeStart: Date | null;
    dateRangeEnd: Date | null;
    recordCount: number;
    packageChecksum: string | null;
}>;
export { VALID_EXPORT_TYPES };
//# sourceMappingURL=evidenceExport.service.d.ts.map