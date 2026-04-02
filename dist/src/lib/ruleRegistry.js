"use strict";
// ============================================================
// SOURCE — do not distribute. This file is compiled into
// @robesample-alt/influwatch-core for distribution.
// Keep this file in place for local backend development.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRuleHits = detectRuleHits;
exports.computeSeverityFromHits = computeSeverityFromHits;
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Rule Registry
//
// Single canonical source of truth for all phrase-based
// compliance rule detection. Replaces both:
//   - PHRASES dict in severityEngine.ts
//   - RISKY_PHRASES list in contentRecord.service.ts
//
// Each entry maps a phrase to the rule it implicates and the
// severity of that specific hit. Per-hit severity reflects
// the phrase's risk level — not the rule's nominal ceiling.
// A single rule (e.g. IW-BD-007) can produce hits at multiple
// severity levels depending on which phrase matched.
//
// Phase 1: PHRASE_MATCH only.
// DISCLOSURE_CHECK and PATTERN_MATCH are reserved for Phase 2.
// ============================================================
const client_1 = require("@prisma/client");
// ─────────────────────────────────────────
// CANONICAL PHRASE → RULE MAP
//
// RISK-001  False or Misleading Statements
//           SEC Rule 10b-5 / FINRA 2010
//           Phrases: explicit false promises, insider claims
//
// RISK-002  Unbalanced Risk Disclosure
//           FINRA Rule 2210(d)
//           Phrases: risk elimination language (CRITICAL)
//                    urgency / FOMO / unrealistic outcome (HIGH)
//
// RISK-003  Performance Claims Without Required Disclosures
//           SEC Rule 206(4)-1
//           Phrases: performance / yield / return claims
//
// RISK-004  Forward-Looking Statement Without Required Disclaimer
//           SEC Rule 10b-5 / FINRA Rule 2210(d)(1)
//           Absence-gated: fires when forward-looking trigger detected
//           AND none of the required forward-looking disclaimers are present.
//
// RISK-005  Testimonial Without Required Disclosures
//           SEC Rule 206(4)-1(b)(2) — Testimonial and Endorsement Requirements
//           Absence-gated: fires when testimonial structure detected
//           AND none of the required testimonial disclosures are present.
//
// DISC-001  Compensated Endorsement Disclosure Absent          [Phase 2 — no phrases yet]
//           SEC Rule 206(4)-1(b)(1)
//
// DISC-002  Paid Partnership Tag Absent                        [Phase 2 — no phrases yet]
//           SEC Rule 206(4)-1(b)(1) / FTC .com Disclosures
// ─────────────────────────────────────────
const PHRASE_MAP = {
    // ── RISK-001 — CRITICAL ───────────────────────────────────
    'guaranteed return': { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    'guaranteed returns': { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    'guaranteed profit': { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    '100% return': { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    'cannot lose': { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    "can't lose": { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    'will double': { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    'will triple': { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    'insider tip': { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    'insider information': { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: client_1.Severity.CRITICAL },
    // ── RISK-002 — CRITICAL ───────────────────────────────────
    'risk free investment': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.CRITICAL },
    'risk-free investment': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.CRITICAL },
    'no risk': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.CRITICAL },
    'risk free': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.CRITICAL },
    // ── RISK-002 — HIGH ───────────────────────────────────────
    'get rich': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    'financial freedom': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    'quit your job': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    'passive income': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    'massive gains': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    'huge upside': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    "can't miss": { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    'once in a lifetime': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    'ground floor opportunity': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    'huge opportunity': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    'unique moment': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: client_1.Severity.HIGH },
    // ── RISK-003 — MEDIUM ─────────────────────────────────────
    'high yield': { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: client_1.Severity.MEDIUM },
    'above market returns': { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: client_1.Severity.MEDIUM },
    'outperform': { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: client_1.Severity.MEDIUM },
    'beat the market': { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: client_1.Severity.MEDIUM },
    'strong returns': { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: client_1.Severity.MEDIUM },
    'projected growth': { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: client_1.Severity.MEDIUM },
    'significant upside': { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: client_1.Severity.MEDIUM },
};
// ─────────────────────────────────────────
// DISCLOSURE PATTERNS
//
// Presence of ANY of these in bodyText means the content
// contains a required disclosure. Used by DISC-001 / DISC-002.
// ─────────────────────────────────────────
const DISCLOSURE_PATTERNS = [
    '#ad',
    '#sponsored',
    '#paidpartner',
    'paid partnership',
    'not financial advice',
    'this is not financial advice',
];
// ── COMP-002 solicitation phrases (evaluated only when posture = CRITICAL) ──
const COMP_002_PHRASES = [
    'invest now',
    'click to invest',
    'start investing',
    'fund your account',
];
// ── COMP-003 ownership disclosure indicators (absence triggers the rule) ────
const OWNERSHIP_DISCLOSURE_PATTERNS = [
    'i own shares',
    'i am a shareholder',
    'i have equity',
    'i receive equity',
    'i have a financial interest',
    'equity holder',
    'revenue share',
    'i earn a commission',
];
const COMP_003_FORMS = new Set(['EQUITY', 'CARRY', 'REVENUE_SHARE']);
// ── RISK-004 forward-looking triggers (at least one must be present) ──────────
const RISK_004_TRIGGERS = [
    'will grow',
    'will increase',
    'will outperform',
    'will generate',
    'will deliver',
    'expect to',
    'expected to',
    'anticipate',
    'projected to',
    'forecast',
    'on track to',
    'poised to',
    'set to grow',
    'positioned to',
    'heading toward',
];
// ── RISK-004 safe-harbour disclaimers (absence of ALL triggers the rule) ──────
const RISK_004_DISCLAIMERS = [
    'past performance',
    'forward-looking statement',
    'actual results may differ',
    'no guarantee of future',
    'results may vary',
    'not a guarantee',
    'subject to change',
];
// ── RISK-005 testimonial triggers (at least one must be present) ──────────────
const RISK_005_TRIGGERS = [
    'i made',
    'i earned',
    'i returned',
    'i profited',
    'my portfolio grew',
    'my returns',
    'i doubled',
    'i tripled',
    'turned my',
    'made me rich',
    'my investment grew',
    'i got rich',
];
// ── RISK-005 required testimonial disclosures (absence of ALL triggers the rule)
const RISK_005_DISCLOSURES = [
    'results not typical',
    'individual results may vary',
    'paid testimonial',
    'compensated reviewer',
    'results are not representative',
    'typical investor',
    'your results may vary',
    'not all investors',
];
// ─────────────────────────────────────────
// DETECTION FUNCTIONS
// ─────────────────────────────────────────
/**
 * Scan bodyText for all known rule-mapped phrases.
 * Returns one RuleHit per matched phrase.
 * Case-insensitive. Multiple matches from the same record are expected.
 *
 * Pass compensationCtx to enable COMP-001, COMP-002, and COMP-003 evaluation.
 */
function detectRuleHits(bodyText, compensationCtx) {
    if (!bodyText)
        return [];
    const lower = bodyText.toLowerCase();
    const hits = [];
    for (const [phrase, def] of Object.entries(PHRASE_MAP)) {
        if (lower.includes(phrase)) {
            hits.push({
                ruleCode: def.ruleCode,
                ruleName: def.ruleName,
                matchedPhrase: phrase,
                severity: def.severity,
                detectionMethod: 'PHRASE_MATCH',
            });
        }
    }
    // ── DISC-001 / DISC-002 — Disclosure absence checks ──────
    // fix 1: normalise patterns to lowercase before comparison
    const hasDisclosure = DISCLOSURE_PATTERNS.some(p => lower.includes(p.toLowerCase()));
    // DISC-001: risky promotional content with no disclosure at all
    // fix 2: guard against duplicates before pushing
    const hasRiskyHit = hits.some(h => h.ruleCode.startsWith('RISK-'));
    const alreadyDisc001 = hits.some(h => h.ruleCode === 'DISC-001');
    if (hasRiskyHit && !hasDisclosure && !alreadyDisc001) {
        hits.push({
            ruleCode: 'DISC-001',
            ruleName: 'Missing Required Disclosure',
            matchedPhrase: '[no disclosure detected]',
            severity: client_1.Severity.HIGH,
            detectionMethod: 'DISCLOSURE_CHECK',
        });
    }
    // DISC-002: compensation language with no disclosure
    // fix 2: guard against duplicates
    // fix 3: use specific compensation phrases instead of bare 'partner'
    const PAID_TRIGGERS = ['paid partner', 'brand partner', 'sponsored post', 'sponsored by', 'affiliate'];
    const paidTrigger = PAID_TRIGGERS.find(t => lower.includes(t));
    const alreadyDisc002 = hits.some(h => h.ruleCode === 'DISC-002');
    if (paidTrigger && !hasDisclosure && !alreadyDisc002) {
        hits.push({
            ruleCode: 'DISC-002',
            ruleName: 'Paid Promotion Without Disclosure',
            matchedPhrase: paidTrigger,
            severity: client_1.Severity.HIGH,
            detectionMethod: 'DISCLOSURE_CHECK',
        });
    }
    // ── COMP-001 — Transaction-Based Compensation Solicitation Risk ──────────
    // Fires when the promoter has a transaction-based, security-linked
    // compensation structure AND an affiliate link was detected in the content.
    if (compensationCtx &&
        compensationCtx.isTransactionBased &&
        compensationCtx.isSecurityLinked &&
        compensationCtx.hasAffiliateLink) {
        hits.push({
            ruleCode: 'COMP-001',
            ruleName: 'Transaction-Based Compensation Solicitation Risk',
            matchedPhrase: '[affiliate link detected with transaction-based compensation]',
            severity: client_1.Severity.CRITICAL,
            detectionMethod: 'DISCLOSURE_CHECK',
        });
    }
    // ── COMP-002 — Unregistered Solicitation Language ─────────────────────────
    // Fires for each solicitation phrase found when posture is CRITICAL.
    if (compensationCtx && compensationCtx.supervisionPosture === 'CRITICAL') {
        for (const phrase of COMP_002_PHRASES) {
            if (lower.includes(phrase)) {
                hits.push({
                    ruleCode: 'COMP-002',
                    ruleName: 'Unregistered Solicitation Language',
                    matchedPhrase: phrase,
                    severity: client_1.Severity.CRITICAL,
                    detectionMethod: 'PHRASE_MATCH',
                });
            }
        }
    }
    // ── COMP-003 — Compensation Disclosure Insufficient ───────────────────────
    // Fires when compensation form is equity/carry/revenue-share and the content
    // contains no ownership disclosure indicator.
    if (compensationCtx && COMP_003_FORMS.has(compensationCtx.compensationForm)) {
        const hasOwnershipDisclosure = OWNERSHIP_DISCLOSURE_PATTERNS.some(p => lower.includes(p.toLowerCase()));
        if (!hasOwnershipDisclosure) {
            hits.push({
                ruleCode: 'COMP-003',
                ruleName: 'Compensation Disclosure Insufficient',
                matchedPhrase: '[no ownership disclosure detected]',
                severity: client_1.Severity.HIGH,
                detectionMethod: 'DISCLOSURE_CHECK',
            });
        }
    }
    // ── RISK-004 — Forward-Looking Statement Without Required Disclaimer ────────
    // Absence-gated: fires when a forward-looking trigger phrase is detected
    // AND none of the required safe-harbour disclaimers are present.
    const risk004Trigger = RISK_004_TRIGGERS.find(t => lower.includes(t));
    if (risk004Trigger) {
        const hasDisclaimer = RISK_004_DISCLAIMERS.some(d => lower.includes(d));
        if (!hasDisclaimer) {
            hits.push({
                ruleCode: 'RISK-004',
                ruleName: 'Forward-Looking Statement Without Required Disclaimer',
                matchedPhrase: risk004Trigger,
                severity: client_1.Severity.HIGH,
                detectionMethod: 'DISCLOSURE_CHECK',
            });
        }
    }
    // ── RISK-005 — Testimonial Without Required Disclosures ────────────────────
    // Absence-gated: fires when a testimonial trigger phrase is detected
    // AND none of the required testimonial disclosures are present.
    const risk005Trigger = RISK_005_TRIGGERS.find(t => lower.includes(t));
    if (risk005Trigger) {
        const hasTestimonialDisclosure = RISK_005_DISCLOSURES.some(d => lower.includes(d));
        if (!hasTestimonialDisclosure) {
            hits.push({
                ruleCode: 'RISK-005',
                ruleName: 'Testimonial Without Required Disclosures',
                matchedPhrase: risk005Trigger,
                severity: client_1.Severity.HIGH,
                detectionMethod: 'DISCLOSURE_CHECK',
            });
        }
    }
    return hits;
}
const SEVERITY_PRIORITY = [
    client_1.Severity.CRITICAL,
    client_1.Severity.HIGH,
    client_1.Severity.MEDIUM,
    client_1.Severity.LOW,
];
/**
 * Derive the overall severity for a record from its rule hits.
 * Returns the highest severity found, or LOW if no hits.
 */
function computeSeverityFromHits(hits) {
    for (const level of SEVERITY_PRIORITY) {
        if (hits.some(h => h.severity === level))
            return level;
    }
    return client_1.Severity.LOW;
}
//# sourceMappingURL=ruleRegistry.js.map