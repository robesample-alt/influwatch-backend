// ============================================================
// FUNDUREX — INFLUWATCH
// Compensation Precision — Phase 1 + Phase 1.1 Cleanup
//
// Derives the canonical compensationType, compensationBasis,
// and transactionalityClass from the existing compensationForm
// + compensationTrigger + productType triplet.
//
// Pure functions, no side effects, no DB access.
// Called by the classifier at CompensationStructure creation
// and by the backfill migration for existing rows.
//
// IMPORTANT: This module is ADDITIVE. It does NOT change
// severity, posture, routing, queue selection, PDF export,
// or any existing behavior. Its output is stored on the
// CompensationStructure for future use by the exposure engine.
// ============================================================

// ── Canonical types ───────────────────────────────────────────

export type CompensationType =
  | 'UNCOMPENSATED'
  | 'FLAT_FEE_PER_POST'
  | 'FLAT_FEE_PER_CAMPAIGN'
  | 'MONTHLY_RETAINER'
  | 'CONTENT_PRODUCTION_FEE'
  | 'AFFILIATE_NON_SECURITIES'
  | 'LEAD_GEN_NON_FUNDED'
  | 'PER_ACCOUNT_OPENED'
  | 'PER_ACCOUNT_OPENED_AND_FUNDED'
  | 'PER_LEAD_CONVERTED_TO_INVESTOR'
  | 'PER_DOLLAR_INVESTED'
  | 'REVENUE_SHARE_SECURITIES'
  | 'EQUITY_OR_CARRY_NON_TRANSACTIONAL'
  | 'OTHER';

export type CompensationBasis =
  | 'NONE'
  | 'FIXED'
  | 'PER_CONTENT_UNIT'
  | 'PER_CAMPAIGN'
  | 'PER_TIME_PERIOD'
  | 'PER_LEAD'
  | 'PER_ACCOUNT'
  | 'PER_FUNDED_ACCOUNT'
  | 'PER_INVESTOR'
  | 'PERCENT_OF_RAISE'
  | 'PERCENT_OF_INVESTMENT'
  | 'OWNERSHIP_BASED'
  | 'MANUAL_REVIEW';

export type TransactionalityClass =
  | 'NON_TRANSACTIONAL'
  | 'ELEVATED_NON_TRANSACTIONAL'
  | 'POTENTIALLY_TRANSACTIONAL'
  | 'TRANSACTION_BASED';

// ── Allowlists (Phase 1.1) ───────────────────────────────────
// Drift guardrails. Every valid value is listed exactly once.
// Used by validation helpers and the safe-normalize function
// at the DB write site to prevent invalid strings from being
// stored. If a new value is added to the types above, add it
// here too — the test suite will catch the mismatch.

export const VALID_COMPENSATION_TYPES: ReadonlySet<string> = new Set<CompensationType>([
  'UNCOMPENSATED',
  'FLAT_FEE_PER_POST',
  'FLAT_FEE_PER_CAMPAIGN',
  'MONTHLY_RETAINER',
  'CONTENT_PRODUCTION_FEE',
  'AFFILIATE_NON_SECURITIES',
  'LEAD_GEN_NON_FUNDED',
  'PER_ACCOUNT_OPENED',
  'PER_ACCOUNT_OPENED_AND_FUNDED',
  'PER_LEAD_CONVERTED_TO_INVESTOR',
  'PER_DOLLAR_INVESTED',
  'REVENUE_SHARE_SECURITIES',
  'EQUITY_OR_CARRY_NON_TRANSACTIONAL',
  'OTHER',
]);

export const VALID_COMPENSATION_BASES: ReadonlySet<string> = new Set<CompensationBasis>([
  'NONE',
  'FIXED',
  'PER_CONTENT_UNIT',
  'PER_CAMPAIGN',
  'PER_TIME_PERIOD',
  'PER_LEAD',
  'PER_ACCOUNT',
  'PER_FUNDED_ACCOUNT',
  'PER_INVESTOR',
  'PERCENT_OF_RAISE',
  'PERCENT_OF_INVESTMENT',
  'OWNERSHIP_BASED',
  'MANUAL_REVIEW',
]);

