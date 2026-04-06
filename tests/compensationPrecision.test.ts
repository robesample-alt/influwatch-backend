// ============================================================
// FUNDUREX — INFLUWATCH
// Tests — Compensation Precision (Phase 1)
//
// Pure-function tests. No database required.
//
// A. deriveCompensationPrecision — mapping from legacy triplet
// B. deriveTransactionalityClass — standalone derivation
// C. Legacy value mapping — all existing prod combinations
// ============================================================

import {
  deriveCompensationPrecision,
  deriveTransactionalityClass,
  type CompensationType,
} from '../src/lib/compensationPrecision';

// ─────────────────────────────────────────
// A. deriveCompensationPrecision — key mappings
// ─────────────────────────────────────────

describe('deriveCompensationPrecision', () => {
  it('maps FLAT_FEE + LEAD to LEAD_GEN_NON_FUNDED', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'FLAT_FEE', compensationTrigger: 'LEAD', productType: 'REG_D' });
    expect(r.compensationType).toBe('LEAD_GEN_NON_FUNDED');
    expect(r.compensationBasis).toBe('PER_LEAD');
    expect(r.transactionalityClass).toBe('POTENTIALLY_TRANSACTIONAL');
  });

  it('maps FLAT_FEE + non-lead trigger to FLAT_FEE_PER_POST', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'FLAT_FEE', compensationTrigger: 'REVENUE_GENERATED', productType: 'FINTECH' });
    expect(r.compensationType).toBe('FLAT_FEE_PER_POST');
    expect(r.compensationBasis).toBe('FIXED');
    expect(r.transactionalityClass).toBe('NON_TRANSACTIONAL');
  });

  it('maps PER_CONTENT + FUNDED_ACCOUNT to PER_ACCOUNT_OPENED', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'PER_CONTENT', compensationTrigger: 'FUNDED_ACCOUNT', productType: 'FINTECH' });
    expect(r.compensationType).toBe('PER_ACCOUNT_OPENED');
    expect(r.compensationBasis).toBe('PER_ACCOUNT');
    expect(r.transactionalityClass).toBe('POTENTIALLY_TRANSACTIONAL');
  });

  it('maps PER_CONTENT + SIGNUP to FLAT_FEE_PER_POST', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'PER_CONTENT', compensationTrigger: 'SIGNUP', productType: 'REG_D' });
    expect(r.compensationType).toBe('FLAT_FEE_PER_POST');
    expect(r.compensationBasis).toBe('PER_CONTENT_UNIT');
    expect(r.transactionalityClass).toBe('NON_TRANSACTIONAL');
  });

  it('maps PER_CONVERSION + CONVERSION + security product to PER_ACCOUNT_OPENED_AND_FUNDED', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'PER_CONVERSION', compensationTrigger: 'CONVERSION', productType: 'REG_D' });
    expect(r.compensationType).toBe('PER_ACCOUNT_OPENED_AND_FUNDED');
    expect(r.compensationBasis).toBe('PER_FUNDED_ACCOUNT');
    expect(r.transactionalityClass).toBe('TRANSACTION_BASED');
  });

  it('maps PER_CONVERSION + CONVERSION + non-security to PER_ACCOUNT_OPENED', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'PER_CONVERSION', compensationTrigger: 'CONVERSION', productType: 'FINTECH' });
    expect(r.compensationType).toBe('PER_ACCOUNT_OPENED');
    expect(r.compensationBasis).toBe('PER_ACCOUNT');
    expect(r.transactionalityClass).toBe('POTENTIALLY_TRANSACTIONAL');
  });

  it('maps PER_CONVERSION + FUNDED_ACCOUNT to PER_ACCOUNT_OPENED_AND_FUNDED', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'PER_CONVERSION', compensationTrigger: 'FUNDED_ACCOUNT', productType: 'FUND' });
    expect(r.compensationType).toBe('PER_ACCOUNT_OPENED_AND_FUNDED');
    expect(r.compensationBasis).toBe('PER_FUNDED_ACCOUNT');
    expect(r.transactionalityClass).toBe('TRANSACTION_BASED');
  });

  it('maps PER_CONVERSION + INVESTMENT to PER_DOLLAR_INVESTED', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'PER_CONVERSION', compensationTrigger: 'INVESTMENT', productType: 'REG_D' });
    expect(r.compensationType).toBe('PER_DOLLAR_INVESTED');
    expect(r.compensationBasis).toBe('PERCENT_OF_INVESTMENT');
    expect(r.transactionalityClass).toBe('TRANSACTION_BASED');
  });

  it('maps REVENUE_SHARE + security product to REVENUE_SHARE_SECURITIES', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'REVENUE_SHARE', compensationTrigger: 'CAPITAL_RAISED', productType: 'FUND' });
    expect(r.compensationType).toBe('REVENUE_SHARE_SECURITIES');
    expect(r.compensationBasis).toBe('PERCENT_OF_RAISE');
    expect(r.transactionalityClass).toBe('TRANSACTION_BASED');
  });

  it('maps REVENUE_SHARE + non-security to AFFILIATE_NON_SECURITIES', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'REVENUE_SHARE', compensationTrigger: 'CAPITAL_RAISED', productType: 'FINTECH' });
    expect(r.compensationType).toBe('AFFILIATE_NON_SECURITIES');
    expect(r.compensationBasis).toBe('PERCENT_OF_RAISE');
    expect(r.transactionalityClass).toBe('ELEVATED_NON_TRANSACTIONAL');
  });

  it('maps RETAINER to MONTHLY_RETAINER', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'RETAINER', compensationTrigger: 'LEAD', productType: 'OTHER' });
    expect(r.compensationType).toBe('MONTHLY_RETAINER');
    expect(r.compensationBasis).toBe('PER_TIME_PERIOD');
    expect(r.transactionalityClass).toBe('NON_TRANSACTIONAL');
  });

  it('maps EQUITY to EQUITY_OR_CARRY_NON_TRANSACTIONAL', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'EQUITY', compensationTrigger: 'INVESTMENT', productType: 'FUND' });
    expect(r.compensationType).toBe('EQUITY_OR_CARRY_NON_TRANSACTIONAL');
    expect(r.compensationBasis).toBe('OWNERSHIP_BASED');
    expect(r.transactionalityClass).toBe('ELEVATED_NON_TRANSACTIONAL');
  });

  it('maps CARRY to EQUITY_OR_CARRY_NON_TRANSACTIONAL', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'CARRY', compensationTrigger: 'REVENUE_GENERATED', productType: 'FUND' });
    expect(r.compensationType).toBe('EQUITY_OR_CARRY_NON_TRANSACTIONAL');
    expect(r.transactionalityClass).toBe('ELEVATED_NON_TRANSACTIONAL');
  });

  it('maps CLICK_BASED to AFFILIATE_NON_SECURITIES', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'CLICK_BASED', compensationTrigger: 'LEAD', productType: 'OTHER' });
    expect(r.compensationType).toBe('AFFILIATE_NON_SECURITIES');
    expect(r.transactionalityClass).toBe('ELEVATED_NON_TRANSACTIONAL');
  });

  it('maps unknown form to OTHER / MANUAL_REVIEW', () => {
    const r = deriveCompensationPrecision({ compensationForm: 'SOMETHING_NEW', compensationTrigger: 'CUSTOM', productType: 'OTHER' });
    expect(r.compensationType).toBe('OTHER');
    expect(r.compensationBasis).toBe('MANUAL_REVIEW');
    expect(r.transactionalityClass).toBe('POTENTIALLY_TRANSACTIONAL');
  });

  it('handles empty strings without throwing', () => {
    const r = deriveCompensationPrecision({ compensationForm: '', compensationTrigger: '', productType: '' });
    expect(r.compensationType).toBe('OTHER');
    expect(r.compensationBasis).toBe('MANUAL_REVIEW');
  });
});

