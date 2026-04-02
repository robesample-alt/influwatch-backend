// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Detection Matrix — Compensation Engine
//
// Tests classifyCompensation() and the COMP-001/002/003 rule
// branches in detectRuleHits(). No database required.
//
// Matrix covers:
//   A. classifyCompensation — posture, flags, disclosure
//   B. COMP-001 — transaction-based + security-linked + affiliate link
//   C. COMP-002 — solicitation language gated on CRITICAL posture
//   D. COMP-003 — ownership disclosure absence on equity/carry/revenue-share
//   E. Isolation — existing RISK/DISC rules unaffected by compensation context
// ============================================================

import { classifyCompensation }          from '../src/lib/compensationClassifier';
import { detectRuleHits, CompensationContext } from '../src/lib/ruleRegistry';

// ─────────────────────────────────────────
// A. classifyCompensation — decision matrix
// ─────────────────────────────────────────

describe('classifyCompensation', () => {

  describe('supervisionPosture — CRITICAL', () => {
    it('returns CRITICAL when trigger is INVESTMENT and product is REG_A', () => {
      const result = classifyCompensation({
        compensationForm:    'FLAT_FEE',
        compensationTrigger: 'INVESTMENT',
        productType:         'REG_A',
      });
      expect(result.supervisionPosture).toBe('CRITICAL');
      expect(result.isTransactionBased).toBe(true);
      expect(result.isSecurityLinked).toBe(true);
    });

    it('returns CRITICAL when form is EQUITY and trigger is CAPITAL_RAISED', () => {
      const result = classifyCompensation({
        compensationForm:    'EQUITY',
        compensationTrigger: 'CAPITAL_RAISED',
        productType:         'FUND',
      });
      expect(result.supervisionPosture).toBe('CRITICAL');
    });

    it('returns CRITICAL when form is REVENUE_SHARE and trigger is INVESTMENT', () => {
      const result = classifyCompensation({
        compensationForm:    'REVENUE_SHARE',
        compensationTrigger: 'INVESTMENT',
        productType:         'OTHER',
      });
      expect(result.supervisionPosture).toBe('CRITICAL');
    });
  });

  describe('supervisionPosture — HIGH', () => {
    it('returns HIGH when trigger is DEPOSIT and product is REG_CF', () => {
      const result = classifyCompensation({
        compensationForm:    'FLAT_FEE',
        compensationTrigger: 'DEPOSIT',
        productType:         'REG_CF',
      });
      expect(result.supervisionPosture).toBe('HIGH');
      expect(result.requiresPrincipalReview).toBe(true);
    });

    it('returns HIGH when trigger is FUNDED_ACCOUNT and product is ADVISORY_SERVICE', () => {
      const result = classifyCompensation({
        compensationForm:    'PER_CONTENT',
        compensationTrigger: 'FUNDED_ACCOUNT',
        productType:         'ADVISORY_SERVICE',
      });
      expect(result.supervisionPosture).toBe('HIGH');
    });

    it('returns HIGH when trigger is ACCOUNT_OPEN and product is REG_D', () => {
      const result = classifyCompensation({
        compensationForm:    'PER_CONTENT',
        compensationTrigger: 'ACCOUNT_OPEN',
        productType:         'REG_D',
      });
      // ACCOUNT_OPEN is a deposit-class trigger → HIGH when security-linked
      // PER_CONTENT is not in TRANSACTION_BASED_FORMS → isTransactionBased = false → CRITICAL branch skipped
      expect(result.supervisionPosture).toBe('HIGH');
      expect(result.requiresPrincipalReview).toBe(true);
    });
  });

  describe('supervisionPosture — MEDIUM', () => {
    it('returns MEDIUM when trigger is LEAD and product is REG_A', () => {
      const result = classifyCompensation({
        compensationForm:    'FLAT_FEE',
        compensationTrigger: 'LEAD',
        productType:         'REG_A',
      });
      expect(result.supervisionPosture).toBe('MEDIUM');
      expect(result.requiresPrincipalReview).toBe(false);
    });

    it('returns MEDIUM when trigger is SIGNUP and product is FUND', () => {
      const result = classifyCompensation({
        compensationForm:    'PER_CONTENT',
        compensationTrigger: 'SIGNUP',
        productType:         'FUND',
      });
      expect(result.supervisionPosture).toBe('MEDIUM');
    });

    it('returns MEDIUM when form is CLICK_BASED and product is REG_CF', () => {
      const result = classifyCompensation({
        compensationForm:    'CLICK_BASED',
        compensationTrigger: 'QUALIFIED_LEAD',
        productType:         'REG_CF',
      });
      expect(result.supervisionPosture).toBe('MEDIUM');
    });
  });

  describe('supervisionPosture — LOW', () => {
    it('returns LOW for FLAT_FEE / LEAD / OTHER', () => {
      const result = classifyCompensation({
        compensationForm:    'FLAT_FEE',
        compensationTrigger: 'LEAD',
        productType:         'OTHER',
      });
      expect(result.supervisionPosture).toBe('LOW');
      expect(result.requiresPrincipalReview).toBe(false);
    });

    it('returns LOW for RETAINER / SIGNUP / FINTECH', () => {
      const result = classifyCompensation({
        compensationForm:    'RETAINER',
        compensationTrigger: 'SIGNUP',
        productType:         'FINTECH',
      });
      expect(result.supervisionPosture).toBe('LOW');
    });
  });

  describe('isTransactionBased', () => {
    it('is true when trigger is SUBSCRIPTION', () => {
      const result = classifyCompensation({
        compensationForm:    'FLAT_FEE',
        compensationTrigger: 'SUBSCRIPTION',
        productType:         'OTHER',
      });
      expect(result.isTransactionBased).toBe(true);
    });

    it('is true when form is CARRY regardless of trigger', () => {
      const result = classifyCompensation({
        compensationForm:    'CARRY',
        compensationTrigger: 'LEAD',
        productType:         'OTHER',
      });
      expect(result.isTransactionBased).toBe(true);
    });

    it('is false for FLAT_FEE / LEAD / OTHER', () => {
      const result = classifyCompensation({
        compensationForm:    'FLAT_FEE',
        compensationTrigger: 'LEAD',
        productType:         'OTHER',
      });
      expect(result.isTransactionBased).toBe(false);
    });
  });

  describe('isCompensationVariable', () => {
    it('is false for FLAT_FEE', () => {
      expect(classifyCompensation({
        compensationForm: 'FLAT_FEE', compensationTrigger: 'LEAD', productType: 'OTHER',
      }).isCompensationVariable).toBe(false);
    });

    it('is false for PER_CONTENT', () => {
      expect(classifyCompensation({
        compensationForm: 'PER_CONTENT', compensationTrigger: 'LEAD', productType: 'OTHER',
      }).isCompensationVariable).toBe(false);
    });

    it('is false for RETAINER', () => {
      expect(classifyCompensation({
        compensationForm: 'RETAINER', compensationTrigger: 'LEAD', productType: 'OTHER',
      }).isCompensationVariable).toBe(false);
    });

    it('is true for REVENUE_SHARE', () => {
      expect(classifyCompensation({
        compensationForm: 'REVENUE_SHARE', compensationTrigger: 'LEAD', productType: 'OTHER',
      }).isCompensationVariable).toBe(true);
    });
  });

  describe('requiresDisclosure', () => {
    it('is true when isSecurityLinked', () => {
      const result = classifyCompensation({
        compensationForm:    'FLAT_FEE',
        compensationTrigger: 'LEAD',
        productType:         'REG_A',
      });
      expect(result.requiresDisclosure).toBe(true);
    });

    it('is true when form is REVENUE_SHARE even for non-security product', () => {
      const result = classifyCompensation({
        compensationForm:    'REVENUE_SHARE',
        compensationTrigger: 'LEAD',
        productType:         'OTHER',
      });
      // REVENUE_SHARE makes isTransactionBased = true → isSecurityLinked = true
      expect(result.requiresDisclosure).toBe(true);
    });

    it('is false for FLAT_FEE / LEAD / OTHER', () => {
      const result = classifyCompensation({
        compensationForm:    'FLAT_FEE',
        compensationTrigger: 'LEAD',
        productType:         'OTHER',
      });
      expect(result.requiresDisclosure).toBe(false);
    });
  });
});

