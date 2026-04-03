import type { ContentRecordFilters } from '../models/types';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateCreateContentRecord(input: unknown): ValidationResult;
export declare function validateCreateAmbassador(input: unknown): ValidationResult;
export declare function validateCreateMediaAsset(input: unknown): ValidationResult;
export declare function parseContentRecordFilters(query: Record<string, unknown>): ContentRecordFilters;
//# sourceMappingURL=validation.d.ts.map