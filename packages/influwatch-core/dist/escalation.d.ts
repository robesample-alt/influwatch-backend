import { RuleHit } from './ruleRegistry';
export type EscalationLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type EscalationStatus = 'NON_COMPLIANT' | 'REVIEW_REQUIRED' | 'LOG_ONLY';
export interface EscalationResult {
    level: EscalationLevel;
    status: EscalationStatus;
}
/**
 * Derives an escalation level from detection hits.
 * HIGH   → CRITICAL/HIGH severity, or any DISC-001/DISC-002 hit
 * MEDIUM → MEDIUM severity only
 * LOW    → no hits or LOW severity only
 */
export declare function computeEscalation(hits: RuleHit[]): EscalationResult;
//# sourceMappingURL=escalation.d.ts.map