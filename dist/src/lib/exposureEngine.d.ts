import type { Severity } from '@prisma/client';
import type { CompensationType, TransactionalityClass } from './compensationPrecision';
export type ExposureLevel = 'NONE' | 'REVIEWER' | 'REVIEWER_PLUS_SUPERVISOR' | 'PRINCIPAL_EXCEPTION' | 'PRINCIPAL_REQUIRED';
export declare const VALID_EXPOSURE_LEVELS: ReadonlySet<string>;
export type ExposureReasonCode = 'EXP-001_TRANSACTION_BASED_COMP' | 'EXP-002_FUNDED_ACCOUNT_TRIGGER' | 'EXP-003_PER_DOLLAR_INVESTED' | 'EXP-004_REVENUE_SHARE_SECURITIES' | 'EXP-005_REPEAT_OFFENDER' | 'EXP-006_CAMPAIGN_PATTERN' | 'EXP-007_OFF_TEMPLATE_CLAIM' | 'EXP-008_UNDISCLOSED_COMPENSATION' | 'EXP-009_GUARANTEE_OR_FRAUD_SIGNAL' | 'EXP-010_REVIEWER_ESCALATION' | 'EXP-011_CAMPAIGN_COMP_DRIFT' | 'EXP-012_MANUAL_POLICY_TRIGGER' | 'EXP-013_COMPENSATED_SOLICITATION' | 'EXP-014_CAMPAIGN_NOT_ACTIVATED' | 'EXP-015_UNAUTHORIZED_PROMOTER' | 'EXP-016_PORTAL_PROHIBITED_SOLICITATION' | 'EXP-017_ANTI_FRAUD_SIGNAL' | 'EXP-018_MARKETING_RULE_VIOLATION';
export declare const VALID_EXPOSURE_REASON_CODES: ReadonlySet<string>;
export interface ExposureInput {
    compensationType: CompensationType | string | null | undefined;
    transactionalityClass: TransactionalityClass | string | null | undefined;
    isTransactionBased: boolean;
    isSecurityLinked: boolean;
    severity: Severity | string | null;
    hitRuleCodes: string[];
    compensationMismatchWithCampaign?: boolean | null;
    hasAffiliateLink?: boolean;
    hasReferralCode?: boolean;
    campaignNotActivated?: boolean;
    unauthorizedPromoter?: boolean;
    portalProhibitedSolicitation?: boolean;
    antiFraudSignal?: boolean;
    marketingRuleViolation?: boolean;
    tenantType?: string;
    promoterPriorViolationCount?: number | null;
    isReviewerEscalation?: boolean;
    campaignViolationCount?: number | null;
}
export interface ExposureOutput {
    exposureLevel: ExposureLevel;
    requiresPrincipalReview: boolean;
    exposureReasonCodes: ExposureReasonCode[];
    exposureSummary: string;
}
/**
 * Compute exposure from currently available inputs.
 * Conservative, explainable, log-only in Phase 2.
 *
 * Never throws. Returns NONE with empty reasons if inputs
 * are missing or unrecognizable.
 */
export declare function computeExposure(input: ExposureInput): ExposureOutput;
//# sourceMappingURL=exposureEngine.d.ts.map