// ─────────────────────────────────────────
// B. deriveTransactionalityClass — standalone
// ─────────────────────────────────────────

describe('deriveTransactionalityClass', () => {
  const cases: [CompensationType, string][] = [
    ['UNCOMPENSATED',                   'NON_TRANSACTIONAL'],
    ['FLAT_FEE_PER_POST',              'NON_TRANSACTIONAL'],
    ['FLAT_FEE_PER_CAMPAIGN',          'NON_TRANSACTIONAL'],
    ['MONTHLY_RETAINER',               'NON_TRANSACTIONAL'],
    ['CONTENT_PRODUCTION_FEE',         'NON_TRANSACTIONAL'],
    ['EQUITY_OR_CARRY_NON_TRANSACTIONAL', 'ELEVATED_NON_TRANSACTIONAL'],
    ['AFFILIATE_NON_SECURITIES',        'ELEVATED_NON_TRANSACTIONAL'],
    ['LEAD_GEN_NON_FUNDED',            'POTENTIALLY_TRANSACTIONAL'],
    ['PER_ACCOUNT_OPENED',             'POTENTIALLY_TRANSACTIONAL'],
    ['PER_ACCOUNT_OPENED_AND_FUNDED',  'TRANSACTION_BASED'],
    ['PER_LEAD_CONVERTED_TO_INVESTOR', 'TRANSACTION_BASED'],
    ['PER_DOLLAR_INVESTED',            'TRANSACTION_BASED'],
    ['REVENUE_SHARE_SECURITIES',       'TRANSACTION_BASED'],
    ['OTHER',                          'POTENTIALLY_TRANSACTIONAL'],
  ];

  test.each(cases)('%s → %s', (type, expected) => {
    expect(deriveTransactionalityClass(type)).toBe(expected);
  });
});

