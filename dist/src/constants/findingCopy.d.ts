export interface FindingCopy {
    /** Short public title shown as the card header (3-6 words). */
    title: string;
    /** One-sentence description a CCO reads directly — regulatory, not technical. */
    description: string;
    /** Category key used to group findings with the same public title. */
    category: FindingCategory;
}
/**
 * Category keys — findings with the same category collapse into
 * one Flag Review card, regardless of source rule code or
 * detection method.
 */
export type FindingCategory = 'SOLICITATION' | 'DISCLOSURE' | 'PERFORMANCE_CLAIM' | 'UNBALANCED_RISK' | 'FORWARD_LOOKING' | 'TESTIMONIAL' | 'COMPENSATION_STRUCTURE' | 'COMPENSATION_DISCLOSURE' | 'URGENCY_PRESSURE' | 'UNKNOWN';
/**
 * Fallback shown for any rule code not in the map. Never leaks
 * the raw code to users — generic "review required" label.
 */
export declare const UNKNOWN_FINDING: FindingCopy;
/**
 * Rule code → plain-English finding copy.
 *
 * Note: multiple internal rule codes intentionally collapse to
 * the same public category. That collapse is a feature, not a
 * bug — it obscures method from screenshots and reinforces
 * that the category is a regulatory concept.
 */
export declare const FINDING_COPY: Readonly<Record<string, FindingCopy>>;
/**
 * Return the plain-English copy for a rule code, falling back
 * to the generic "Compliance Review Required" label so nothing
 * ever leaks a raw code.
 */
export declare function getFindingCopy(ruleCode: string | null | undefined): FindingCopy;
export interface DetectionLike {
    ruleCode: string | null | undefined;
    severity?: string | null;
    matchedPhrase?: string | null;
}
export interface GroupedFinding {
    category: FindingCategory;
    title: string;
    description: string;
    severity: string;
    flaggedLanguage: string[];
}
/**
 * Group detection records by their public category so the UI
 * shows one card per category even when multiple internal rule
 * codes (e.g. DISC-001 from phrase matching + LLM-002 from the
 * LLM service) fired for the same content.
 *
 * Severity of the grouped card is the highest severity across
 * its constituent detections. Flagged language is the
 * deduplicated list of matched phrases.
 */
export declare function groupDetections(detections: DetectionLike[]): GroupedFinding[];
//# sourceMappingURL=findingCopy.d.ts.map