export const VALID_TRANSACTIONALITY_CLASSES: ReadonlySet<string> = new Set<TransactionalityClass>([
  'NON_TRANSACTIONAL',
  'ELEVATED_NON_TRANSACTIONAL',
  'POTENTIALLY_TRANSACTIONAL',
  'TRANSACTION_BASED',
]);

// ── Validation helpers (Phase 1.1) ───────────────────────────

export function isValidCompensationType(v: string): v is CompensationType {
  return VALID_COMPENSATION_TYPES.has(v);
}

export function isValidCompensationBasis(v: string): v is CompensationBasis {
  return VALID_COMPENSATION_BASES.has(v);
}

export function isValidTransactionalityClass(v: string): v is TransactionalityClass {
  return VALID_TRANSACTIONALITY_CLASSES.has(v);
}

// ── Safe normalization (Phase 1.1) ───────────────────────────
// Called at the DB write site. If derivation somehow produced
// an invalid value (code bug, new form value not yet mapped),
// fall back to the most conservative classification rather
// than storing garbage.

const SAFE_DEFAULTS: CompensationPrecisionOutput = {
  compensationType:      'OTHER',
  compensationBasis:     'MANUAL_REVIEW',
  transactionalityClass: 'POTENTIALLY_TRANSACTIONAL',
};

export function normalizePrecisionOutput(
  raw: CompensationPrecisionOutput,
): CompensationPrecisionOutput {
  return {
    compensationType:      isValidCompensationType(raw.compensationType)           ? raw.compensationType      : SAFE_DEFAULTS.compensationType,
    compensationBasis:     isValidCompensationBasis(raw.compensationBasis)         ? raw.compensationBasis     : SAFE_DEFAULTS.compensationBasis,
    transactionalityClass: isValidTransactionalityClass(raw.transactionalityClass) ? raw.transactionalityClass : SAFE_DEFAULTS.transactionalityClass,
  };
}

// ── Derivation input ──────────────────────────────────────────

export interface CompensationPrecisionInput {
  compensationForm:    string;
  compensationTrigger: string;
  productType:         string;
}

export interface CompensationPrecisionOutput {
  compensationType:      CompensationType;
  compensationBasis:     CompensationBasis;
  transactionalityClass: TransactionalityClass;
}

// ── Transactionality map ──────────────────────────────────────

const TRANSACTIONALITY_MAP: Record<CompensationType, TransactionalityClass> = {
  UNCOMPENSATED:                       'NON_TRANSACTIONAL',
  FLAT_FEE_PER_POST:                   'NON_TRANSACTIONAL',
  FLAT_FEE_PER_CAMPAIGN:               'NON_TRANSACTIONAL',
  MONTHLY_RETAINER:                    'NON_TRANSACTIONAL',
  CONTENT_PRODUCTION_FEE:              'NON_TRANSACTIONAL',

  EQUITY_OR_CARRY_NON_TRANSACTIONAL:   'ELEVATED_NON_TRANSACTIONAL',
  AFFILIATE_NON_SECURITIES:            'ELEVATED_NON_TRANSACTIONAL',

  LEAD_GEN_NON_FUNDED:                 'POTENTIALLY_TRANSACTIONAL',
  PER_ACCOUNT_OPENED:                  'POTENTIALLY_TRANSACTIONAL',

  PER_ACCOUNT_OPENED_AND_FUNDED:       'TRANSACTION_BASED',
  PER_LEAD_CONVERTED_TO_INVESTOR:      'TRANSACTION_BASED',
  PER_DOLLAR_INVESTED:                 'TRANSACTION_BASED',
  REVENUE_SHARE_SECURITIES:            'TRANSACTION_BASED',

  OTHER:                               'POTENTIALLY_TRANSACTIONAL',
};

/**
 * Derive transactionalityClass from a compensationType.
 * Exported standalone so callers can use it without the
 * full derivation pipeline.
 */
export function deriveTransactionalityClass(
  compensationType: CompensationType,
): TransactionalityClass {
  return TRANSACTIONALITY_MAP[compensationType] ?? 'POTENTIALLY_TRANSACTIONAL';
}

// ── Legacy mapping ────────────────────────────────────────────

