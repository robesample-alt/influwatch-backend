// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Severity Engine
//
// Thin wrapper around ruleRegistry — delegates all phrase
// detection to the canonical rule map.
// External API (computeSeverity) is unchanged.
// ============================================================

import { Severity } from '@prisma/client';
import { detectRuleHits, computeSeverityFromHits } from './ruleRegistry';

/**
 * Scan bodyText for risky promotional phrases.
 * Returns the highest severity level matched, or LOW if nothing matches.
 */
export function computeSeverity(bodyText: string): Severity {
  return computeSeverityFromHits(detectRuleHits(bodyText));
}
