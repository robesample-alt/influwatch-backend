// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Compensation Classification Engine
//
// Classifies a promoter's compensation structure into
// a supervision posture and derived compliance flags.
//
// Called at CompensationStructure creation and whenever
// compensation terms change. Output is stored on the
// CompensationStructure record and stamped onto each
// ContentRecord at ingestion.
//
// Classification rules are defined by the firm's WSPs.
// DO NOT simplify or collapse the decision logic.
// ============================================================

import {
  deriveCompensationPrecision,
  normalizePrecisionOutput,
  type CompensationType,
  type CompensationBasis,
  type TransactionalityClass,
} from './compensationPrecision';

export type CompensationInput = {
  compensationForm:    string;
  compensationTrigger: string;
  productType:         string;
};

export type CompensationClassification = {
  isTransactionBased:       boolean;
  isSecurityLinked:         boolean;
  isCompensationVariable:   boolean;
  requiresDisclosure:       boolean;
  requiresPrincipalReview:  boolean;
  supervisionPosture:       'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  // Phase 1 — Compensation Precision (additive)
  compensationType:         CompensationType;
  compensationBasis:        CompensationBasis;
  transactionalityClass:    TransactionalityClass;
};

// ─────────────────────────────────────────
// VALUE SETS
// ─────────────────────────────────────────

const TRANSACTION_BASED_TRIGGERS = new Set([
  'INVESTMENT',
  'SUBSCRIPTION',
  'CAPITAL_RAISED',
  'REVENUE_GENERATED',
]);

const TRANSACTION_BASED_FORMS = new Set([
  'INVESTMENT_BASED',
  'REVENUE_SHARE',
  'EQUITY',
  'CARRY',
]);

const SECURITY_LINKED_PRODUCT_TYPES = new Set([
  'REG_A',
  'REG_CF',
  'REG_D',
  'FUND',
  'ADVISORY_SERVICE',
]);

const FIXED_FORMS = new Set([
  'FLAT_FEE',
  'PER_CONTENT',
  'RETAINER',
]);

const DEPOSIT_TRIGGERS = new Set([
  'DEPOSIT',
  'ACCOUNT_OPEN',
  'FUNDED_ACCOUNT',
]);

const HIGH_FORMS_SECURITY = new Set([
  'EQUITY',
  'CARRY',
  'REVENUE_SHARE',
]);

const LEAD_TRIGGERS = new Set([
  'LEAD',
  'QUALIFIED_LEAD',
  'SIGNUP',
]);

const ENGAGEMENT_FORMS = new Set([
  'CLICK_BASED',
  'ENGAGEMENT_BONUS',
]);

const DISCLOSURE_FORMS = new Set([
  'REVENUE_SHARE',
  'EQUITY',
  'CARRY',
]);

// ─────────────────────────────────────────
// CLASSIFIER
// ─────────────────────────────────────────

/**
 * Classify a compensation structure into supervision posture
 * and derived compliance flags.
 *
 * Rule order within supervisionPosture is strict —
 * do not reorder without WSP amendment.
 */
export function classifyCompensation(
  input: CompensationInput
): CompensationClassification {
  const { compensationForm, compensationTrigger, productType } = input;

  // ── 1. isTransactionBased ─────────────────────────────────
  const isTransactionBased =
    TRANSACTION_BASED_TRIGGERS.has(compensationTrigger) ||
    TRANSACTION_BASED_FORMS.has(compensationForm);

  // ── 2. isSecurityLinked ───────────────────────────────────
  const isSecurityLinked =
    SECURITY_LINKED_PRODUCT_TYPES.has(productType) ||
    isTransactionBased;

  // ── 3. isCompensationVariable ─────────────────────────────
  const isCompensationVariable = !FIXED_FORMS.has(compensationForm);

  // ── 4. supervisionPosture (STRICT ORDER) ──────────────────
  let supervisionPosture: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  if (isTransactionBased && isSecurityLinked) {
    supervisionPosture = 'CRITICAL';

  } else if (isSecurityLinked && DEPOSIT_TRIGGERS.has(compensationTrigger)) {
    supervisionPosture = 'HIGH';

  } else if (HIGH_FORMS_SECURITY.has(compensationForm) && isSecurityLinked) {
    supervisionPosture = 'HIGH';

  } else if (LEAD_TRIGGERS.has(compensationTrigger) && isSecurityLinked) {
    supervisionPosture = 'MEDIUM';

  } else if (ENGAGEMENT_FORMS.has(compensationForm) && isSecurityLinked) {
    supervisionPosture = 'MEDIUM';

  } else {
    supervisionPosture = 'LOW';
  }

  // ── 5. requiresPrincipalReview ────────────────────────────
  const requiresPrincipalReview =
    supervisionPosture === 'CRITICAL' || supervisionPosture === 'HIGH';

  // ── 6. requiresDisclosure ─────────────────────────────────
  const requiresDisclosure =
    isSecurityLinked ||
    isTransactionBased ||
    DISCLOSURE_FORMS.has(compensationForm);

  // ── 7. Phase 1 Compensation Precision (additive) ───────────
  // normalizePrecisionOutput validates each value against the
  // allowlist and falls back to OTHER / MANUAL_REVIEW /
  // POTENTIALLY_TRANSACTIONAL if derivation somehow produced an
  // invalid value. This is a Phase 1.1 drift guardrail — prevents
  // invalid strings from ever reaching the database.
  const precision = normalizePrecisionOutput(
    deriveCompensationPrecision(input),
  );

  return {
    isTransactionBased,
    isSecurityLinked,
    isCompensationVariable,
    requiresDisclosure,
    requiresPrincipalReview,
    supervisionPosture,
    compensationType:      precision.compensationType,
    compensationBasis:     precision.compensationBasis,
    transactionalityClass: precision.transactionalityClass,
  };
}
