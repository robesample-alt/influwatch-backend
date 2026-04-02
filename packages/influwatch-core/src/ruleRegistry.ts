// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Rule Registry — @robesample-alt/influwatch-core
//
// Single canonical source of truth for all phrase-based
// compliance rule detection.
//
// Each entry maps a phrase to the rule it implicates and the
// severity of that specific hit. Per-hit severity reflects
// the phrase's risk level — not the rule's nominal ceiling.
// A single rule (e.g. IW-BD-007) can produce hits at multiple
// severity levels depending on which phrase matched.
//
// Phase 1: PHRASE_MATCH only.
// DISCLOSURE_CHECK and PATTERN_MATCH are reserved for Phase 2.
//
// ADAPTATION NOTE: Severity is defined locally here rather than
// imported from @prisma/client so this package compiles standalone.
// ============================================================

// Local Severity enum — mirrors @prisma/client Severity exactly
export enum Severity {
  LOW      = 'LOW',
  MEDIUM   = 'MEDIUM',
  HIGH     = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface RuleHit {
  ruleCode:        string;
  ruleName:        string;
  matchedPhrase:   string;
  severity:        Severity;
  detectionMethod: 'PHRASE_MATCH' | 'DISCLOSURE_CHECK';
}

// ─────────────────────────────────────────
// Phrase entry shape: phrase → rule metadata + severity
// ─────────────────────────────────────────

interface PhraseDef {
  ruleCode: string;
  ruleName: string;
  severity: Severity;
}

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
// DISC-001  Compensated Endorsement Disclosure Absent          [Phase 2 — no phrases yet]
//           SEC Rule 206(4)-1(b)(1)
//
// DISC-002  Paid Partnership Tag Absent                        [Phase 2 — no phrases yet]
//           SEC Rule 206(4)-1(b)(1) / FTC .com Disclosures
// ─────────────────────────────────────────

const PHRASE_MAP: Record<string, PhraseDef> = {

  // ── RISK-001 — CRITICAL ───────────────────────────────────
  'guaranteed return':    { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },
  'guaranteed returns':   { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },
  'guaranteed profit':    { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },
  '100% return':          { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },
  'cannot lose':          { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },
  "can't lose":           { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },
  'will double':          { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },
  'will triple':          { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },
  'insider tip':          { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },
  'insider information':  { ruleCode: 'RISK-001', ruleName: 'False or Misleading Statements', severity: Severity.CRITICAL },

  // ── RISK-002 — CRITICAL ───────────────────────────────────
  'risk free investment':  { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.CRITICAL },
  'risk-free investment':  { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.CRITICAL },
  'no risk':               { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.CRITICAL },
  'risk free':             { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.CRITICAL },

  // ── RISK-002 — HIGH ───────────────────────────────────────
  'get rich':              { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  'financial freedom':     { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  'quit your job':         { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  'passive income':        { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  'massive gains':         { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  'huge upside':           { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  "can't miss":            { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  'once in a lifetime':    { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  'ground floor opportunity': { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  'huge opportunity':      { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },
  'unique moment':         { ruleCode: 'RISK-002', ruleName: 'Unbalanced Risk Disclosure', severity: Severity.HIGH },

  // ── RISK-003 — MEDIUM ─────────────────────────────────────
  'high yield':            { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: Severity.MEDIUM },
  'above market returns':  { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: Severity.MEDIUM },
  'outperform':            { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: Severity.MEDIUM },
  'beat the market':       { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: Severity.MEDIUM },
  'strong returns':        { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: Severity.MEDIUM },
  'projected growth':      { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: Severity.MEDIUM },
  'significant upside':    { ruleCode: 'RISK-003', ruleName: 'Performance Claims Without Required Disclosures', severity: Severity.MEDIUM },

};

// ─────────────────────────────────────────
// DISCLOSURE PATTERNS
//
// Presence of ANY of these in bodyText means the content
// contains a required disclosure. Used by DISC-001 / DISC-002.
// ─────────────────────────────────────────

const DISCLOSURE_PATTERNS: string[] = [
  '#ad',
  '#sponsored',
  '#paidpartner',
  'paid partnership',
  'not financial advice',
  'this is not financial advice',
];

// ─────────────────────────────────────────
// DETECTION FUNCTIONS
// ─────────────────────────────────────────

/**
 * Scan bodyText for all known rule-mapped phrases.
 * Returns one RuleHit per matched phrase.
 * Case-insensitive. Multiple matches from the same record are expected.
 */
export function detectRuleHits(bodyText: string): RuleHit[] {
  if (!bodyText) return [];

  const lower = bodyText.toLowerCase();
  const hits: RuleHit[] = [];

  for (const [phrase, def] of Object.entries(PHRASE_MAP)) {
    if (lower.includes(phrase)) {
      hits.push({
        ruleCode:        def.ruleCode,
        ruleName:        def.ruleName,
        matchedPhrase:   phrase,
        severity:        def.severity,
        detectionMethod: 'PHRASE_MATCH',
      });
    }
  }

  // ── DISC-001 / DISC-002 — Disclosure absence checks ──────
  const hasDisclosure = DISCLOSURE_PATTERNS.some(p => lower.includes(p.toLowerCase()));

  // DISC-001: risky promotional content with no disclosure at all
  const hasRiskyHit    = hits.some(h => h.ruleCode.startsWith('RISK-'));
  const alreadyDisc001 = hits.some(h => h.ruleCode === 'DISC-001');
  if (hasRiskyHit && !hasDisclosure && !alreadyDisc001) {
    hits.push({
      ruleCode:        'DISC-001',
      ruleName:        'Missing Required Disclosure',
      matchedPhrase:   '[no disclosure detected]',
      severity:        Severity.HIGH,
      detectionMethod: 'DISCLOSURE_CHECK',
    });
  }

  // DISC-002: compensation language with no disclosure
  const PAID_TRIGGERS = ['paid partner', 'brand partner', 'sponsored post', 'sponsored by', 'affiliate'];
  const paidTrigger    = PAID_TRIGGERS.find(t => lower.includes(t));
  const alreadyDisc002 = hits.some(h => h.ruleCode === 'DISC-002');
  if (paidTrigger && !hasDisclosure && !alreadyDisc002) {
    hits.push({
      ruleCode:        'DISC-002',
      ruleName:        'Paid Promotion Without Disclosure',
      matchedPhrase:   paidTrigger,
      severity:        Severity.HIGH,
      detectionMethod: 'DISCLOSURE_CHECK',
    });
  }

  return hits;
}

const SEVERITY_PRIORITY: Severity[] = [
  Severity.CRITICAL,
  Severity.HIGH,
  Severity.MEDIUM,
  Severity.LOW,
];

/**
 * Derive the overall severity for a record from its rule hits.
 * Returns the highest severity found, or LOW if no hits.
 */
export function computeSeverityFromHits(hits: RuleHit[]): Severity {
  for (const level of SEVERITY_PRIORITY) {
    if (hits.some(h => h.severity === level)) return level;
  }
  return Severity.LOW;
}
