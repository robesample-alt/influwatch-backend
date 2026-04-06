// ============================================================
// FUNDUREX — INFLUWATCH
// Compensation Precision — Phase 1
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

  // ── FLAT_FEE (existing value) ──────────────────────────────
  if (form === 'FLAT_FEE') {
    if (['LEAD', 'QUALIFIED_LEAD', 'SIGNUP'].includes(trigger)) {
      // Flat fee but triggered by lead generation
      compensationType = 'LEAD_GEN_NON_FUNDED';
      compensationBasis = 'PER_LEAD';
    } else {
      // Pure flat fee — per post or per campaign depends on trigger
      compensationType = 'FLAT_FEE_PER_POST';
      compensationBasis = 'FIXED';
    }

  // ── PER_CONTENT (existing value) ───────────────────────────
  } else if (form === 'PER_CONTENT') {
    if (['FUNDED_ACCOUNT', 'DEPOSIT', 'ACCOUNT_OPEN'].includes(trigger)) {
      // Per-content but triggered by account funding — potentially transactional
      compensationType = 'PER_ACCOUNT_OPENED';
      compensationBasis = 'PER_ACCOUNT';
    } else if (['SIGNUP'].includes(trigger)) {
      // Per-content triggered by signups
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
      // Ambiguous: "conversion" could be account open or funded account
      // Conservative: treat as funded account if security-linked
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
      compensationType = 'REVENUE_SHARE_SECURITIES';
      compensationBasis = 'PERCENT_OF_RAISE';
    } else {
      // Revenue share on non-securities — elevated but not transaction-based
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
