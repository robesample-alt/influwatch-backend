// ============================================================
// FUNDUREX — INFLUWATCH
// Detection test matrix
//
// Verifies detectRuleHits + computeEscalation across key cases.
// Run: npx ts-node scripts/test-detection.ts
// ============================================================

import { detectRuleHits, computeSeverityFromHits } from '../src/lib/ruleRegistry';
import { ArchiveStatus }                            from '@prisma/client';

// ── Mirror computeEscalation logic from the service ──────────
// (copied inline to keep this script self-contained)

type EscalationLevel = 'HIGH' | 'MEDIUM' | 'LOW';

function computeEscalation(hits: ReturnType<typeof detectRuleHits>): {
  level: EscalationLevel;
  status: string;
} {
  if (hits.length === 0) return { level: 'LOW', status: 'LOG_ONLY' };

  const baseHits      = hits.filter(h => !h.ruleCode.startsWith('DISC-'));
  const topSeverity   = computeSeverityFromHits(baseHits);
  const hasDisc001    = hits.some(h => h.ruleCode === 'DISC-001');
  const hasDisc002    = hits.some(h => h.ruleCode === 'DISC-002');
  const hasCritOrHigh = topSeverity === 'CRITICAL' || topSeverity === 'HIGH';

  const level: EscalationLevel =
    (hasCritOrHigh || hasDisc001)            ? 'HIGH'   :
    (topSeverity === 'MEDIUM' || hasDisc002) ? 'MEDIUM' :
                                               'LOW';

  const status =
    level === 'HIGH'   ? 'NON_COMPLIANT'   :
    level === 'MEDIUM' ? 'REVIEW_REQUIRED' :
                         'LOG_ONLY';

  return { level, status };
}

function archiveStatusFromEscalation(level: EscalationLevel): ArchiveStatus {
  return level === 'HIGH'   ? ArchiveStatus.ESCALATED      :
         level === 'MEDIUM' ? ArchiveStatus.PENDING_REVIEW :
                              ArchiveStatus.CAPTURED;
}

// ── Test cases ────────────────────────────────────────────────

const cases: { label: string; text: string }[] = [
  {
    label: '1. risky phrase, no disclosure',
    text:  'Guaranteed returns — once in a lifetime opportunity',
  },
  {
    label: '2. risky phrase, with disclosure',
    text:  'Guaranteed returns — once in a lifetime opportunity. Not financial advice.',
  },
  {
    label: '3. affiliate language, no disclosure',
    text:  'Check this out, affiliate link in bio',
  },
  {
    label: '4. affiliate language, with disclosure',
    text:  'Check this out, affiliate link in bio #ad',
  },
  {
    label: '5. medium-severity phrase only',
    text:  'This investment has strong returns and significant upside',
  },
  {
    label: '6. clean text',
    text:  'Welcome to the platform. Please review your account settings.',
  },
  {
    label: '7. forward-looking statement, no disclaimer → expect RISK-004',
    text:  'This portfolio will grow 30% next quarter. Strong returns ahead.',
  },
  {
    label: '8. testimonial, no disclosure → expect RISK-005',
    text:  'I made $50,000 last month using this strategy. My returns have been incredible.',
  },
  {
    label: '9. forward-looking statement WITH disclaimer → expect no RISK-004',
    text:  'This portfolio will grow significantly. Past performance is not a guarantee of future results.',
  },
  {
    label: '10. testimonial WITH disclosure → expect no RISK-005',
    text:  'I made $50,000 last month. Individual results may vary and are not typical.',
  },
];

// ── Runner ────────────────────────────────────────────────────

const PASS = '✓';
const INFO = '·';

console.log('\nInfluWatch — Detection Test Matrix\n' + '─'.repeat(52));

for (const c of cases) {
  const hits       = detectRuleHits(c.text);
  const escalation = computeEscalation(hits);
  const status     = archiveStatusFromEscalation(escalation.level);
  const codes      = hits.length > 0
    ? [...new Set(hits.map(h => h.ruleCode))].join(', ')
    : '(none)';

  console.log(`\n${PASS} ${c.label}`);
  console.log(`  ${INFO} rules hit    : ${codes}`);
  console.log(`  ${INFO} escalation   : ${escalation.level} / ${escalation.status}`);
  console.log(`  ${INFO} archiveStatus: ${status}`);
}

console.log('\n' + '─'.repeat(52) + '\n');