/**
 * Maps existing {compensationForm, compensationTrigger, productType}
 * values to the new canonical compensationType + compensationBasis.
 *
 * This is a best-effort mapping from the Phase 1 value space.
 * Ambiguous combinations map to OTHER / MANUAL_REVIEW so a human
 * can reclassify later.
 *
 * The mapping logic is intentionally explicit — a lookup table
 * with fallback chains, not a clever algorithm. Correctness is
 * more important than elegance here.
 *
 * Phase 1.1 AMBIGUITY AUDIT — branches marked [AMBIGUOUS] are
 * combinations where the legacy value space doesn't carry enough
 * information to determine the canonical type with certainty.
 * Current resolution is documented inline. Future exposure-engine
 * work may need to resolve these via a manual classification UI
 * or additional fields on CompensationStructure.
 */
export function deriveCompensationPrecision(
  input: CompensationPrecisionInput,
): CompensationPrecisionOutput {
  const form    = (input.compensationForm    || '').toUpperCase();
  const trigger = (input.compensationTrigger || '').toUpperCase();
  const product = (input.productType         || '').toUpperCase();

  const isSecurityProduct = ['REG_A', 'REG_CF', 'REG_D', 'FUND', 'ADVISORY_SERVICE'].includes(product);

  let compensationType: CompensationType;
  let compensationBasis: CompensationBasis;

  // ── NONE / empty — uncompensated ────────────────────────────
  if (form === 'NONE' || form === '' || form === 'UNCOMPENSATED') {
    compensationType = 'UNCOMPENSATED';
    compensationBasis = 'NONE';

  // ── FLAT_FEE (existing value) ──────────────────────────────
  } else if (form === 'FLAT_FEE') {
    if (['LEAD', 'QUALIFIED_LEAD', 'SIGNUP'].includes(trigger)) {
      // [AMBIGUOUS] FLAT_FEE + LEAD: the promoter is paid a flat fee,
      // but the payment is triggered by lead generation. This is
      // structurally flat-fee (fixed amount) but behaviorally
      // lead-gen (incentive to generate volume). We classify as
      // LEAD_GEN_NON_FUNDED because the lead trigger creates a
      // conversion incentive even though the dollar amount is fixed.
      // Impact: POTENTIALLY_TRANSACTIONAL — may need manual review
      // if the firm considers flat-fee leads truly non-transactional.
      compensationType = 'LEAD_GEN_NON_FUNDED';
      compensationBasis = 'PER_LEAD';
    } else {
      compensationType = 'FLAT_FEE_PER_POST';
      compensationBasis = 'FIXED';
    }

  // ── PER_CONTENT (existing value) ───────────────────────────
  } else if (form === 'PER_CONTENT') {
    if (['FUNDED_ACCOUNT', 'DEPOSIT', 'ACCOUNT_OPEN'].includes(trigger)) {
      // [AMBIGUOUS] PER_CONTENT + FUNDED_ACCOUNT: the form says
      // "paid per content piece" but the trigger says "only when
      // the content leads to a funded account." This is a hybrid:
      // the payment unit is content but the gate is transactional.
      // We classify as PER_ACCOUNT_OPENED because the funding gate
      // creates a transactional incentive even though the payment
      // is nominally per-content. The exposure engine should treat
      // this as higher risk than a pure per-content arrangement.
      // Prod row: CS-DEMO-02 (Jordan Blake, FINTECH).
      compensationType = 'PER_ACCOUNT_OPENED';
      compensationBasis = 'PER_ACCOUNT';
    } else if (['SIGNUP'].includes(trigger)) {
      // PER_CONTENT + SIGNUP: paid per content, triggered by
      // signups. The signup gate is non-funded, so this is closer
      // to flat-fee-per-post than to per-account-opened.
      // Prod row: CS-DEMO-07 (Leah Foster, REG_D).
      compensationType = 'FLAT_FEE_PER_POST';
      compensationBasis = 'PER_CONTENT_UNIT';
    } else {
      compensationType = 'FLAT_FEE_PER_POST';
      compensationBasis = 'PER_CONTENT_UNIT';
    }

  // ── PER_CONVERSION (existing value) ────────────────────────
  } else if (form === 'PER_CONVERSION') {
    if (['FUNDED_ACCOUNT', 'DEPOSIT'].includes(trigger)) {
      compensationType = 'PER_ACCOUNT_OPENED_AND_FUNDED';
      compensationBasis = 'PER_FUNDED_ACCOUNT';
    } else if (['INVESTMENT', 'CAPITAL_RAISED'].includes(trigger)) {
      compensationType = 'PER_DOLLAR_INVESTED';
      compensationBasis = 'PERCENT_OF_INVESTMENT';
    } else if (['CONVERSION', 'SIGNUP'].includes(trigger)) {
      // [AMBIGUOUS] PER_CONVERSION + CONVERSION/SIGNUP: "conversion"
      // is a generic trigger that could mean account open, funded
      // account, or something else. The productType is the tiebreaker:
      //   - Security product (REG_D, FUND, etc.) → conservative:
      //     assume funded-account level → TRANSACTION_BASED
      //   - Non-security (FINTECH, OTHER) → assume account-open
      //     level → POTENTIALLY_TRANSACTIONAL
      // Prod rows affected:
      //   CS-DEMO-01 (Marcus Venn, PER_CONVERSION + SIGNUP + REG_D)
      //     → PER_ACCOUNT_OPENED_AND_FUNDED / TRANSACTION_BASED
      //   CS-MOOMOO-TEST (PER_CONVERSION + CONVERSION + FINTECH)
      //     → PER_ACCOUNT_OPENED / POTENTIALLY_TRANSACTIONAL
      if (isSecurityProduct) {
        compensationType = 'PER_ACCOUNT_OPENED_AND_FUNDED';
        compensationBasis = 'PER_FUNDED_ACCOUNT';
      } else {
        compensationType = 'PER_ACCOUNT_OPENED';
        compensationBasis = 'PER_ACCOUNT';
      }
    } else {
      compensationType = 'PER_ACCOUNT_OPENED';
      compensationBasis = 'PER_ACCOUNT';
    }

  // ── REVENUE_SHARE (existing value) ─────────────────────────
  } else if (form === 'REVENUE_SHARE') {
    if (isSecurityProduct) {
      // [CLEAR] Revenue share on a security = TRANSACTION_BASED.
      // Prod row: CS-DEMO-05 (Priya Sharma, FUND).
      compensationType = 'REVENUE_SHARE_SECURITIES';
      compensationBasis = 'PERCENT_OF_RAISE';
    } else {
      // [AMBIGUOUS] REVENUE_SHARE + non-security (e.g. FINTECH):
      // Revenue share on a non-security product is elevated but
      // not transaction-based under current FINRA guidance because
      // the underlying product is not a security. Classified as
      // AFFILIATE_NON_SECURITIES / ELEVATED_NON_TRANSACTIONAL.
      // If the product is later reclassified as a security, this
      // row should be re-derived.
      compensationType = 'AFFILIATE_NON_SECURITIES';
      compensationBasis = 'PERCENT_OF_RAISE';
    }

  // ── RETAINER (existing schema comment, not in prod yet) ────
  } else if (form === 'RETAINER') {
    compensationType = 'MONTHLY_RETAINER';
    compensationBasis = 'PER_TIME_PERIOD';

  // ── EQUITY / CARRY (existing schema comment) ───────────────
  } else if (form === 'EQUITY' || form === 'CARRY') {
    compensationType = 'EQUITY_OR_CARRY_NON_TRANSACTIONAL';
    compensationBasis = 'OWNERSHIP_BASED';

  // ── INVESTMENT_BASED (existing schema comment) ─────────────
  } else if (form === 'INVESTMENT_BASED') {
    compensationType = 'PER_DOLLAR_INVESTED';
    compensationBasis = 'PERCENT_OF_INVESTMENT';

  // ── CLICK_BASED / ENGAGEMENT_BONUS (existing schema) ───────
  } else if (form === 'CLICK_BASED' || form === 'ENGAGEMENT_BONUS') {
    compensationType = 'AFFILIATE_NON_SECURITIES';
    compensationBasis = 'PER_LEAD';

  // ── Fallback ───────────────────────────────────────────────
  } else {
    compensationType = 'OTHER';
    compensationBasis = 'MANUAL_REVIEW';
  }

  const transactionalityClass = deriveTransactionalityClass(compensationType);

  return { compensationType, compensationBasis, transactionalityClass };
}
