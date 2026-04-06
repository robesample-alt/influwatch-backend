"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Exposure Engine — Phase 2 (Log-Only)
//
// Computes the supervisory exposure level for a ContentRecord
// at write time. Answers "who needs to care from a liability
// standpoint?" as distinct from severity ("how risky is this
// content?").
//
// PHASE 2 CONSTRAINT: This engine STORES exposure on the
// ContentRecord but does NOT affect routing, queue selection,
// archiveStatus, severity, or any live supervisory behavior.
// It is a log-only layer for future activation.
//
// Pure functions, no side effects, no DB access.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_EXPOSURE_REASON_CODES = exports.VALID_EXPOSURE_LEVELS = void 0;
exports.computeExposure = computeExposure;
const findingCopy_1 = require("../constants/findingCopy");
exports.VALID_EXPOSURE_LEVELS = new Set([
    'NONE',
    'REVIEWER',
    'REVIEWER_PLUS_SUPERVISOR',
    'PRINCIPAL_EXCEPTION',
    'PRINCIPAL_REQUIRED',
]);
const EXPOSURE_RANK = {
    NONE: 0,
    REVIEWER: 1,
    REVIEWER_PLUS_SUPERVISOR: 2,
    PRINCIPAL_EXCEPTION: 3,
    PRINCIPAL_REQUIRED: 4,
};
exports.VALID_EXPOSURE_REASON_CODES = new Set([
    'EXP-001_TRANSACTION_BASED_COMP',
    'EXP-002_FUNDED_ACCOUNT_TRIGGER',
    'EXP-003_PER_DOLLAR_INVESTED',
    'EXP-004_REVENUE_SHARE_SECURITIES',
    'EXP-005_REPEAT_OFFENDER',
    'EXP-006_CAMPAIGN_PATTERN',
    'EXP-007_OFF_TEMPLATE_CLAIM',
    'EXP-008_UNDISCLOSED_COMPENSATION',
    'EXP-009_GUARANTEE_OR_FRAUD_SIGNAL',
    'EXP-010_REVIEWER_ESCALATION',
    'EXP-011_CAMPAIGN_COMP_DRIFT',
    'EXP-012_MANUAL_POLICY_TRIGGER',
]);
// Human-readable labels for audit summaries
const REASON_LABEL = {
    'EXP-001_TRANSACTION_BASED_COMP': 'Transaction-based compensation structure',
    'EXP-002_FUNDED_ACCOUNT_TRIGGER': 'Compensation triggered by funded account',
    'EXP-003_PER_DOLLAR_INVESTED': 'Compensation scales per dollar invested',
    'EXP-004_REVENUE_SHARE_SECURITIES': 'Revenue share on securities product',
    'EXP-005_REPEAT_OFFENDER': 'Promoter has prior violations',
    'EXP-006_CAMPAIGN_PATTERN': 'Campaign-level violation pattern detected',
    'EXP-007_OFF_TEMPLATE_CLAIM': 'Content deviates from approved template',
    'EXP-008_UNDISCLOSED_COMPENSATION': 'Compensation disclosure missing or inadequate',
    'EXP-009_GUARANTEE_OR_FRAUD_SIGNAL': 'Guarantee language or fraud-like signal detected',
    'EXP-010_REVIEWER_ESCALATION': 'Manually escalated by reviewer',
    'EXP-011_CAMPAIGN_COMP_DRIFT': 'Compensation terms changed mid-campaign',
    'EXP-012_MANUAL_POLICY_TRIGGER': 'Manual policy override applied',
};
// ── Derivation ────────────────────────────────────────────────
/**
 * Compute exposure from currently available inputs.
 * Conservative, explainable, log-only in Phase 2.
 *
 * Never throws. Returns NONE with empty reasons if inputs
 * are missing or unrecognizable.
 */
