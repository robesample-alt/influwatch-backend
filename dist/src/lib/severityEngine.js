"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Severity Engine
//
// Thin wrapper around ruleRegistry — delegates phrase detection
// to the canonical rule map, then applies the system-wide
// severity floor rule.
// ============================================================
//
// ── SEVERITY FLOOR RULE (v1.0, enforced) ─────────────────────
//
// A ContentRecord's severity MUST NEVER be lower than EITHER of:
//
//   (a) the highest severity of its DetectionRecords, or
//   (b) the posture-derived floor from the promoter's
//       CompensationStructure.supervisionPosture:
//          CRITICAL posture → severity floor MEDIUM
//          HIGH posture     → severity floor LOW  (no lift)
//          MEDIUM/LOW       → severity floor LOW  (no lift)
//
// Rationale (a): if the detection engine matched a CRITICAL
// rule on a piece of content, the record itself must surface
// as CRITICAL to reviewers regardless of any other signal.
// The detection is ground truth.
//
// Rationale (b): promoters with CRITICAL compensation posture
// (per-conversion + security-linked) represent systemic
// supervisory risk. Every single piece of their content
// demands human review, even when no risky phrase is matched.
// A "clean" post from a CRITICAL-posture promoter is still a
// MEDIUM supervisory concern — never LOW — because the
// compensation arrangement itself is the regulatory risk.
//
// This rule is enforced at every write site that touches
// ContentRecord.severity by calling applySeverityFloor().
//
// ── SEVERITY MODEL v2.0 (roadmap, NOT yet implemented) ───────
//
// The current model picks the max severity across matched
// rules. This is correct but coarse — a record with one HIGH
// hit and a record with eight HIGH hits both render as HIGH.
// v2.0 will replace this with a weighted composite score:
//
//   score =   w1 * compensation_posture_weight
//           + w2 * log(1 + detection_hit_count)
//           + w3 * rule_family_coverage_bonus
//           + w4 * content_type_reach_factor
//           + w5 * platform_follower_log
//           + w6 * promoter_historical_violation_rate
//           - w7 * disclosure_presence_credit
//
// Where:
//   - compensation_posture_weight: CRITICAL=1.0, HIGH=0.7,
//     MEDIUM=0.4, LOW=0.1 (derived from CompensationStructure)
//   - detection_hit_count: saturating log so 8 hits ≠ 80× the
//     weight of 1 hit, but still clearly worse
//   - rule_family_coverage_bonus: flat bonus when hits span
//     multiple families (e.g. RISK + COMP + DISC) — signals
//     systemic non-compliance rather than a single slip
//   - content_type_reach_factor: VIDEO > POST > STORY > COMMENT
//   - platform_follower_log: log10(follower_count) — reach
//     amplifies harm
//   - promoter_historical_violation_rate: rolling 90-day
//     violation count / content count
//   - disclosure_presence_credit: reduce score if a compliant
//     disclosure is detected in the same content
//
// Score buckets → Severity:
//   >= 0.80 → CRITICAL
//   >= 0.55 → HIGH
//   >= 0.30 → MEDIUM
//   <  0.30 → LOW
//
// The floor rule still applies on top of v2.0: whatever the
// composite score yields, severity cannot drop below the
// max detection severity.
//
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSeverity = computeSeverity;
exports.maxSeverity = maxSeverity;
exports.postureSeverityFloor = postureSeverityFloor;
exports.applySeverityFloor = applySeverityFloor;
const ruleRegistry_1 = require("./ruleRegistry");
const SEVERITY_RANK = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3,
};
/**
 * Scan bodyText for risky promotional phrases.
 * Returns the highest severity level matched, or LOW if nothing matches.
 */
function computeSeverity(bodyText) {
    return (0, ruleRegistry_1.computeSeverityFromHits)((0, ruleRegistry_1.detectRuleHits)(bodyText));
}
/**
 * Return the higher of two severities.
 */
function maxSeverity(a, b) {
    return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}
/**
 * Map a compensation posture to its severity floor.
 * CRITICAL posture lifts clean records to MEDIUM.
 * All other postures leave the severity untouched.
 */
function postureSeverityFloor(posture) {
    const p = (posture || '').toUpperCase();
    if (p === 'CRITICAL')
        return 'MEDIUM';
    return 'LOW';
}
/**
 * SEVERITY FLOOR RULE enforcement.
 *
 * Given a proposed record severity, the list of detection
 * severities attached to that record, and the promoter's
 * compensation posture, return the effective severity —
 * guaranteed to be >= max(detection floor, posture floor).
 *
 * Call this at every site that writes ContentRecord.severity.
 */
function applySeverityFloor(proposedSeverity, detectionSeverities, posture) {
    const detectionFloor = detectionSeverities.reduce((acc, s) => (SEVERITY_RANK[s] > SEVERITY_RANK[acc] ? s : acc), 'LOW');
    const postureFloor = postureSeverityFloor(posture);
    return maxSeverity(maxSeverity(proposedSeverity, detectionFloor), postureFloor);
}
//# sourceMappingURL=severityEngine.js.map