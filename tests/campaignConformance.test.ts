// ============================================================
// FUNDUREX — INFLUWATCH
// Tests — Campaign Conformance (Phase 4)
//
// Pure-function tests. No database required.
//
// A. checkCampaignConformance — mismatch/match/null
// B. Exposure engine — EXP-011 campaign drift
// ============================================================

import { checkCampaignConformance } from '../src/lib/campaignConformance';
import { computeExposure, type ExposureInput } from '../src/lib/exposureEngine';

function baseInput(overrides: Partial<ExposureInput> = {}): ExposureInput {
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
// A. checkCampaignConformance
// ─────────────────────────────────────────

describe('checkCampaignConformance', () => {
  it('returns mismatch=true when comp type not in allowed list', () => {
    const r = checkCampaignConformance({
      compensationType: 'PER_DOLLAR_INVESTED',
      allowedCompensationTypesJson: '["FLAT_FEE_PER_POST","MONTHLY_RETAINER"]',
      campaignRiskMode: 'AWARENESS',
      campaignName: 'Test Campaign',
    });
    expect(r.mismatch).toBe(true);
    expect(r.summary).toContain('NOT in');
    expect(r.summary).toContain('PER_DOLLAR_INVESTED');
  });

  it('returns mismatch=false when comp type is in allowed list', () => {
    const r = checkCampaignConformance({
      compensationType: 'FLAT_FEE_PER_POST',
      allowedCompensationTypesJson: '["FLAT_FEE_PER_POST","MONTHLY_RETAINER"]',
      campaignRiskMode: 'EDUCATION',
      campaignName: 'Edu Campaign',
    });
    expect(r.mismatch).toBe(false);
    expect(r.summary).toContain('within');
  });

  it('returns null when allowedCompensationTypes is null', () => {
    const r = checkCampaignConformance({
      compensationType: 'PER_DOLLAR_INVESTED',
      allowedCompensationTypesJson: null,
      campaignRiskMode: null,
    });
    expect(r.mismatch).toBeNull();
    expect(r.summary).toBeNull();
  });

  it('returns null when allowedCompensationTypes is empty array', () => {
    const r = checkCampaignConformance({
      compensationType: 'PER_DOLLAR_INVESTED',
      allowedCompensationTypesJson: '[]',
      campaignRiskMode: null,
    });
    expect(r.mismatch).toBeNull();
  });

  it('returns null when compensationType is missing', () => {
    const r = checkCampaignConformance({
      compensationType: null,
      allowedCompensationTypesJson: '["FLAT_FEE_PER_POST"]',
      campaignRiskMode: 'CONVERSION',
    });
    expect(r.mismatch).toBeNull();
  });

  it('returns null when JSON is invalid', () => {
    const r = checkCampaignConformance({
      compensationType: 'FLAT_FEE_PER_POST',
      allowedCompensationTypesJson: 'not-json',
      campaignRiskMode: null,
    });
    expect(r.mismatch).toBeNull();
  });

  it('is case-insensitive', () => {
    const r = checkCampaignConformance({
      compensationType: 'flat_fee_per_post',
      allowedCompensationTypesJson: '["FLAT_FEE_PER_POST"]',
      campaignRiskMode: null,
    });
    expect(r.mismatch).toBe(false);
  });

  it('includes campaign risk mode in summary', () => {
    const r = checkCampaignConformance({
      compensationType: 'PER_DOLLAR_INVESTED',
      allowedCompensationTypesJson: '["FLAT_FEE_PER_POST"]',
      campaignRiskMode: 'HIGH_SCRUTINY',
      campaignName: 'Critical Campaign',
    });
    expect(r.summary).toContain('high_scrutiny mode');
  });
});

// ─────────────────────────────────────────
// B. Exposure engine — EXP-011 campaign drift
// ─────────────────────────────────────────

describe('EXP-011 campaign compensation drift', () => {
  it('adds EXP-011 and promotes to PRINCIPAL_REQUIRED on explicit mismatch', () => {
    const r = computeExposure(baseInput({
      compensationType: 'FLAT_FEE_PER_POST',
      transactionalityClass: 'NON_TRANSACTIONAL',
      severity: 'LOW',
      compensationMismatchWithCampaign: true,
    }));
    expect(r.exposureReasonCodes).toContain('EXP-011_CAMPAIGN_COMP_DRIFT');
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
    expect(r.requiresPrincipalReview).toBe(true);
  });

  it('does NOT add EXP-011 when mismatch is false', () => {
    const r = computeExposure(baseInput({
      compensationType: 'FLAT_FEE_PER_POST',
      transactionalityClass: 'NON_TRANSACTIONAL',
      severity: 'LOW',
      compensationMismatchWithCampaign: false,
    }));
    expect(r.exposureReasonCodes).not.toContain('EXP-011_CAMPAIGN_COMP_DRIFT');
    expect(r.exposureLevel).toBe('NONE');
  });

  it('does NOT add EXP-011 when mismatch is null (not enough data)', () => {
    const r = computeExposure(baseInput({
      compensationType: 'FLAT_FEE_PER_POST',
      transactionalityClass: 'NON_TRANSACTIONAL',
      severity: 'LOW',
      compensationMismatchWithCampaign: null,
    }));
    expect(r.exposureReasonCodes).not.toContain('EXP-011_CAMPAIGN_COMP_DRIFT');
  });

  it('campaign drift on top of existing TRANSACTION_BASED still produces PRINCIPAL_REQUIRED', () => {
    const r = computeExposure(baseInput({
      compensationType: 'PER_DOLLAR_INVESTED',
      transactionalityClass: 'TRANSACTION_BASED',
      isTransactionBased: true,
      severity: 'CRITICAL',
      compensationMismatchWithCampaign: true,
    }));
    expect(r.exposureLevel).toBe('PRINCIPAL_REQUIRED');
    expect(r.exposureReasonCodes).toContain('EXP-011_CAMPAIGN_COMP_DRIFT');
    expect(r.exposureReasonCodes).toContain('EXP-001_TRANSACTION_BASED_COMP');
  });
});