// ─────────────────────────────────────────
// B. COMP-001 — Transaction-Based Compensation Solicitation Risk
// ─────────────────────────────────────────

describe('COMP-001 — Transaction-Based Compensation Solicitation Risk', () => {
  const criticalCtx: CompensationContext = {
    isTransactionBased: true,
    isSecurityLinked:   true,
    supervisionPosture: 'CRITICAL',
    compensationForm:   'INVESTMENT_BASED',
    hasAffiliateLink:   true,
  };

  it('fires CRITICAL when isTransactionBased + isSecurityLinked + hasAffiliateLink', () => {
    const hits = detectRuleHits('Check out this opportunity.', criticalCtx);
    const comp001 = hits.filter(h => h.ruleCode === 'COMP-001');
    expect(comp001).toHaveLength(1);
    expect(comp001[0].severity).toBe('CRITICAL');
  });

  it('does NOT fire when hasAffiliateLink is false', () => {
    const ctx: CompensationContext = { ...criticalCtx, hasAffiliateLink: false };
    const hits = detectRuleHits('Check out this opportunity.', ctx);
    expect(hits.some(h => h.ruleCode === 'COMP-001')).toBe(false);
  });

  it('does NOT fire when isTransactionBased is false', () => {
    const ctx: CompensationContext = { ...criticalCtx, isTransactionBased: false };
    const hits = detectRuleHits('Check out this opportunity.', ctx);
    expect(hits.some(h => h.ruleCode === 'COMP-001')).toBe(false);
  });

  it('does NOT fire when isSecurityLinked is false', () => {
    const ctx: CompensationContext = { ...criticalCtx, isSecurityLinked: false };
    const hits = detectRuleHits('Check out this opportunity.', ctx);
    expect(hits.some(h => h.ruleCode === 'COMP-001')).toBe(false);
  });

  it('does NOT fire when no compensationCtx is passed', () => {
    const hits = detectRuleHits('Check out this opportunity.');
    expect(hits.some(h => h.ruleCode === 'COMP-001')).toBe(false);
  });
});

