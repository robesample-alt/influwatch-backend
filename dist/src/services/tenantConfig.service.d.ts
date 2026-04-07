/**
 * Return the tenant config row for the given tenantId.
 * If it doesn't exist, creates it with defaults so the
 * app always has a valid config to read.
 */
export declare function getConfig(tenantId: string): Promise<{
    firmName: string | null;
    crdNumber: string | null;
    secRegistration: string | null;
    tenantType: string;
    tenantId: string;
    id: string;
    updatedAt: Date;
    pollIntervalMinutes: number;
    historicalBackfillDays: number;
    authErrorAlertThreshold: number;
    gapReportThreshold: number;
    postContractTailDays: number;
    slaThresholdCritical: number;
    slaThresholdHigh: number;
    slaThresholdMedium: number;
    slaThresholdLow: number;
    retentionYears: number;
    objectLockMode: string;
}>;
export interface UpdateConfigInput {
    pollIntervalMinutes?: number;
    historicalBackfillDays?: number;
    authErrorAlertThreshold?: number;
    gapReportThreshold?: number;
    postContractTailDays?: number;
    slaThresholdCritical?: number;
    slaThresholdHigh?: number;
    slaThresholdMedium?: number;
    slaThresholdLow?: number;
    retentionYears?: number;
    objectLockMode?: string;
}
/**
 * Update the tenant config with the provided fields.
 * Only supplied fields are changed — all others are preserved.
 * Returns the full updated config record.
 */
export declare function updateConfig(tenantId: string, input: UpdateConfigInput): Promise<{
    tenantId: string;
    id: string;
    updatedAt: Date;
    pollIntervalMinutes: number;
    historicalBackfillDays: number;
    authErrorAlertThreshold: number;
    gapReportThreshold: number;
    postContractTailDays: number;
    slaThresholdCritical: number;
    slaThresholdHigh: number;
    slaThresholdMedium: number;
    slaThresholdLow: number;
    retentionYears: number;
    objectLockMode: string;
}>;
export declare const VALID_TENANT_TYPES: Set<string>;
export declare function updateTenantType(tenantId: string, tenantType: string): Promise<{
    id: string;
    firmName: string;
    tenantType: string | null;
}>;
//# sourceMappingURL=tenantConfig.service.d.ts.map