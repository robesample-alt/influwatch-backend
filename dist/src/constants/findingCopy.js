"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Finding Copy — plain-English detection labels for user-facing surfaces
//
// Single source of truth for mapping internal rule codes
// (RISK-*, DISC-*, COMP-*, LLM-*) to the plain-English titles
// and descriptions shown in Flag Review, Promoter Detail,
// Queue cells, and the regulator-facing Evidence Package PDF.
//
// Rule codes and detectionMethod enum values MUST NEVER be
// rendered to users — they are internal identifiers only.
// Screenshots that leak rule codes expose detection taxonomy
// and allow competitors / adversarial promoters to reverse-
// engineer which patterns we catch.
//
// The frontend (single-file HTML) mirrors this mapping inline.
// Keep both copies in sync when adding or changing rules.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.FINDING_COPY = exports.UNKNOWN_FINDING = void 0;
exports.getFindingCopy = getFindingCopy;
exports.groupDetections = groupDetections;
/**
 * Fallback shown for any rule code not in the map. Never leaks
 * the raw code to users — generic "review required" label.
 */
exports.UNKNOWN_FINDING = {
    title: 'Compliance Review Required',
    description: 'This content was flagged by an automated review rule and requires supervisor assessment.',
    category: 'UNKNOWN',
};
/**
 * Rule code → plain-English finding copy.
 *
 * Note: multiple internal rule codes intentionally collapse to
 * the same public category. That collapse is a feature, not a
 * bug — it obscures method from screenshots and reinforces
 * that the category is a regulatory concept.
 */