// ─────────────────────────────────────────
// C. COMP-002 — Unregistered Solicitation Language
// ─────────────────────────────────────────

describe('COMP-002 — Unregistered Solicitation Language', () => {
  const criticalCtx: CompensationContext = {
    isTransactionBased: true,
    isSecurityLinked:   true,
    supervisionPosture: 'CRITICAL',
    compensationForm:   'INVESTMENT_BASED',
    hasAffiliateLink:   false,
  };

  const nonCriticalCtx: CompensationContext = {
    ...criticalCtx,
    supervisionPosture: 'HIGH',
  };

  it('fires for "invest now" when posture is CRITICAL', () => {
    const hits = detectRuleHits('invest now and grow your portfolio', criticalCtx);
    const comp002 = hits.filter(h => h.ruleCode === 'COMP-002');
    expect(comp002).toHaveLength(1);
    expect(comp002[0].matchedPhrase).toBe('invest now');
    expect(comp002[0].severity).toBe('CRITICAL');
  });

  it('fires for "click to invest" when posture is CRITICAL', () => {
    const hits = detectRuleHits('click to invest today', criticalCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-002' && h.matchedPhrase === 'click to invest')).toBe(true);
  });

  it('fires for "start investing" when posture is CRITICAL', () => {
    const hits = detectRuleHits('start investing with just $100', criticalCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-002' && h.matchedPhrase === 'start investing')).toBe(true);
  });

  it('fires for "fund your account" when posture is CRITICAL', () => {
    const hits = detectRuleHits('fund your account now to get started', criticalCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-002' && h.matchedPhrase === 'fund your account')).toBe(true);
  });

  it('fires multiple hits when multiple phrases present', () => {
    const hits = detectRuleHits('invest now and fund your account today', criticalCtx);
    const comp002 = hits.filter(h => h.ruleCode === 'COMP-002');
    expect(comp002.length).toBeGreaterThanOrEqual(2);
  });

  it('does NOT fire when posture is HIGH', () => {
    const hits = detectRuleHits('invest now and grow your portfolio', nonCriticalCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-002')).toBe(false);
  });

  it('does NOT fire when posture is MEDIUM', () => {
    const ctx = { ...criticalCtx, supervisionPosture: 'MEDIUM' };
    const hits = detectRuleHits('invest now', ctx);
    expect(hits.some(h => h.ruleCode === 'COMP-002')).toBe(false);
  });

  it('does NOT fire when posture is LOW', () => {
    const ctx = { ...criticalCtx, supervisionPosture: 'LOW' };
    const hits = detectRuleHits('invest now', ctx);
    expect(hits.some(h => h.ruleCode === 'COMP-002')).toBe(false);
  });

  it('does NOT fire when no compensationCtx is passed', () => {
    const hits = detectRuleHits('invest now and fund your account');
    expect(hits.some(h => h.ruleCode === 'COMP-002')).toBe(false);
  });

  it('is case-insensitive', () => {
    const hits = detectRuleHits('INVEST NOW and FUND YOUR ACCOUNT', criticalCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-002')).toBe(true);
  });
});

// ─────────────────────────────────────────
// D. COMP-003 — Compensation Disclosure Insufficient
// ─────────────────────────────────────────

describe('COMP-003 — Compensation Disclosure Insufficient', () => {
  const equityCtx: CompensationContext = {
    isTransactionBased: true,
    isSecurityLinked:   true,
    supervisionPosture: 'CRITICAL',
    compensationForm:   'EQUITY',
    hasAffiliateLink:   false,
  };

  it('fires HIGH for EQUITY form with no ownership disclosure', () => {
    const hits = detectRuleHits('This is a great opportunity to grow wealth.', equityCtx);
    const comp003 = hits.filter(h => h.ruleCode === 'COMP-003');
    expect(comp003).toHaveLength(1);
    expect(comp003[0].severity).toBe('HIGH');
    expect(comp003[0].matchedPhrase).toBe('[no ownership disclosure detected]');
  });

  it('fires for CARRY form with no ownership disclosure', () => {
    const ctx = { ...equityCtx, compensationForm: 'CARRY' };
    const hits = detectRuleHits('Check out this fund.', ctx);
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(true);
  });

  it('fires for REVENUE_SHARE form with no ownership disclosure', () => {
    const ctx = { ...equityCtx, compensationForm: 'REVENUE_SHARE' };
    const hits = detectRuleHits('Great opportunity ahead.', ctx);
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(true);
  });

  it('does NOT fire when "i own shares" is present', () => {
    const hits = detectRuleHits('I own shares in this company.', equityCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(false);
  });

  it('does NOT fire when "i am a shareholder" is present', () => {
    const hits = detectRuleHits('Disclosure: I am a shareholder of this company.', equityCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(false);
  });

  it('does NOT fire when "i have equity" is present', () => {
    const hits = detectRuleHits('I have equity in this platform.', equityCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(false);
  });

  it('does NOT fire when "revenue share" is present', () => {
    const hits = detectRuleHits('I receive a revenue share from this product.', equityCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(false);
  });

  it('does NOT fire when "i earn a commission" is present', () => {
    const hits = detectRuleHits('Disclosure: I earn a commission on referrals.', equityCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(false);
  });

  it('does NOT fire for FLAT_FEE form even without any disclosure', () => {
    const ctx = { ...equityCtx, compensationForm: 'FLAT_FEE' };
    const hits = detectRuleHits('Great opportunity.', ctx);
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(false);
  });

  it('does NOT fire when no compensationCtx is passed', () => {
    const hits = detectRuleHits('Great opportunity to grow wealth.');
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(false);
  });

  it('is case-insensitive for disclosure patterns', () => {
    const hits = detectRuleHits('I EARN A COMMISSION on every referral.', equityCtx);
    expect(hits.some(h => h.ruleCode === 'COMP-003')).toBe(false);
  });
});

// ─────────────────────────────────────────
// E. Isolation — existing RISK/DISC rules unaffected
// ─────────────────────────────────────────

describe('Isolation — existing rules unaffected by compensation context', () => {
  const ctx: CompensationContext = {
    isTransactionBased: true,
    isSecurityLinked:   true,
    supervisionPosture: 'CRITICAL',
    compensationForm:   'EQUITY',
    hasAffiliateLink:   true,
  };

  it('RISK-001 still fires alongside COMP rules', () => {
    const hits = detectRuleHits('guaranteed returns — invest now', ctx);
    expect(hits.some(h => h.ruleCode === 'RISK-001')).toBe(true);
    expect(hits.some(h => h.ruleCode === 'COMP-002')).toBe(true);
    expect(hits.some(h => h.ruleCode === 'COMP-001')).toBe(true);
  });

  it('DISC-001 still fires when risky phrase has no disclosure', () => {
    const hits = detectRuleHits('guaranteed returns — invest now', ctx);
    expect(hits.some(h => h.ruleCode === 'DISC-001')).toBe(true);
  });

  it('DISC-002 still fires for affiliate language without disclosure', () => {
    const hits = detectRuleHits('Check this out, affiliate link in bio', ctx);
    expect(hits.some(h => h.ruleCode === 'DISC-002')).toBe(true);
  });

  it('clean text with no ctx returns no hits', () => {
    const hits = detectRuleHits('Welcome to your account overview.');
    expect(hits).toHaveLength(0);
  });

  it('clean text with ctx fires only COMP-001 and COMP-003 (no solicitation phrases)', () => {
    const hits = detectRuleHits('Welcome to your account overview.', ctx);
    const codes = hits.map(h => h.ruleCode);
    expect(codes).toContain('COMP-001');  // hasAffiliateLink = true
    expect(codes).toContain('COMP-003');  // EQUITY + no ownership disclosure
    expect(codes).not.toContain('RISK-001');
    expect(codes).not.toContain('COMP-002'); // no solicitation phrases
  });
});
