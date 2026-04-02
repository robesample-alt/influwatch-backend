export declare enum Severity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface RuleHit {
    ruleCode: string;
    ruleName: string;
    matchedPhrase: string;
    severity: Severity;
    detectionMethod: 'PHRASE_MATCH' | 'DISCLOSURE_CHECK';
}
/**
 * Scan bodyText for all known rule-mapped phrases.
 * Returns one RuleHit per matched phrase.
 * Case-insensitive. Multiple matches from the same record are expected.
 */
export declare function detectRuleHits(bodyText: string): RuleHit[];
/**
 * Derive the overall severity for a record from its rule hits.
 * Returns the highest severity found, or LOW if no hits.
 */
export declare function computeSeverityFromHits(hits: RuleHit[]): Severity;
//# sourceMappingURL=ruleRegistry.d.ts.map