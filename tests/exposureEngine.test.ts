// ============================================================
// FUNDUREX — INFLUWATCH
// Tests — Exposure Engine (Phase 2)
//
// Pure-function tests. No database required.
//
// A. PRINCIPAL_REQUIRED mappings
// B. PRINCIPAL_EXCEPTION mappings
// C. REVIEWER_PLUS_SUPERVISOR / REVIEWER / NONE
// D. Reason code accumulation
// E. Safe fallback when signals are absent
// F. Boost logic (guarantee, disclosure)
// ============================================================

import { computeExposure, type ExposureInput } from '../src/lib/exposureEngine';

function input(overrides: Partial<ExposureInput> = {}): ExposureInput {
  return {
    compensationType:      null,
    transactionalityClass: null,
    isTransactionBased:    false,
    isSecurityLinked:      false,
    severity:              'LOW',
    hitRuleCodes:          [],
    ...overrides,
  };
}

// ─────────────────────────────────────────
// A. PRINCIPAL_REQUIRED
// ─────────────────────────────────────────

describe('PRINCIPAL_REQUIRED', () => {
  it('PER_DOLLAR_INVESTED → PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(input({ compensationType: 'PER_DOLLAR_INVESTED', transactionalityClass: 'TRANSACTION_BASED', isTransactionBased: true }));
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
    expect(r.requiresPrincipalReview).toBe(true);
    expect(r.exposureReasonCodes).toContain('EXP-003_PER_DOLLAR_INVESTED');
    expect(r.exposureReasonCodes).toContain('EXP-001_TRANSACTION_BASED_COMP');
  });

  it('REVENUE_SHARE_SECURITIES → PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(input({ compensationType: 'REVENUE_SHARE_SECURITIES', transactionalityClass: 'TRANSACTION_BASED', isTransactionBased: true }));
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
    expect(r.requiresPrincipalReview).toBe(true);
    expect(r.exposureReasonCodes).toContain('EXP-004_REVENUE_SHARE_SECURITIES');
  });

  it('PER_ACCOUNT_OPENED_AND_FUNDED → PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(input({ compensationType: 'PER_ACCOUNT_OPENED_AND_FUNDED', transactionalityClass: 'TRANSACTION_BASED', isTransactionBased: true }));
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
    expect(r.requiresPrincipalReview).toBe(true);
    expect(r.exposureReasonCodes).toContain('EXP-002_FUNDED_ACCOUNT_TRIGGER');
  });

  it('PER_LEAD_CONVERTED_TO_INVESTOR → PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(input({ compensationType: 'PER_LEAD_CONVERTED_TO_INVESTOR', transactionalityClass: 'TRANSACTION_BASED', isTransactionBased: true }));
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
    expect(r.requiresPrincipalReview).toBe(true);
  });

  it('TRANSACTION_BASED + solicitation signal → PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(input({
      compensationType: 'PER_ACCOUNT_OPENED',
      transactionalityClass: 'TRANSACTION_BASED',
      isTransactionBased: true,
      hitRuleCodes: ['LLM-001'], // solicitation
    }));
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
  });

  it('TRANSACTION_BASED + guarantee signal → PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(input({
      compensationType: 'PER_ACCOUNT_OPENED',
      transactionalityClass: 'TRANSACTION_BASED',
      isTransactionBased: true,
      hitRuleCodes: ['RISK-001'], // guarantee
    }));
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
    expect(r.exposureReasonCodes).toContain('EXP-009_GUARANTEE_OR_FRAUD_SIGNAL');
  });
});

// ─────────────────────────────────────────
// B. PRINCIPAL_EXCEPTION
// ─────────────────────────────────────────

