/**
 * Return the single tenant config row (TC-001).
 * If it doesn't exist, creates it with defaults so the
 * app always has a valid config to read.
 */
export declare function getConfig(): Promise<{
    id: string;
    updatedAt: Date;
    firmName: string;
    crdNumber: string | null;
    secRegistration: string | null;
    primaryContact: string | null;
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
    firmName?: string;
    crdNumber?: string | null;
    secRegistration?: string | null;
    primaryContact?: string | null;
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
 * Update TC-001 with the provided fields.
 * Only supplied fields are changed — all others are preserved.
 * Returns the full updated config record.
 */
export declare function updateConfig(input: UpdateConfigInput): Promise<{
    id: string;
    updatedAt: Date;
    firmName: string;
    crdNumber: string | null;
    secRegistration: string | null;
    primaryContact: string | null;
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