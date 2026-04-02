// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Escalation Engine — @robesample-alt/influwatch-core
//
// Derives escalation level and compliance status from detection hits.
// ============================================================

import { RuleHit, computeSeverityFromHits } from './ruleRegistry';

export type EscalationLevel  = 'HIGH' | 'MEDIUM' | 'LOW';
export type EscalationStatus = 'NON_COMPLIANT' | 'REVIEW_REQUIRED' | 'LOG_ONLY';

export interface EscalationResult {
  level:  EscalationLevel;
  status: EscalationStatus;
}

const ESCALATION_STATUS_MAP: Record<EscalationLevel, EscalationStatus> = {
  HIGH:   'NON_COMPLIANT',
  MEDIUM: 'REVIEW_REQUIRED',
  LOW:    'LOG_ONLY',
};

/**
 * Derives an escalation level from detection hits.
 * HIGH   → CRITICAL/HIGH severity, or any DISC-001/DISC-002 hit
 * MEDIUM → MEDIUM severity only
 * LOW    → no hits or LOW severity only
 */
export function computeEscalation(hits: RuleHit[]): EscalationResult {
  if (hits.length === 0) return { level: 'LOW', status: 'LOG_ONLY' };

  const baseHits      = hits.filter(h => !h.ruleCode.startsWith('DISC-'));
  const topSeverity   = computeSeverityFromHits(baseHits);
  const hasDisc001    = hits.some(h => h.ruleCode === 'DISC-001');
  const hasDisc002    = hits.some(h => h.ruleCode === 'DISC-002');
  const hasCritOrHigh = topSeverity === 'CRITICAL' || topSeverity === 'HIGH';

  const level: EscalationLevel =
    (hasCritOrHigh || hasDisc001)              ? 'HIGH'   :
    (topSeverity === 'MEDIUM' || hasDisc002)   ? 'MEDIUM' :
                                                 'LOW';

  return { level, status: ESCALATION_STATUS_MAP[level] };
}