exports.FINDING_COPY = {
    // ── RISK family — promotional claim violations ──
    'RISK-001': {
        title: 'Unverifiable Performance Claim',
        description: 'Content contains absolute return promises, guarantees, or insider-knowledge language that cannot be substantiated under securities advertising rules.',
        category: 'PERFORMANCE_CLAIM',
    },
    'RISK-002': {
        title: 'Unbalanced Risk Portrayal',
        description: 'Content emphasizes upside or lifestyle outcomes without balanced discussion of investment risk, which is required for compensated content referencing securities.',
        category: 'UNBALANCED_RISK',
    },
    'RISK-003': {
        title: 'Unverifiable Performance Claim',
        description: 'Content references specific performance expectations or relative outperformance without the disclosures required when past or projected returns are discussed.',
        category: 'PERFORMANCE_CLAIM',
    },
    'RISK-004': {
        title: 'Forward-Looking Statement Without Disclaimer',
        description: 'Content contains predictions about future fund or company performance without the disclaimer language required for forward-looking statements.',
        category: 'FORWARD_LOOKING',
    },
    'RISK-005': {
        title: 'Testimonial Without Required Disclosures',
        description: 'Content includes a personal endorsement or testimonial without the compensation, typicality, and risk disclosures required when testimonials are used in investment promotion.',
        category: 'TESTIMONIAL',
    },
    // ── DISC family — disclosure violations ──
    'DISC-001': {
        title: 'No Paid Relationship Disclosure',
        description: 'No paid relationship disclosure detected. FTC Endorsement Guides require clear and conspicuous disclosure of material connections. FINRA Rule 2210 requires balanced communications.',
        category: 'DISCLOSURE',
    },
    'DISC-002': {
        title: 'Disclosure Below Fold',
        description: 'Disclosure language detected but appears late in content. FTC standard requires disclosure before the fold — visible without clicking "more" or scrolling.',
        category: 'DISCLOSURE',
    },
    // ── COMP family — compensation-structure risk ──
    'COMP-001': {
        title: 'Transaction-Based Compensation Risk',
        description: 'Promoter receives transaction-based compensation on a security-linked product, which creates elevated supervisory obligations regardless of content.',
        category: 'COMPENSATION_STRUCTURE',
    },
    'COMP-002': {
        title: 'Solicitation Concern',
        description: 'Content directs the audience toward an investment transaction. For a transaction-compensated promoter of a security, this may constitute unregistered broker-dealer activity.',
        category: 'SOLICITATION',
    },
    'COMP-003': {
        title: 'Compensation Disclosure Insufficient',
        description: 'Revenue-share or equity-linked compensation arrangement detected without the ownership-interest disclosure that compensation structure requires.',
        category: 'COMPENSATION_DISCLOSURE',
    },
    // ── LLM family — semantic findings ──
    'LLM-001': {
        title: 'Solicitation Concern',
        description: 'Content actively directs the audience toward a specific investment transaction. Compensated promoters of securities generally cannot solicit transactions without broker-dealer registration.',
        category: 'SOLICITATION',
    },
    'LLM-002': {
        title: 'Disclosure Issue',
        description: 'The required compensation disclosure appears missing or inadequate given the apparent promotional context of the content.',
        category: 'DISCLOSURE',
    },
    'LLM-003': {
        title: 'Unverifiable Performance Claim',
        description: 'Content contains performance claims, guarantees, or return expectations that would require substantiation and disclosures absent from this content.',
        category: 'PERFORMANCE_CLAIM',
    },
    'LLM-004': {
        title: 'Urgency Pressure Tactic',
        description: 'Content uses scarcity, time pressure, or fear-of-missing-out language to induce immediate investor action — a pattern identified as a high-risk marketing tactic.',
        category: 'URGENCY_PRESSURE',
    },
    'LLM-005': {
        title: 'Unbalanced Risk Portrayal',
        description: 'Content presents returns or outcomes without corresponding risk disclosure in a manner that may mislead a reasonable investor about the nature of the investment.',
        category: 'UNBALANCED_RISK',
    },
    // ── FINTECH family — fintech-specific violations ──
    'FINTECH-001': {
        title: 'Unqualified Fee Claims',
        description: 'Content contains unqualified fee claims ("commission-free", "no fees") without mentioning other applicable costs such as spreads, payment for order flow, or account fees.',
        category: 'PERFORMANCE_CLAIM',
    },
    'FINTECH-002': {
        title: 'Account Opening Solicitation',
        description: 'Content actively solicits account opening or funding with referral codes, signup bonuses, or incentive offers. For compensated promoters this may constitute broker-dealer-like activity.',
        category: 'SOLICITATION',
    },
    'FINTECH-003': {
        title: 'Personal Performance Claims',
        description: 'Content contains personal trading or portfolio performance claims from a compensated promoter. Such claims may constitute misleading testimonials under SEC and FINRA rules.',
        category: 'PERFORMANCE_CLAIM',
    },
    'FINTECH-004': {
        title: 'Promissory Language',
        description: 'Content contains promissory or guaranteed-outcome language that violates FINRA Rule 2210(d)(1) regardless of product type. No promoter may imply guaranteed positive investment outcomes.',
        category: 'PERFORMANCE_CLAIM',
    },
    'FINTECH-005': {
        title: 'Urgency Pressure Tactic',
        description: 'Content uses urgency, time pressure, or artificial scarcity to induce immediate action on account opening or funding — a pattern that regulators consider a high-risk marketing tactic.',
        category: 'URGENCY_PRESSURE',
    },
    // ── EXP family — exposure-level structural flags ──
    'EXP-014': {
        title: 'Campaign Not Activated',
        description: 'Content was ingested for a campaign that has not yet been activated by a principal. All content under unactivated campaigns requires principal review until the supervisory framework is signed off.',
        category: 'COMPENSATION_STRUCTURE',
    },
    'EXP-015': {
        title: 'Unauthorized Campaign Promoter',
        description: 'Promoter is not on the approved roster for this campaign. Content from unapproved promoters requires mandatory principal review.',
        category: 'COMPENSATION_STRUCTURE',
    },
};
/**
 * Return the plain-English copy for a rule code, falling back
 * to the generic "Compliance Review Required" label so nothing
 * ever leaks a raw code.
 */
function getFindingCopy(ruleCode) {
    if (!ruleCode)
        return exports.UNKNOWN_FINDING;
    return exports.FINDING_COPY[ruleCode] || exports.UNKNOWN_FINDING;
}
const SEVERITY_RANK = {
    LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3,
};
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
function groupDetections(detections) {
    const byCategory = new Map();
    for (const d of detections) {
        const copy = getFindingCopy(d.ruleCode);
        const sev = (d.severity || 'LOW').toUpperCase();
        const lang = (d.matchedPhrase || '').trim();
        let entry = byCategory.get(copy.category);
        if (!entry) {
            entry = {
                category: copy.category,
                title: copy.title,
                description: copy.description,
                severity: sev,
                flaggedLanguage: [],
            };
            byCategory.set(copy.category, entry);
        }
        if ((SEVERITY_RANK[sev] ?? 0) > (SEVERITY_RANK[entry.severity] ?? 0)) {
            entry.severity = sev;
        }
        if (lang && !entry.flaggedLanguage.includes(lang)) {
            entry.flaggedLanguage.push(lang);
        }
    }
    // Sort by severity descending — CRITICAL first
    return Array.from(byCategory.values()).sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0));
}
//# sourceMappingURL=findingCopy.js.map