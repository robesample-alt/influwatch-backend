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
    // ── REGCF family — Reg CF specific violations ──
    'REGCF-001': {
        title: 'Portal-Prohibited Solicitation',
        description: 'Portal-prohibited solicitation detected. Reg CF Rule 402(a) strictly prohibits funding portals and their promoters from soliciting investment purchases. This language crosses from promotion into solicitation.',
        category: 'SOLICITATION',
    },
    'REGCF-002': {
        title: 'Equity Investment Solicitation',
        description: 'Equity investment solicitation detected. Content is actively soliciting investment in a Reg CF offering. Requires disclosure of compensation arrangement and principal review.',
        category: 'SOLICITATION',
    },
    'REGCF-003': {
        title: 'Investment Limit Misrepresentation',
        description: 'Investment limit misrepresentation risk. Reg CF imposes strict annual investment limits on non-accredited investors. Content suggesting unlimited investment may violate offering terms.',
        category: 'PERFORMANCE_CLAIM',
    },
    'REGCF-004': {
        title: 'Campaign Urgency Tactic',
        description: 'Campaign urgency language detected. Claims about campaign status, funding levels, or closing deadlines must be accurate and not create artificial pressure.',
        category: 'URGENCY_PRESSURE',
    },
    'REGCF-005': {
        title: 'Misleading Issuer Claims',
        description: 'Misleading issuer capability claims detected. SEC enforcement has specifically targeted false or exaggerated technology and business claims in Reg CF promotional content.',
        category: 'PERFORMANCE_CLAIM',
    },
    // ── REGA family — Reg A+ direct issuer violations ──
    'REGA-001': {
        title: 'Testing the Waters Violation',
        description: 'Testing-the-waters violation detected. Reg A Rule 255 prohibits solicitation of investor interest before an offering is qualified with the SEC. This content may constitute prohibited pre-qualification solicitation.',
        category: 'SOLICITATION',
    },
    'REGA-002': {
        title: 'Misleading Capability Claim',
        description: 'Potentially misleading capability claim detected. Unverifiable technology or product claims in promotional content create Securities Act Section 17(a) exposure. Verify against current offering documents before approving.',
        category: 'PERFORMANCE_CLAIM',
    },
    'REGA-003': {
        title: 'Inflated Traction Metric',
        description: 'Potentially inflated traction metric detected. Unverifiable business performance claims create Section 17(a) exposure. Verify claimed figures against current offering disclosure before approving.',
        category: 'PERFORMANCE_CLAIM',
    },
    'REGA-004': {
        title: 'Offering Term Misrepresentation',
        description: 'Offering term representation detected. Claims about investment minimums, accreditation requirements, or offering access must match current Form 1-A terms. Verify before approving.',
        category: 'PERFORMANCE_CLAIM',
    },
    'REGA-005': {
        title: 'Pure Upside Framing Without Risk',
        description: 'Pure upside framing without risk disclosure. Section 17(a) prohibits misleading omission of material risk. Promotional content presenting only upside without material risk disclosure is presumptively misleading.',
        category: 'UNBALANCED_RISK',
    },
    'REGA-006': {
        title: 'Credibility Puffery',
        description: 'Unverifiable credibility claim detected. Founder or team credential claims that cannot be verified create potential Section 17(a) exposure if false. Flag for verification against offering documents.',
        category: 'PERFORMANCE_CLAIM',
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
    'EXP-016': {
        title: 'Portal-Prohibited Solicitation',
        description: 'Portal-prohibited solicitation — Reg CF Rule 402(a) violation. Funding portals and their associated promoters are strictly prohibited from soliciting investment purchases.',
        category: 'SOLICITATION',
    },
    'EXP-017': {
        title: 'Anti-Fraud Signal',
        description: 'Anti-fraud signal detected in issuer promotional content. Securities Act Section 17(a) prohibits false or misleading statements in connection with a securities offering. This content contains language patterns associated with SEC enforcement actions against Reg A issuers including Unicoin (May 2025) and Nate Inc (April 2026).',
        category: 'PERFORMANCE_CLAIM',
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