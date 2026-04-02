// @robesample-alt/influwatch-core
// Public API — exports all detection and escalation primitives

export { Severity }                                     from './ruleRegistry';
export type { RuleHit }                                 from './ruleRegistry';
export { detectRuleHits, computeSeverityFromHits }      from './ruleRegistry';

export type { EscalationLevel, EscalationStatus, EscalationResult } from './escalation';
export { computeEscalation }                            from './escalation';
