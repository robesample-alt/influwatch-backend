/**
 * Return the tenant config row for the given tenantId.
 * If it doesn't exist, creates it with defaults so the
 * app always has a valid config to read.
 */
export declare function getConfig(tenantId: string): Promise<{
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
//# sourceMappingURL=tenantConfig.service.d.ts.map