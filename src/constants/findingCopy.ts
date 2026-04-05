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
export type FindingCategory =
  | 'SOLICITATION'
  | 'DISCLOSURE'
  | 'PERFORMANCE_CLAIM'
  | 'UNBALANCED_RISK'
  | 'FORWARD_LOOKING'
  | 'TESTIMONIAL'
  | 'COMPENSATION_STRUCTURE'
  | 'COMPENSATION_DISCLOSURE'
  | 'URGENCY_PRESSURE'
  | 'UNKNOWN';

/**
 * Fallback shown for any rule code not in the map. Never leaks
 * the raw code to users — generic "review required" label.
 */
export const UNKNOWN_FINDING: FindingCopy = {
  title:       'Compliance Review Required',
  description: 'This content was flagged by an automated review rule and requires supervisor assessment.',
  category:    'UNKNOWN',
};

/**
 * Rule code → plain-English finding copy.
 *
 * Note: multiple internal rule codes intentionally collapse to
 * the same public category. That collapse is a feature, not a
 * bug — it obscures method from screenshots and reinforces
 * that the category is a regulatory concept.
 */
export const FINDING_COPY: Readonly<Record<string, FindingCopy>> = {
  // ── RISK family — promotional claim violations ──
  'RISK-001': {
    title:       'Unverifiable Performance Claim',
    description: 'Content contains absolute return promises, guarantees, or insider-knowledge language that cannot be substantiated under securities advertising rules.',
    category:    'PERFORMANCE_CLAIM',
  },
  'RISK-002': {
    title:       'Unbalanced Risk Portrayal',
    description: 'Content emphasizes upside or lifestyle outcomes without balanced discussion of investment risk, which is required for compensated content referencing securities.',
    category:    'UNBALANCED_RISK',
  },
  'RISK-003': {
    title:       'Unverifiable Performance Claim',
    description: 'Content references specific performance expectations or relative outperformance without the disclosures required when past or projected returns are discussed.',
    category:    'PERFORMANCE_CLAIM',
  },
  'RISK-004': {
    title:       'Forward-Looking Statement Without Disclaimer',
    description: 'Content contains predictions about future fund or company performance without the disclaimer language required for forward-looking statements.',
    category:    'FORWARD_LOOKING',
  },
  'RISK-005': {
    title:       'Testimonial Without Required Disclosures',
    description: 'Content includes a personal endorsement or testimonial without the compensation, typicality, and risk disclosures required when testimonials are used in investment promotion.',
    category:    'TESTIMONIAL',
  },

  // ── DISC family — disclosure violations ──
  'DISC-001': {
    title:       'Disclosure Issue',
    description: 'No compensation disclosure detected in content that references a specific investment product. Compensated promoters must identify themselves as compensated.',
    category:    'DISCLOSURE',
  },
  'DISC-002': {
    title:       'Disclosure Issue',
    description: 'Paid-promotion context detected but the required compensation disclosure appears absent or inadequate under FTC and FINRA guidance.',
    category:    'DISCLOSURE',
  },

  // ── COMP family — compensation-structure risk ──
  'COMP-001': {
    title:       'Transaction-Based Compensation Risk',
    description: 'Promoter receives transaction-based compensation on a security-linked product, which creates elevated supervisory obligations regardless of content.',
    category:    'COMPENSATION_STRUCTURE',
  },
  'COMP-002': {
    title:       'Solicitation Concern',
    description: 'Content directs the audience toward an investment transaction. For a transaction-compensated promoter of a security, this may constitute unregistered broker-dealer activity.',
    category:    'SOLICITATION',
  },
  'COMP-003': {
    title:       'Compensation Disclosure Insufficient',
    description: 'Revenue-share or equity-linked compensation arrangement detected without the ownership-interest disclosure that compensation structure requires.',
    category:    'COMPENSATION_DISCLOSURE',
  },

  // ── LLM family — semantic findings ──
  'LLM-001': {
    title:       'Solicitation Concern',
    description: 'Content actively directs the audience toward a specific investment transaction. Compensated promoters of securities generally cannot solicit transactions without broker-dealer registration.',
    category:    'SOLICITATION',
  },
  'LLM-002': {
    title:       'Disclosure Issue',
    description: 'The required compensation disclosure appears missing or inadequate given the apparent promotional context of the content.',
    category:    'DISCLOSURE',
  },
  'LLM-003': {
    title:       'Unverifiable Performance Claim',
    description: 'Content contains performance claims, guarantees, or return expectations that would require substantiation and disclosures absent from this content.',
    category:    'PERFORMANCE_CLAIM',
  },
  'LLM-004': {
    title:       'Urgency Pressure Tactic',
    description: 'Content uses scarcity, time pressure, or fear-of-missing-out language to induce immediate investor action — a pattern identified as a high-risk marketing tactic.',
    category:    'URGENCY_PRESSURE',
  },
  'LLM-005': {
    title:       'Unbalanced Risk Portrayal',
    description: 'Content presents returns or outcomes without corresponding risk disclosure in a manner that may mislead a reasonable investor about the nature of the investment.',
    category:    'UNBALANCED_RISK',
  },
};

/**
 * Return the plain-English copy for a rule code, falling back
 * to the generic "Compliance Review Required" label so nothing
 * ever leaks a raw code.
 */
export function getFindingCopy(ruleCode: string | null | undefined): FindingCopy {
  if (!ruleCode) return UNKNOWN_FINDING;
  return FINDING_COPY[ruleCode] || UNKNOWN_FINDING;
}

// ── Detection-record grouping ─────────────────────────────────

export interface DetectionLike {
  ruleCode:       string | null | undefined;
  severity?:      string | null;
  matchedPhrase?: string | null;
}

export interface GroupedFinding {
  category:       FindingCategory;
  title:          string;
  description:    string;
  severity:       string;
  flaggedLanguage: string[];
}

const SEVERITY_RANK: Record<string, number> = {
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
export function groupDetections(detections: DetectionLike[]): GroupedFinding[] {
  const byCategory = new Map<FindingCategory, GroupedFinding>();

  for (const d of detections) {
    const copy = getFindingCopy(d.ruleCode);
    const sev  = (d.severity || 'LOW').toUpperCase();
    const lang = (d.matchedPhrase || '').trim();

    let entry = byCategory.get(copy.category);
    if (!entry) {
      entry = {
        category:        copy.category,
        title:           copy.title,
        description:     copy.description,
        severity:        sev,
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
  return Array.from(byCategory.values()).sort(
    (a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0),
  );
}
