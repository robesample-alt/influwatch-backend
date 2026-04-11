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
    'EXP-013_COMPENSATED_SOLICITATION',
    'EXP-014_CAMPAIGN_NOT_ACTIVATED',
    'EXP-015_UNAUTHORIZED_PROMOTER',
    'EXP-016_PORTAL_PROHIBITED_SOLICITATION',
    'EXP-017_ANTI_FRAUD_SIGNAL',
    'EXP-018_MARKETING_RULE_VIOLATION',
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
    'EXP-013_COMPENSATED_SOLICITATION': 'Solicitation detected with active affiliate link or referral code',
    'EXP-014_CAMPAIGN_NOT_ACTIVATED': 'Content ingested for campaign not yet activated by principal',
    'EXP-015_UNAUTHORIZED_PROMOTER': 'Promoter is not on the approved roster for this campaign',
    'EXP-016_PORTAL_PROHIBITED_SOLICITATION': 'Reg CF Rule 402(a) violation — funding portal solicitation prohibited',
    'EXP-017_ANTI_FRAUD_SIGNAL': 'Section 17(a) anti-fraud signal in issuer promotional content',
    'EXP-018_MARKETING_RULE_VIOLATION': 'Marketing Rule 206(4)-1 violation signal in RIA promotional content',
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
    const tenant = (input.tenantType || '').toUpperCase();
    // Derive which detection categories are present from the hit rule codes
    const categories = new Set();
    for (const code of input.hitRuleCodes) {
        categories.add((0, findingCopy_1.getFindingCopy)(code).category);
    }
    const hasSolicitation = categories.has('SOLICITATION');
    const hasDisclosure = categories.has('DISCLOSURE') || categories.has('COMPENSATION_DISCLOSURE');
    const hasGuarantee = input.hitRuleCodes.some(c => c === 'RISK-001' || c === 'LLM-003');
    // Specific rule presence flags used by the new escalation rules
    const ruleSet = new Set(input.hitRuleCodes);
    const hasDisc001 = ruleSet.has('DISC-001');
    const hasFintech003 = ruleSet.has('FINTECH-003');
    const hasFintech004 = ruleSet.has('FINTECH-004');
    const hasRiamr001 = ruleSet.has('RIAMR-001');
    const hasRega001 = ruleSet.has('REGA-001');
    const hasRega002 = ruleSet.has('REGA-002');
    const hasRega003 = ruleSet.has('REGA-003');
    const hasRega005 = ruleSet.has('REGA-005');
    const hasExp013Trigger = hasSolicitation && (input.hasAffiliateLink || input.hasReferralCode);
    // Approximate count of HIGH+ severity findings present in the hit list.
    // The exposure engine doesn't have per-hit severity, so we approximate by
    // counting rule codes that are inherently HIGH/CRITICAL by category.
    const highHitCount = input.hitRuleCodes.filter(c => {
        return c.startsWith('RISK-')
            || c.startsWith('REGA-')
            || c === 'FINTECH-003'
            || c === 'FINTECH-004'
            || c === 'RIAMR-001'
            || c === 'RIAMR-004'
            || c === 'RIAMR-005'
            || c === 'LLM-003'
            || c === 'REGCF-001';
    }).length;
    const threePlusHighFindings = highHitCount >= 3;
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
    // EXP-011: Campaign compensation drift — activated in Phase 4.
    // Fires when the promoter's compensation type is explicitly not
    // in the campaign's allowed compensation types list.
    if (input.compensationMismatchWithCampaign === true) {
        reasons.push('EXP-011_CAMPAIGN_COMP_DRIFT');
    }
    // EXP-012: Manual policy trigger — not available at write time.
    // Would be set by a supervisory action, not by the ingestion pipeline.
    // EXP-013: Compensated solicitation — solicitation behavior detected
    // AND the promoter has an active affiliate link or referral code.
    // This connects the content behavior (what they said) to the
    // distribution mechanism (their tracked link/code). The triangle of
    // solicitation + compensation + tracked distribution is what FINRA
    // examines most closely.
    const hasDistributionMechanism = input.hasAffiliateLink || input.hasReferralCode;
    if (hasSolicitation && hasDistributionMechanism) {
        reasons.push('EXP-013_COMPENSATED_SOLICITATION');
    }
    // EXP-014: Campaign not activated — content ingested for a campaign
    // that has not been activated by a principal. The principal hasn't
    // signed off on the supervisory framework yet, so all content under
    // this campaign requires principal attention.
    if (input.campaignNotActivated === true) {
        reasons.push('EXP-014_CAMPAIGN_NOT_ACTIVATED');
    }
    // EXP-015: Unauthorized promoter — content ingested for a promoter
    // who is not on the approved CampaignPromoter roster for the
    // campaign. Principal must review because the promoter was never
    // signed off as part of the campaign's supervisory framework.
    if (input.unauthorizedPromoter === true) {
        reasons.push('EXP-015_UNAUTHORIZED_PROMOTER');
    }
    // EXP-016: Portal-prohibited solicitation — Reg CF Rule 402(a)
    // funding portals and their associated promoters are prohibited
    // from soliciting investment purchases.
    if (input.portalProhibitedSolicitation === true) {
        reasons.push('EXP-016_PORTAL_PROHIBITED_SOLICITATION');
    }
    // EXP-017: Section 17(a) anti-fraud signal — fires for ISSUER tenant
    // when REGA-001 (testing the waters), REGA-002 with CRITICAL severity
    // (capability claims), or REGA-005 (pure upside framing) is detected.
    if (input.antiFraudSignal === true) {
        reasons.push('EXP-017_ANTI_FRAUD_SIGNAL');
    }
    // EXP-018: Marketing Rule violation — fires for RIA tenant when
    // RIAMR-004 (cherry-picked results), RIAMR-003 without disclosure,
    // or RIAMR-001 with CRITICAL severity is detected.
    if (input.marketingRuleViolation === true) {
        reasons.push('EXP-018_MARKETING_RULE_VIOLATION');
    }
    // ── Level derivation ───────────────────────────────────────
    //
    // New floor-based model. Compensation posture sets the supervision
    // FLOOR (the minimum level we will ever land on). Detection signals
    // ESCALATE above the floor. Compensation alone never escalates.
    //
    //   NON_TRANSACTIONAL              → floor NONE
    //   ELEVATED_NON_TRANSACTIONAL     → floor NONE
    //                                    (any violation goes to REVIEWER)
    //   POTENTIALLY_TRANSACTIONAL      → floor REVIEWER
    //   TRANSACTION_BASED              → floor REVIEWER
    //                                    (human eyes on every record,
    //                                     nothing more from comp alone)
    //
    // ───────────────────────────────────────────────────────────
    // Step 1 — Floor by compensation class
    let floor = 'NONE';
    if (txnClass === 'POTENTIALLY_TRANSACTIONAL' || txnClass === 'TRANSACTION_BASED') {
        floor = 'REVIEWER';
    }
    else if (txnClass === 'ELEVATED_NON_TRANSACTIONAL') {
        // Any violation lifts ELEVATED_NON_TRANSACTIONAL to REVIEWER. With
        // zero violations it stays at NONE.
        if (input.hitRuleCodes.length > 0) {
            floor = 'REVIEWER';
        }
    }
    level = floor;
    // Step 2 — REVIEWER → REVIEWER_PLUS_SUPERVISOR
    const isCompensatedPromoter = input.isTransactionBased
        || input.isSecurityLinked
        || (txnClass && txnClass !== 'NON_TRANSACTIONAL');
    let escalateToSupervisor = sev === 'HIGH' || sev === 'CRITICAL' ||
        (hasDisc001 && isCompensatedPromoter) ||
        hasFintech003 ||
        hasRiamr001 ||
        (tenant === 'ISSUER' && (hasRega002 || hasRega003));
    if (escalateToSupervisor && EXPOSURE_RANK[level] < EXPOSURE_RANK['REVIEWER_PLUS_SUPERVISOR']) {
        level = 'REVIEWER_PLUS_SUPERVISOR';
    }
    // Step 3 — REVIEWER_PLUS_SUPERVISOR → PRINCIPAL_REQUIRED
    let escalateToPrincipal = hasExp013Trigger || // EXP-013
        (txnClass === 'TRANSACTION_BASED' && hasGuarantee) || // EXP-009 on TRANSACTION_BASED
        (txnClass === 'TRANSACTION_BASED' && hasDisc001 && (sev === 'HIGH' || sev === 'CRITICAL')) ||
        (txnClass === 'TRANSACTION_BASED' && hasFintech004) ||
        hasRega001 || // REGA-001 — testing-the-waters
        (tenant === 'ISSUER' && hasRega005) ||
        input.portalProhibitedSolicitation === true || // EXP-016 — absolute
        input.antiFraudSignal === true || // EXP-017
        input.marketingRuleViolation === true || // EXP-018
        input.campaignNotActivated === true || // EXP-014
        input.unauthorizedPromoter === true || // EXP-015
        threePlusHighFindings;
    if (escalateToPrincipal) {
        level = 'PRINCIPAL_REQUIRED';
    }
    // Step 4 — REG_CF absolute override.
    // Reg CF Rule 402(a) is an absolute prohibition on funding-portal
    // solicitation. ANY transaction-based compensation in a Reg CF
    // tenant goes to PRINCIPAL_REQUIRED regardless of content quality.
    if (tenant === 'REG_CF' && txnClass === 'TRANSACTION_BASED') {
        level = 'PRINCIPAL_REQUIRED';
    }
    // Step 5 — Severity-only safety net
    // If no comp class set a floor (true UNCOMPENSATED) but the content
    // itself is HIGH/CRITICAL severity, route to REVIEWER_PLUS_SUPERVISOR.
    // MEDIUM severity uncompensated content goes to REVIEWER.
    if (EXPOSURE_RANK[level] < EXPOSURE_RANK['REVIEWER_PLUS_SUPERVISOR'] && (sev === 'HIGH' || sev === 'CRITICAL')) {
        level = 'REVIEWER_PLUS_SUPERVISOR';
    }
    if (EXPOSURE_RANK[level] < EXPOSURE_RANK['REVIEWER'] && sev === 'MEDIUM') {
        level = 'REVIEWER';
    }
    // ── ISSUER threshold adjustment ─────────────────────────────
    // Direct issuers have a single designated compliance contact, not a
    // Series 24 principal with bandwidth for hundreds of records/day.
    // Downgrade PRINCIPAL_REQUIRED to REVIEWER_PLUS_SUPERVISOR unless a
    // clear anti-fraud signal is present: EXP-017, guarantee/fraud,
    // missing disclosure on HIGH+ content, or 3+ HIGH severity findings.
    if (tenant === 'ISSUER' && level === 'PRINCIPAL_REQUIRED') {
        const hasAntiFraudSignalPresent = input.antiFraudSignal === true;
        const hasGuaranteeFraud = hasGuarantee;
        const missingDiscWithHigh = hasDisclosure && (sev === 'CRITICAL' || sev === 'HIGH');
        const multipleHighHits = threePlusHighFindings;
        if (!hasAntiFraudSignalPresent && !hasGuaranteeFraud && !missingDiscWithHigh && !multipleHighHits) {
            level = 'REVIEWER_PLUS_SUPERVISOR';
        }
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