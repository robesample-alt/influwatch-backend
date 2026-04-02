// Detection engine — unit tests
import { detectRuleHits, computeSeverityFromHits } from '../src/lib/ruleRegistry';

describe('detectRuleHits', () => {
  it('returns empty for clean text', () => {
    expect(detectRuleHits('Welcome to your account settings.')).toHaveLength(0);
  });

  it('detects RISK-001 for guaranteed returns', () => {
    const hits = detectRuleHits('guaranteed returns on every trade');
    expect(hits.some(h => h.ruleCode === 'RISK-001')).toBe(true);
  });

  it('detects DISC-001 when risky phrase has no disclosure', () => {
    const hits = detectRuleHits('guaranteed returns on every trade');
    expect(hits.some(h => h.ruleCode === 'DISC-001')).toBe(true);
  });

  it('does NOT fire DISC-001 when disclosure present', () => {
    const hits = detectRuleHits('guaranteed returns. not financial advice.');
    expect(hits.some(h => h.ruleCode === 'DISC-001')).toBe(false);
  });

  it('detects DISC-002 for affiliate language without disclosure', () => {
    const hits = detectRuleHits('Check this out, affiliate link in bio');
    expect(hits.some(h => h.ruleCode === 'DISC-002')).toBe(true);
  });

  it('does NOT fire DISC-002 when #ad present', () => {
    const hits = detectRuleHits('Check this out, affiliate link in bio #ad');
    expect(hits.some(h => h.ruleCode === 'DISC-002')).toBe(false);
  });
});

describe('computeSeverityFromHits', () => {
  it('returns LOW for empty hits', () => {
    expect(computeSeverityFromHits([])).toBe('LOW');
  });

  it('returns CRITICAL when RISK-001 hit present', () => {
    const hits = detectRuleHits('guaranteed returns');
    const baseHits = hits.filter(h => !h.ruleCode.startsWith('DISC-'));
    expect(computeSeverityFromHits(baseHits)).toBe('CRITICAL');
  });
});
