"use strict";
// ============================================================
// SOURCE — do not distribute. This file is compiled into
// @robesample-alt/influwatch-core for distribution.
// Keep this file in place for local backend development.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRuleHits = detectRuleHits;
exports.computeSeverityFromHits = computeSeverityFromHits;
exports.getRuleMetadata = getRuleMetadata;
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
    // ── FINTECH-001 — Fee Misrepresentation ────────────────────
    'commission-free': { ruleCode: 'FINTECH-001', ruleName: 'Fee Misrepresentation', severity: client_1.Severity.MEDIUM },
    'no fees': { ruleCode: 'FINTECH-001', ruleName: 'Fee Misrepresentation', severity: client_1.Severity.MEDIUM },
    'free trading': { ruleCode: 'FINTECH-001', ruleName: 'Fee Misrepresentation', severity: client_1.Severity.MEDIUM },
    'zero commission': { ruleCode: 'FINTECH-001', ruleName: 'Fee Misrepresentation', severity: client_1.Severity.MEDIUM },
    'no commissions': { ruleCode: 'FINTECH-001', ruleName: 'Fee Misrepresentation', severity: client_1.Severity.MEDIUM },
    'trade for free': { ruleCode: 'FINTECH-001', ruleName: 'Fee Misrepresentation', severity: client_1.Severity.MEDIUM },
    'no trading fees': { ruleCode: 'FINTECH-001', ruleName: 'Fee Misrepresentation', severity: client_1.Severity.MEDIUM },
    // ── FINTECH-002 — Account Opening Solicitation ────────────
    'open an account': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'sign up with my link': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'use my code': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'use my link': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'open and fund': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'get free stocks': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'free stock when you sign up': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'bonus when you fund': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'referral bonus': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'sign-up bonus': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    'deposit bonus': { ruleCode: 'FINTECH-002', ruleName: 'Account Opening Solicitation', severity: client_1.Severity.HIGH },
    // ── FINTECH-003 — Performance Claims ──────────────────────
    'my portfolio': { ruleCode: 'FINTECH-003', ruleName: 'Promoter Performance Claims', severity: client_1.Severity.HIGH },
    'my returns': { ruleCode: 'FINTECH-003', ruleName: 'Promoter Performance Claims', severity: client_1.Severity.HIGH },
    "i've been making": { ruleCode: 'FINTECH-003', ruleName: 'Promoter Performance Claims', severity: client_1.Severity.HIGH },
    'earning every week': { ruleCode: 'FINTECH-003', ruleName: 'Promoter Performance Claims', severity: client_1.Severity.HIGH },
    // ── FINTECH-004 — Promissory Language ─────────────────────
    "you'll make money": { ruleCode: 'FINTECH-004', ruleName: 'Promissory Language', severity: client_1.Severity.CRITICAL },
    'this works': { ruleCode: 'FINTECH-004', ruleName: 'Promissory Language', severity: client_1.Severity.CRITICAL },
    'guaranteed': { ruleCode: 'FINTECH-004', ruleName: 'Promissory Language', severity: client_1.Severity.CRITICAL },
    'never lost': { ruleCode: 'FINTECH-004', ruleName: 'Promissory Language', severity: client_1.Severity.CRITICAL },
    'always profitable': { ruleCode: 'FINTECH-004', ruleName: 'Promissory Language', severity: client_1.Severity.CRITICAL },
    'risk-free': { ruleCode: 'FINTECH-004', ruleName: 'Promissory Language', severity: client_1.Severity.CRITICAL },
    'you will profit': { ruleCode: 'FINTECH-004', ruleName: 'Promissory Language', severity: client_1.Severity.CRITICAL },
    'proven strategy': { ruleCode: 'FINTECH-004', ruleName: 'Promissory Language', severity: client_1.Severity.CRITICAL },
    // ── FINTECH-005 — Urgency / Artificial Scarcity ───────────
    'limited time': { ruleCode: 'FINTECH-005', ruleName: 'Urgency / Artificial Scarcity', severity: client_1.Severity.MEDIUM },
    'bonus expires': { ruleCode: 'FINTECH-005', ruleName: 'Urgency / Artificial Scarcity', severity: client_1.Severity.MEDIUM },
    'offer ends': { ruleCode: 'FINTECH-005', ruleName: 'Urgency / Artificial Scarcity', severity: client_1.Severity.MEDIUM },
    'only available until': { ruleCode: 'FINTECH-005', ruleName: 'Urgency / Artificial Scarcity', severity: client_1.Severity.MEDIUM },
    'act now': { ruleCode: 'FINTECH-005', ruleName: 'Urgency / Artificial Scarcity', severity: client_1.Severity.MEDIUM },
    "don't miss out": { ruleCode: 'FINTECH-005', ruleName: 'Urgency / Artificial Scarcity', severity: client_1.Severity.MEDIUM },
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
    '#paid',
    'paid partnership',
    'not financial advice',
    'this is not financial advice',
    'i was compensated',
    'affiliate',
    'referral fee',
    'compensation disclosure',
    'paid promotion',
    'i am compensated',
    'i receive compensation',
    'sponsored content',
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
    // DISC-001: no disclosure detected — fires when compensated promoter has
    // risky content OR when compensation context exists and requires disclosure
    const hasRiskyHit = hits.some(h => h.ruleCode.startsWith('RISK-') || h.ruleCode.startsWith('FINTECH-'));
    const compRequiresDisclosure = compensationCtx && (compensationCtx.isTransactionBased || compensationCtx.isSecurityLinked);
    const alreadyDisc001 = hits.some(h => h.ruleCode === 'DISC-001');
    if ((hasRiskyHit || compRequiresDisclosure) && !hasDisclosure && !alreadyDisc001) {
        hits.push({
            ruleCode: 'DISC-001',
            ruleName: 'No Paid Relationship Disclosure Detected',
            matchedPhrase: '[no disclosure detected]',
            severity: client_1.Severity.HIGH,
            detectionMethod: 'DISCLOSURE_CHECK',
        });
    }
    // DISC-002 (below-fold check): disclosure IS present but appears in the final 25% of text
    if (hasDisclosure && lower.length > 100) {
        const discIdx = DISCLOSURE_PATTERNS.reduce((earliest, p) => {
            const idx = lower.indexOf(p.toLowerCase());
            return (idx >= 0 && (earliest < 0 || idx < earliest)) ? idx : earliest;
        }, -1);
        if (discIdx >= 0 && discIdx > lower.length * 0.75) {
            hits.push({
                ruleCode: 'DISC-002',
                ruleName: 'Disclosure Below Fold',
                matchedPhrase: '[disclosure appears in final 25% of content]',
                severity: client_1.Severity.MEDIUM,
                detectionMethod: 'DISCLOSURE_CHECK',
            });
        }
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
function getRuleMetadata() {
    // Aggregate phrase counts per rule code from PHRASE_MAP
    const phraseCounts = {};
    for (const def of Object.values(PHRASE_MAP)) {
        phraseCounts[def.ruleCode] = (phraseCounts[def.ruleCode] || 0) + 1;
    }
    // Build metadata for all rule families
    const rules = [
        { code: 'RISK-001', name: 'False or Misleading Statements', description: 'Detects absolute return guarantees, insider-knowledge language, and unsubstantiable claims about investment outcomes.', severity: 'CRITICAL', category: 'Promotional Claims', active: true, patternCount: phraseCounts['RISK-001'] || 0 },
        { code: 'RISK-002', name: 'Unbalanced Risk Disclosure', description: 'Flags content that emphasizes upside or lifestyle outcomes without balanced discussion of investment risk.', severity: 'HIGH', category: 'Risk Disclosure', active: true, patternCount: phraseCounts['RISK-002'] || 0 },
        { code: 'RISK-003', name: 'Performance Claims Without Required Disclosures', description: 'Identifies specific performance expectations or relative outperformance claims lacking required disclaimers.', severity: 'MEDIUM', category: 'Performance Claims', active: true, patternCount: phraseCounts['RISK-003'] || 0 },
        { code: 'RISK-004', name: 'Forward-Looking Statement Without Disclaimer', description: 'Detects predictions about future performance without the required safe-harbour disclaimer language.', severity: 'HIGH', category: 'Forward-Looking Statements', active: true, patternCount: RISK_004_TRIGGERS.length },
        { code: 'RISK-005', name: 'Testimonial Without Required Disclosures', description: 'Flags personal endorsements or testimonials missing the required compensation, typicality, and risk disclosures.', severity: 'HIGH', category: 'Testimonials', active: true, patternCount: RISK_005_TRIGGERS.length },
        { code: 'DISC-001', name: 'Missing Required Disclosure', description: 'Fires when content references a specific investment product but contains no compensation disclosure.', severity: 'HIGH', category: 'Disclosure', active: true, patternCount: DISCLOSURE_PATTERNS.length },
        { code: 'DISC-002', name: 'Paid Promotion Without Disclosure', description: 'Detects paid-promotion context without adequate FTC/FINRA disclosure tags.', severity: 'HIGH', category: 'Disclosure', active: true, patternCount: DISCLOSURE_PATTERNS.length },
        { code: 'COMP-001', name: 'Transaction-Based Compensation Solicitation Risk', description: 'Flags content from promoters with transaction-based compensation on security-linked products who are pushing affiliate links.', severity: 'CRITICAL', category: 'Compensation Structure', active: true, patternCount: 0 },
        { code: 'COMP-002', name: 'Unregistered Solicitation Language', description: 'Detects explicit solicitation language from CRITICAL-posture promoters that may constitute unregistered broker-dealer activity.', severity: 'CRITICAL', category: 'Solicitation', active: true, patternCount: COMP_002_PHRASES.length },
        { code: 'COMP-003', name: 'Compensation Disclosure Insufficient', description: 'Fires when equity/carry/revenue-share promoters fail to include ownership-interest disclosure in their content.', severity: 'HIGH', category: 'Compensation Disclosure', active: true, patternCount: OWNERSHIP_DISCLOSURE_PATTERNS.length },
        { code: 'FINTECH-001', name: 'Fee Misrepresentation', description: 'Detects unqualified fee claims ("commission-free", "no fees") that may mislead investors about actual costs.', severity: 'MEDIUM', category: 'Fintech Claims', active: true, patternCount: phraseCounts['FINTECH-001'] || 0 },
        { code: 'FINTECH-002', name: 'Account Opening Solicitation', description: 'Flags language that actively solicits account opening or funding, especially with referral codes or incentive offers.', severity: 'HIGH', category: 'Solicitation', active: true, patternCount: phraseCounts['FINTECH-002'] || 0 },
        { code: 'FINTECH-003', name: 'Promoter Performance Claims', description: 'Detects personal performance claims from promoters ("I made", "my returns") that may constitute misleading testimonials.', severity: 'HIGH', category: 'Performance Claims', active: true, patternCount: phraseCounts['FINTECH-003'] || 0 },
        { code: 'FINTECH-004', name: 'Promissory Language', description: 'Flags promissory or guaranteed-outcome language that violates FINRA Rule 2210(d)(1) regardless of product type.', severity: 'CRITICAL', category: 'Promotional Claims', active: true, patternCount: phraseCounts['FINTECH-004'] || 0 },
        { code: 'FINTECH-005', name: 'Urgency / Artificial Scarcity', description: 'Detects urgency or scarcity tactics ("limited time", "act now") designed to pressure account opening.', severity: 'MEDIUM', category: 'Pressure Tactics', active: true, patternCount: phraseCounts['FINTECH-005'] || 0 },
    ];
    return rules;
}
//# sourceMappingURL=ruleRegistry.js.map