// ─────────────────────────────────────────
// C. Legacy value mapping — exact prod rows
// ─────────────────────────────────────────

describe('Legacy prod row mapping', () => {
  const prodRows = [
    { form: 'PER_CONVERSION',  trigger: 'SIGNUP',         product: 'REG_D',   expectedType: 'PER_ACCOUNT_OPENED_AND_FUNDED', expectedClass: 'TRANSACTION_BASED' },
    { form: 'PER_CONTENT',     trigger: 'FUNDED_ACCOUNT', product: 'FINTECH', expectedType: 'PER_ACCOUNT_OPENED',            expectedClass: 'POTENTIALLY_TRANSACTIONAL' },
    { form: 'FLAT_FEE',        trigger: 'LEAD',           product: 'REG_D',   expectedType: 'LEAD_GEN_NON_FUNDED',           expectedClass: 'POTENTIALLY_TRANSACTIONAL' },
    { form: 'REVENUE_SHARE',   trigger: 'CAPITAL_RAISED', product: 'FUND',    expectedType: 'REVENUE_SHARE_SECURITIES',      expectedClass: 'TRANSACTION_BASED' },
    { form: 'FLAT_FEE',        trigger: 'LEAD',           product: 'OTHER',   expectedType: 'LEAD_GEN_NON_FUNDED',           expectedClass: 'POTENTIALLY_TRANSACTIONAL' },
    { form: 'PER_CONTENT',     trigger: 'SIGNUP',         product: 'REG_D',   expectedType: 'FLAT_FEE_PER_POST',             expectedClass: 'NON_TRANSACTIONAL' },
    { form: 'PER_CONVERSION',  trigger: 'CONVERSION',     product: 'FINTECH', expectedType: 'PER_ACCOUNT_OPENED',            expectedClass: 'POTENTIALLY_TRANSACTIONAL' },
  ];

  test.each(prodRows)('$form + $trigger + $product → $expectedType / $expectedClass', (row) => {
    const r = deriveCompensationPrecision({
      compensationForm: row.form, compensationTrigger: row.trigger, productType: row.product,
    });
    expect(r.compensationType).toBe(row.expectedType);
    expect(r.transactionalityClass).toBe(row.expectedClass);
  });
});
