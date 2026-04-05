import { Severity, DetectionMethod } from '@prisma/client';
export interface RuleHit {
    ruleCode: string;
    ruleName: string;
    matchedPhrase: string;
    severity: Severity;
    detectionMethod: DetectionMethod;
}
export type CompensationContext = {
    isTransactionBased: boolean;
    isSecurityLinked: boolean;
    supervisionPosture: string;
    compensationForm: string;
    hasAffiliateLink: boolean;
};
/**
 * Scan bodyText for all known rule-mapped phrases.
 * Returns one RuleHit per matched phrase.
 * Case-insensitive. Multiple matches from the same record are expected.
 *
 * Pass compensationCtx to enable COMP-001, COMP-002, and COMP-003 evaluation.
 */
export declare function detectRuleHits(bodyText: string, compensationCtx?: CompensationContext): RuleHit[];
/**
 * Derive the overall severity for a record from its rule hits.
 * Returns the highest severity found, or LOW if no hits.
 */
export declare function computeSeverityFromHits(hits: RuleHit[]): Severity;
//# sourceMappingURL=ruleRegistry.d.ts.map