describe('PRINCIPAL_EXCEPTION', () => {
  it('TRANSACTION_BASED without solicitation/guarantee → PRINCIPAL_EXCEPTION (NOT mandatory principal)', () => {
    const r = computeExposure(input({
      compensationType: 'PER_ACCOUNT_OPENED',
      transactionalityClass: 'TRANSACTION_BASED',
      isTransactionBased: true,
      severity: 'LOW',
      hitRuleCodes: [],
    }));
    expect(r.exposureLevel).toBe('PRINCIPAL_EXCEPTION');
    // Phase 3: PRINCIPAL_EXCEPTION does NOT set requiresPrincipalReview
    expect(r.requiresPrincipalReview).toBe(false);
  });

  it('POTENTIALLY_TRANSACTIONAL + HIGH severity → PRINCIPAL_EXCEPTION (NOT mandatory principal)', () => {
    const r = computeExposure(input({
      compensationType: 'LEAD_GEN_NON_FUNDED',
      transactionalityClass: 'POTENTIALLY_TRANSACTIONAL',
      severity: 'HIGH',
    }));
    expect(r.exposureLevel).toBe('PRINCIPAL_EXCEPTION');
    // Phase 3: PRINCIPAL_EXCEPTION does NOT route as mandatory principal
    expect(r.requiresPrincipalReview).toBe(false);
  });

  it('POTENTIALLY_TRANSACTIONAL + CRITICAL severity → PRINCIPAL_EXCEPTION (NOT mandatory principal)', () => {
    const r = computeExposure(input({
      compensationType: 'PER_ACCOUNT_OPENED',
      transactionalityClass: 'POTENTIALLY_TRANSACTIONAL',
      severity: 'CRITICAL',
    }));
    expect(r.exposureLevel).toBe('PRINCIPAL_EXCEPTION');
    expect(r.requiresPrincipalReview).toBe(false);
  });
});

// ─────────────────────────────────────────
// C. REVIEWER_PLUS_SUPERVISOR / REVIEWER / NONE
// ─────────────────────────────────────────

describe('REVIEWER_PLUS_SUPERVISOR', () => {
  it('HIGH severity + non-transactional comp → REVIEWER_PLUS_SUPERVISOR', () => {
    const r = computeExposure(input({
      compensationType: 'FLAT_FEE_PER_POST',
      transactionalityClass: 'NON_TRANSACTIONAL',
      severity: 'HIGH',
    }));
    expect(r.exposureLevel).toBe('REVIEWER_PLUS_SUPERVISOR');
    expect(r.requiresPrincipalReview).toBe(false);
  });

  it('CRITICAL severity + non-transactional comp → REVIEWER_PLUS_SUPERVISOR', () => {
    const r = computeExposure(input({
      compensationType: 'MONTHLY_RETAINER',
      transactionalityClass: 'NON_TRANSACTIONAL',
      severity: 'CRITICAL',
    }));
    expect(r.exposureLevel).toBe('REVIEWER_PLUS_SUPERVISOR');
  });
});

describe('REVIEWER', () => {
  it('MEDIUM severity + no comp context → REVIEWER', () => {
    const r = computeExposure(input({ severity: 'MEDIUM' }));
    expect(r.exposureLevel).toBe('REVIEWER');
    expect(r.requiresPrincipalReview).toBe(false);
  });

  it('MEDIUM severity + non-transactional → REVIEWER', () => {
    const r = computeExposure(input({
      compensationType: 'FLAT_FEE_PER_POST',
      transactionalityClass: 'NON_TRANSACTIONAL',
      severity: 'MEDIUM',
    }));
    expect(r.exposureLevel).toBe('REVIEWER');
  });
});

describe('NONE', () => {
  it('LOW severity + no comp context → NONE', () => {
    const r = computeExposure(input());
    expect(r.exposureLevel).toBe('NONE');
    expect(r.requiresPrincipalReview).toBe(false);
    expect(r.exposureReasonCodes).toEqual([]);
    expect(r.exposureSummary).toBe('No elevated supervisory exposure identified.');
  });

  it('LOW severity + UNCOMPENSATED → NONE', () => {
    const r = computeExposure(input({
      compensationType: 'UNCOMPENSATED',
      transactionalityClass: 'NON_TRANSACTIONAL',
      severity: 'LOW',
    }));
    expect(r.exposureLevel).toBe('NONE');
  });
});

