import type { Severity } from '@prisma/client';
/**
 * The five rule codes emitted by the LLM detection service.
 * Claude is instructed to return only these values; anything
 * outside this set is rejected by the parser and logged.
 */
export declare const LLM_RULE_CODES: readonly ["LLM-001", "LLM-002", "LLM-003", "LLM-004", "LLM-005"];
export type LlmRuleCode = typeof LLM_RULE_CODES[number];
export declare const LLM_RULE_CODE_SET: ReadonlySet<string>;
/**
 * Internal mapping from rule code to the regulatory category it
 * represents. Stored here (not in ruleRegistry.ts) because the
 * LLM rule codes are semantic, not phrase-based.
 *
 * The human-readable titles surfaced to CCOs are handled by the
 * separate "plain-English findings" roadmap item — do NOT render
 * these category strings directly in the UI.
 */
export declare const LLM_RULE_CODE_CATEGORY: Record<LlmRuleCode, string>;
/**
 * The rule NAME stored on DetectionRecord.ruleName for LLM findings.
 * Matches the internal-category concept used for phrase-based rules
 * (e.g. ruleName: 'False or Misleading Statements').
 */
export declare const LLM_RULE_CODE_NAME: Record<LlmRuleCode, string>;
/**
 * Per-rule severity ceilings. Claude is not always calibrated on
 * regulatory severity — it can over- or under-state. We trust its
 * *findings* but clamp each severity at a defensible maximum for
 * the rule category.
 *
 * LLM-001 (solicitation): CRITICAL is possible because solicitation
 * by a transaction-compensated promoter of a security is potentially
 * unregistered broker-dealer activity.
 *
 * LLM-002 (missing disclosure): HIGH ceiling. Missing a disclosure
 * is a serious violation but rarely rises to CRITICAL on its own.
 *
 * LLM-003 (performance claims): CRITICAL if Claude identifies a
 * guarantee, HIGH otherwise. The caller inspects matched text for
 * the word "guarantee" to decide.
 *
 * LLM-004 (urgency): HIGH ceiling. Urgency alone rarely warrants
 * CRITICAL; it's an aggravator, not a standalone critical risk.
 *
 * LLM-005 (unbalanced risk): HIGH ceiling.
 */
export declare const LLM_SEVERITY_CEILING: Record<LlmRuleCode, Severity>;
/**
 * Clamp a candidate severity against the rule's ceiling.
 * Returns whichever is lower in rank.
 */
export declare function clampLlmSeverity(ruleCode: LlmRuleCode, candidate: Severity): Severity;
/**
 * Human-readable one-line description of the promoter's
 * compensation posture. Injected into the Claude system prompt
 * so the model reasons with the specific regulatory context
 * rather than a generic "compensated promoter" framing.
 */
export declare function describePosture(opts: {
    supervisionPosture: string;
    compensationForm: string;
    isTransactionBased: boolean;
    isSecurityLinked: boolean;
}): string;
//# sourceMappingURL=llmDetection.constants.d.ts.map