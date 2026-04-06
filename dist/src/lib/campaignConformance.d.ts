export type CampaignRiskMode = 'AWARENESS' | 'EDUCATION' | 'CONVERSION' | 'HIGH_SCRUTINY';
export declare const VALID_CAMPAIGN_RISK_MODES: ReadonlySet<string>;
export interface CampaignConformanceInput {
    /** The promoter's canonical compensationType from Phase 1. */
    compensationType: string | null | undefined;
    /** The campaign's allowedCompensationTypes JSON string, or null. */
    allowedCompensationTypesJson: string | null | undefined;
    /** The campaign's risk mode, if set. */
    campaignRiskMode: string | null | undefined;
    /** The campaign name, for summary text. */
    campaignName?: string | null;
}
export interface CampaignConformanceResult {
    mismatch: boolean | null;
    summary: string | null;
}
/**
 * Check whether a promoter's compensation type conforms to the
 * campaign's allowed types.
 *
 * Returns null mismatch when there isn't enough data to evaluate.
 * Never throws.
 */
export declare function checkCampaignConformance(input: CampaignConformanceInput): CampaignConformanceResult;
//# sourceMappingURL=campaignConformance.d.ts.map