// ─────────────────────────────────────────
// D. Reason code accumulation
// ─────────────────────────────────────────

describe('Reason codes', () => {
  it('accumulates multiple reason codes', () => {
    const r = computeExposure(input({
      compensationType: 'PER_DOLLAR_INVESTED',
      transactionalityClass: 'TRANSACTION_BASED',
      isTransactionBased: true,
      isSecurityLinked: true,
      severity: 'CRITICAL',
      hitRuleCodes: ['LLM-001', 'LLM-002', 'RISK-001'],
    }));
    expect(r.exposureReasonCodes).toContain('EXP-001_TRANSACTION_BASED_COMP');
    expect(r.exposureReasonCodes).toContain('EXP-003_PER_DOLLAR_INVESTED');
    expect(r.exposureReasonCodes).toContain('EXP-008_UNDISCLOSED_COMPENSATION');
    expect(r.exposureReasonCodes).toContain('EXP-009_GUARANTEE_OR_FRAUD_SIGNAL');
  });

  it('includes EXP-008 for disclosure hits', () => {
    const r = computeExposure(input({
      severity: 'HIGH',
      hitRuleCodes: ['DISC-001'],
    }));
    expect(r.exposureReasonCodes).toContain('EXP-008_UNDISCLOSED_COMPENSATION');
  });

  it('includes EXP-009 for RISK-001 guarantee', () => {
    const r = computeExposure(input({
      severity: 'CRITICAL',
      hitRuleCodes: ['RISK-001'],
    }));
    expect(r.exposureReasonCodes).toContain('EXP-009_GUARANTEE_OR_FRAUD_SIGNAL');
  });
});

// ─────────────────────────────────────────
// E. Safe fallback — absent signals
// ─────────────────────────────────────────

describe('Safe fallback', () => {
  it('handles all null/undefined inputs gracefully', () => {
    const r = computeExposure({
      compensationType: null,
      transactionalityClass: null,
      isTransactionBased: false,
      isSecurityLinked: false,
      severity: null,
      hitRuleCodes: [],
    });
    expect(r.exposureLevel).toBe('NONE');
    expect(r.requiresPrincipalReview).toBe(false);
    expect(r.exposureReasonCodes).toEqual([]);
  });

  it('handles empty string inputs', () => {
    const r = computeExposure({
      compensationType: '',
      transactionalityClass: '',
      isTransactionBased: false,
      isSecurityLinked: false,
      severity: '',
      hitRuleCodes: [],
    });
    expect(r.exposureLevel).toBe('NONE');
  });
});

// ─────────────────────────────────────────
// F. Boost logic
// ─────────────────────────────────────────

describe('Boost logic', () => {
  it('guarantee on non-transactional comp boosts to PRINCIPAL_EXCEPTION (NOT mandatory principal)', () => {
    const r = computeExposure(input({
      compensationType: 'FLAT_FEE_PER_POST',
      transactionalityClass: 'NON_TRANSACTIONAL',
      severity: 'MEDIUM',
      hitRuleCodes: ['RISK-001'],
    }));
    expect(r.exposureLevel).toBe('PRINCIPAL_EXCEPTION');
    expect(r.requiresPrincipalReview).toBe(false);
  });

  it('disclosure + security-linked on LOW severity boosts to REVIEWER_PLUS_SUPERVISOR', () => {
    const r = computeExposure(input({
      isSecurityLinked: true,
      severity: 'LOW',
      hitRuleCodes: ['DISC-001'],
    }));
    expect(r.exposureLevel).toBe('REVIEWER_PLUS_SUPERVISOR');
  });

  it('summary is human-readable for PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(input({
      compensationType: 'PER_DOLLAR_INVESTED',
      transactionalityClass: 'TRANSACTION_BASED',
      isTransactionBased: true,
    }));
    expect(r.exposureSummary).toContain('Principal review required');
    expect(r.exposureSummary).toContain('Compensation scales per dollar invested');
  });
});
