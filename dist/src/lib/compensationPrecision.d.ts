export type CompensationType = 'UNCOMPENSATED' | 'FLAT_FEE_PER_POST' | 'FLAT_FEE_PER_CAMPAIGN' | 'MONTHLY_RETAINER' | 'CONTENT_PRODUCTION_FEE' | 'AFFILIATE_NON_SECURITIES' | 'LEAD_GEN_NON_FUNDED' | 'PER_ACCOUNT_OPENED' | 'PER_ACCOUNT_OPENED_AND_FUNDED' | 'PER_LEAD_CONVERTED_TO_INVESTOR' | 'PER_DOLLAR_INVESTED' | 'REVENUE_SHARE_SECURITIES' | 'EQUITY_OR_CARRY_NON_TRANSACTIONAL' | 'OTHER';
export type CompensationBasis = 'NONE' | 'FIXED' | 'PER_CONTENT_UNIT' | 'PER_CAMPAIGN' | 'PER_TIME_PERIOD' | 'PER_LEAD' | 'PER_ACCOUNT' | 'PER_FUNDED_ACCOUNT' | 'PER_INVESTOR' | 'PERCENT_OF_RAISE' | 'PERCENT_OF_INVESTMENT' | 'OWNERSHIP_BASED' | 'MANUAL_REVIEW';
export type TransactionalityClass = 'NON_TRANSACTIONAL' | 'ELEVATED_NON_TRANSACTIONAL' | 'POTENTIALLY_TRANSACTIONAL' | 'TRANSACTION_BASED';
export interface CompensationPrecisionInput {
    compensationForm: string;
    compensationTrigger: string;
    productType: string;
}
export interface CompensationPrecisionOutput {
    compensationType: CompensationType;
    compensationBasis: CompensationBasis;
    transactionalityClass: TransactionalityClass;
}
/**
 * Derive transactionalityClass from a compensationType.
 * Exported standalone so callers can use it without the
 * full derivation pipeline.
 */
export declare function deriveTransactionalityClass(compensationType: CompensationType): TransactionalityClass;
/**
 * Maps existing {compensationForm, compensationTrigger, productType}
 * values to the new canonical compensationType + compensationBasis.
 *
 * This is a best-effort mapping from the Phase 1 value space.
 * Ambiguous combinations map to OTHER / MANUAL_REVIEW so a human
 * can reclassify later.
 *
 * The mapping logic is intentionally explicit — a lookup table
 * with fallback chains, not a clever algorithm. Correctness is
 * more important than elegance here.
 */
export declare function deriveCompensationPrecision(input: CompensationPrecisionInput): CompensationPrecisionOutput;
//# sourceMappingURL=compensationPrecision.d.ts.map