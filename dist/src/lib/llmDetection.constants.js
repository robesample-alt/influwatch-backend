"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// LLM Detection — Constants
//
// Authoritative mappings for the Anthropic Claude contextual
// detection service. Keep this file free of runtime logic —
// llmDetection.ts imports these values.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLM_SEVERITY_CEILING = exports.LLM_RULE_CODE_NAME = exports.LLM_RULE_CODE_CATEGORY = exports.LLM_RULE_CODE_SET = exports.LLM_RULE_CODES = void 0;
exports.clampLlmSeverity = clampLlmSeverity;
exports.describePosture = describePosture;
// ── Rule codes ────────────────────────────────────────────────
/**
 * The five rule codes emitted by the LLM detection service.
 * Claude is instructed to return only these values; anything
 * outside this set is rejected by the parser and logged.
 */
exports.LLM_RULE_CODES = [
    'LLM-001',
    'LLM-002',
    'LLM-003',
    'LLM-004',
    'LLM-005',
];
exports.LLM_RULE_CODE_SET = new Set(exports.LLM_RULE_CODES);
// ── Rule code → regulatory category ───────────────────────────
/**
 * Internal mapping from rule code to the regulatory category it
 * represents. Stored here (not in ruleRegistry.ts) because the
 * LLM rule codes are semantic, not phrase-based.
 *
 * The human-readable titles surfaced to CCOs are handled by the
 * separate "plain-English findings" roadmap item — do NOT render
 * these category strings directly in the UI.
 */
exports.LLM_RULE_CODE_CATEGORY = {
    'LLM-001': 'Solicitation language directing toward a specific investment transaction',
    'LLM-002': 'Missing or inadequate compensation disclosure',
    'LLM-003': 'Performance claims or guarantees',
    'LLM-004': 'Urgency or pressure tactics inducing immediate action',
    'LLM-005': 'Misleading or unbalanced risk / return statements',
};
/**
 * The rule NAME stored on DetectionRecord.ruleName for LLM findings.
 * Matches the internal-category concept used for phrase-based rules
 * (e.g. ruleName: 'False or Misleading Statements').
 */
exports.LLM_RULE_CODE_NAME = {
    'LLM-001': 'Unregistered Solicitation Language (Semantic)',
    'LLM-002': 'Missing or Inadequate Disclosure (Semantic)',
    'LLM-003': 'Performance Claim or Guarantee (Semantic)',
    'LLM-004': 'Urgency / Pressure Tactic (Semantic)',
    'LLM-005': 'Unbalanced Risk Portrayal (Semantic)',
};
// ── Severity ceilings ─────────────────────────────────────────
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
exports.LLM_SEVERITY_CEILING = {
    'LLM-001': 'CRITICAL',
    'LLM-002': 'HIGH',
    'LLM-003': 'CRITICAL',
    'LLM-004': 'HIGH',
    'LLM-005': 'HIGH',
};
const SEVERITY_RANK = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3,
};
/**
 * Clamp a candidate severity against the rule's ceiling.
 * Returns whichever is lower in rank.
 */
function clampLlmSeverity(ruleCode, candidate) {
    const ceiling = exports.LLM_SEVERITY_CEILING[ruleCode];
    return SEVERITY_RANK[candidate] <= SEVERITY_RANK[ceiling] ? candidate : ceiling;
}
// ── Posture description for prompt rendering ──────────────────
/**
 * Human-readable one-line description of the promoter's
 * compensation posture. Injected into the Claude system prompt
 * so the model reasons with the specific regulatory context
 * rather than a generic "compensated promoter" framing.
 */
function describePosture(opts) {
    const parts = [];
    // Posture verbosity
    const p = (opts.supervisionPosture || '').toUpperCase();
    if (p === 'CRITICAL') {
        parts.push('Critical supervisory posture (highest-risk compensation arrangement)');
    }
    else if (p === 'HIGH') {
        parts.push('High supervisory posture');
    }
    else if (p === 'MEDIUM') {
        parts.push('Medium supervisory posture');
    }
    else {
        parts.push('Low supervisory posture');
    }
    // Compensation form
    const f = (opts.compensationForm || '').toUpperCase();
    const formLabel = {
        PER_CONVERSION: 'per-conversion compensation (paid per successful sign-up or funding)',
        PER_CONTENT: 'per-content compensation (paid per post)',
        REVENUE_SHARE: 'revenue-share compensation (paid a percentage of investor contributions or fund revenue)',
        FLAT_FEE: 'flat-fee compensation (fixed payment regardless of outcome)',
        EQUITY_GRANT: 'equity-grant compensation (paid in ownership interests)',
        HYBRID: 'hybrid compensation arrangement',
        NONE: 'uncompensated (no financial relationship)',
    };
    parts.push(formLabel[f] || 'compensated arrangement of unspecified form');
    // Transaction-linked flag
    if (opts.isTransactionBased) {
        parts.push('compensation is tied to specific investor transactions');
    }
    // Security-linked flag
    if (opts.isSecurityLinked) {
        parts.push('promoted product is a security subject to SEC/FINRA advertising rules');
    }
    return parts.join('; ') + '.';
}
//# sourceMappingURL=llmDetection.constants.js.map