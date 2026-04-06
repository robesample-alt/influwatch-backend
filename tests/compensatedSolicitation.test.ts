// ============================================================
// FUNDUREX — INFLUWATCH
// Tests — Compensated Solicitation (EXP-013)
//
// Pure-function tests. No database required.
//
// A. EXP-013 fires when solicitation + distribution mechanism
// B. EXP-013 does NOT fire without solicitation
// C. EXP-013 does NOT fire without distribution mechanism
// D. Principal promotion when full triangle is present
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
// A. EXP-013 fires: solicitation + distribution
// ─────────────────────────────────────────

describe('EXP-013 compensated solicitation', () => {
  it('fires when LLM-001 solicitation + hasAffiliateLink', () => {
    const r = computeExposure(input({
      hitRuleCodes: ['LLM-001'],
      hasAffiliateLink: true,
    }));
    expect(r.exposureReasonCodes).toContain('EXP-013_COMPENSATED_SOLICITATION');
  });

  it('fires when COMP-002 solicitation + hasReferralCode', () => {
    const r = computeExposure(input({
      hitRuleCodes: ['COMP-002'],
      hasReferralCode: true,
    }));
    expect(r.exposureReasonCodes).toContain('EXP-013_COMPENSATED_SOLICITATION');
  });

  it('fires when LLM-001 + hasReferralCode', () => {
    const r = computeExposure(input({
      hitRuleCodes: ['LLM-001'],
      hasReferralCode: true,
    }));
    expect(r.exposureReasonCodes).toContain('EXP-013_COMPENSATED_SOLICITATION');
  });
});

// ─────────────────────────────────────────
// B. Does NOT fire without solicitation
// ─────────────────────────────────────────

describe('EXP-013 requires solicitation', () => {
  it('does not fire with affiliate link but no solicitation hit', () => {
    const r = computeExposure(input({
      hitRuleCodes: ['RISK-002'], // unbalanced risk, not solicitation
      hasAffiliateLink: true,
    }));
    expect(r.exposureReasonCodes).not.toContain('EXP-013_COMPENSATED_SOLICITATION');
  });

  it('does not fire with referral code but no solicitation hit', () => {
    const r = computeExposure(input({
      hitRuleCodes: ['DISC-001'],
      hasReferralCode: true,
    }));
    expect(r.exposureReasonCodes).not.toContain('EXP-013_COMPENSATED_SOLICITATION');
  });

  it('does not fire with no hits at all', () => {
    const r = computeExposure(input({
      hasAffiliateLink: true,
      hasReferralCode: true,
    }));
    expect(r.exposureReasonCodes).not.toContain('EXP-013_COMPENSATED_SOLICITATION');
  });
});

// ─────────────────────────────────────────
// C. Does NOT fire without distribution mechanism
// ─────────────────────────────────────────

describe('EXP-013 requires distribution mechanism', () => {
  it('does not fire with solicitation but no link/code', () => {
    const r = computeExposure(input({
      hitRuleCodes: ['LLM-001'],
      hasAffiliateLink: false,
      hasReferralCode: false,
    }));
    expect(r.exposureReasonCodes).not.toContain('EXP-013_COMPENSATED_SOLICITATION');
  });
});

// ─────────────────────────────────────────
// D. Principal promotion: full triangle
// ─────────────────────────────────────────

describe('Full triangle → PRINCIPAL_REQUIRED', () => {
  it('solicitation + affiliate link + transaction-based → PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(input({
      hitRuleCodes: ['LLM-001'],
      hasAffiliateLink: true,
      isTransactionBased: true,
      compensationType: 'PER_ACCOUNT_OPENED',
      transactionalityClass: 'POTENTIALLY_TRANSACTIONAL',
    }));
    expect(r.exposureReasonCodes).toContain('EXP-013_COMPENSATED_SOLICITATION');
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
    expect(r.requiresPrincipalReview).toBe(true);
  });

  it('solicitation + referral code + security-linked → PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(input({
      hitRuleCodes: ['COMP-002'],
      hasReferralCode: true,
      isSecurityLinked: true,
      compensationType: 'FLAT_FEE_PER_POST',
      transactionalityClass: 'NON_TRANSACTIONAL',
    }));
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
  });

  it('solicitation + affiliate link but NOT transactional/security → no principal promotion from A4', () => {
    const r = computeExposure(input({
      hitRuleCodes: ['LLM-001'],
      hasAffiliateLink: true,
      isTransactionBased: false,
      isSecurityLinked: false,
      severity: 'HIGH',
    }));
    expect(r.exposureReasonCodes).toContain('EXP-013_COMPENSATED_SOLICITATION');
    // Still gets elevated from severity but not from A4 rule
    expect(r.exposureLevel).not.toBe('NONE');
  });
});