function computeExposure(input) {
    const reasons = [];
    let level = 'NONE';
    const compType = (input.compensationType || '').toUpperCase();
    const txnClass = (input.transactionalityClass || '').toUpperCase();
    const sev = (input.severity || 'LOW').toUpperCase();
    // Derive which detection categories are present from the hit rule codes
    const categories = new Set();
    for (const code of input.hitRuleCodes) {
        categories.add((0, findingCopy_1.getFindingCopy)(code).category);
    }
    const hasSolicitation = categories.has('SOLICITATION');
    const hasDisclosure = categories.has('DISCLOSURE') || categories.has('COMPENSATION_DISCLOSURE');
    const hasPerformance = categories.has('PERFORMANCE_CLAIM');
    const hasGuarantee = input.hitRuleCodes.some(c => c === 'RISK-001' || c === 'LLM-003');
    const hasUrgency = categories.has('URGENCY_PRESSURE');
    // ── Reason code accumulation ───────────────────────────────
    // EXP-001: Transaction-based compensation structure
    if (txnClass === 'TRANSACTION_BASED' || input.isTransactionBased) {
        reasons.push('EXP-001_TRANSACTION_BASED_COMP');
    }
    // EXP-002: Funded account trigger
    if (compType === 'PER_ACCOUNT_OPENED_AND_FUNDED') {
        reasons.push('EXP-002_FUNDED_ACCOUNT_TRIGGER');
    }
    // EXP-003: Per dollar invested
    if (compType === 'PER_DOLLAR_INVESTED') {
        reasons.push('EXP-003_PER_DOLLAR_INVESTED');
    }
    // EXP-004: Revenue share on securities
    if (compType === 'REVENUE_SHARE_SECURITIES') {
        reasons.push('EXP-004_REVENUE_SHARE_SECURITIES');
    }
    // EXP-005: Repeat offender — TODO: requires promoter history query
    // Left as a stub. Will be activated when promoterPriorViolationCount
    // is passed in. For now, only fires if the caller explicitly provides
    // a count > 0.
    if ((input.promoterPriorViolationCount ?? 0) > 0) {
        reasons.push('EXP-005_REPEAT_OFFENDER');
    }
    // EXP-006: Campaign-level pattern — TODO: requires campaign query
    // Left as a stub. Will be activated when campaign-level violation
    // counts are available.
    if ((input.campaignViolationCount ?? 0) >= 3) {
        reasons.push('EXP-006_CAMPAIGN_PATTERN');
    }
    // EXP-007: Off-template claim — TODO: requires approved-template
    // comparison engine. Not implementable with current data.
    // EXP-008: Undisclosed compensation
    if (hasDisclosure) {
        reasons.push('EXP-008_UNDISCLOSED_COMPENSATION');
    }
    // EXP-009: Guarantee or fraud-like signal
    if (hasGuarantee) {
        reasons.push('EXP-009_GUARANTEE_OR_FRAUD_SIGNAL');
    }
    // EXP-010: Reviewer escalation — TODO: only available after
    // human review. Not available at write time.
    if (input.isReviewerEscalation === true) {
        reasons.push('EXP-010_REVIEWER_ESCALATION');
    }
    // EXP-011: Campaign compensation drift — TODO: requires
    // comparison against prior compensation terms for the same
    // campaign. Not implementable with current data.
    // EXP-012: Manual policy trigger — not available at write time.
    // Would be set by a supervisory action, not by the ingestion pipeline.
    // ── Level derivation ───────────────────────────────────────
    // A. PRINCIPAL_REQUIRED: transaction-based compensation types
    //    that inherently create broker-dealer-like liability
    const principalRequiredCompTypes = new Set([
        'PER_ACCOUNT_OPENED_AND_FUNDED',
        'PER_DOLLAR_INVESTED',
        'REVENUE_SHARE_SECURITIES',
        'PER_LEAD_CONVERTED_TO_INVESTOR',
    ]);
    if (principalRequiredCompTypes.has(compType)) {
        level = 'PRINCIPAL_REQUIRED';
    }
    // A2. PRINCIPAL_REQUIRED: transaction-based + solicitation/guarantee signal
    if (level !== 'PRINCIPAL_REQUIRED' &&
        txnClass === 'TRANSACTION_BASED' &&
        (hasSolicitation || hasGuarantee)) {
        level = 'PRINCIPAL_REQUIRED';
    }
    // B. PRINCIPAL_EXCEPTION: transaction-based without strong signal,
    //    or potentially-transactional with HIGH/CRITICAL severity
    if (level !== 'PRINCIPAL_REQUIRED') {
        if (txnClass === 'TRANSACTION_BASED') {
            // Transaction-based but no solicitation/guarantee — still needs
            // principal attention, just not the automatic-required level
            level = 'PRINCIPAL_EXCEPTION';
        }
        else if (txnClass === 'POTENTIALLY_TRANSACTIONAL' &&
            (sev === 'CRITICAL' || sev === 'HIGH')) {
            level = 'PRINCIPAL_EXCEPTION';
        }
    }
    // C. REVIEWER_PLUS_SUPERVISOR: HIGH/CRITICAL severity but
    //    compensation context is not principal-level
    if (EXPOSURE_RANK[level] < EXPOSURE_RANK['REVIEWER_PLUS_SUPERVISOR']) {
        if (sev === 'CRITICAL' || sev === 'HIGH') {
            level = 'REVIEWER_PLUS_SUPERVISOR';
        }
    }
    // D. REVIEWER: MEDIUM severity, no stronger trigger
    if (EXPOSURE_RANK[level] < EXPOSURE_RANK['REVIEWER']) {
        if (sev === 'MEDIUM') {
            level = 'REVIEWER';
        }
    }
    // E. NONE: LOW severity, no exposure triggers
    // (already the default)
    // Boost: if guarantee/fraud signal exists and level is below
    // PRINCIPAL_EXCEPTION, promote. A guarantee claim is serious
    // regardless of compensation structure.
    if (hasGuarantee &&
        EXPOSURE_RANK[level] < EXPOSURE_RANK['PRINCIPAL_EXCEPTION']) {
        level = 'PRINCIPAL_EXCEPTION';
    }
    // Boost: undisclosed compensation on a compensated promoter with
    // security-linked product warrants at least supervisor review
    if (hasDisclosure &&
        input.isSecurityLinked &&
        EXPOSURE_RANK[level] < EXPOSURE_RANK['REVIEWER_PLUS_SUPERVISOR']) {
        level = 'REVIEWER_PLUS_SUPERVISOR';
    }
    // ── Output ─────────────────────────────────────────────────
    // Phase 3 correction: only PRINCIPAL_REQUIRED sets the mandatory
    // principal-review flag. PRINCIPAL_EXCEPTION is visible in data and
    // debug layers but does NOT automatically route as mandatory principal
    // review. This is the key semantic change that makes principal routing
    // exposure-driven rather than severity-driven.
    const requiresPrincipalReview = level === 'PRINCIPAL_REQUIRED';
    const summary = buildSummary(level, reasons);
    return {
        exposureLevel: level,
        requiresPrincipalReview,
        exposureReasonCodes: reasons,
        exposureSummary: summary,
    };
}
// ── Summary builder ───────────────────────────────────────────
function buildSummary(level, reasons) {
    if (level === 'NONE')
        return 'No elevated supervisory exposure identified.';
    const levelLabel = {
        NONE: 'No exposure',
        REVIEWER: 'Reviewer attention required',
        REVIEWER_PLUS_SUPERVISOR: 'Supervisor review required',
        PRINCIPAL_EXCEPTION: 'Principal review recommended (exception)',
        PRINCIPAL_REQUIRED: 'Principal review required (mandatory)',
    };
    const reasonList = reasons
        .map(r => REASON_LABEL[r] || r)
        .join('; ');
    return `${levelLabel[level]}. Reasons: ${reasonList || 'general severity threshold'}.`;
}
//# sourceMappingURL=exposureEngine.js.map