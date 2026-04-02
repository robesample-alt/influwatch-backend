"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Escalation Engine — @robesample-alt/influwatch-core
//
// Derives escalation level and compliance status from detection hits.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeEscalation = computeEscalation;
const ruleRegistry_1 = require("./ruleRegistry");
const ESCALATION_STATUS_MAP = {
    HIGH: 'NON_COMPLIANT',
    MEDIUM: 'REVIEW_REQUIRED',
    LOW: 'LOG_ONLY',
};
/**
 * Derives an escalation level from detection hits.
 * HIGH   → CRITICAL/HIGH severity, or any DISC-001/DISC-002 hit
 * MEDIUM → MEDIUM severity only
 * LOW    → no hits or LOW severity only
 */
function computeEscalation(hits) {
    if (hits.length === 0)
        return { level: 'LOW', status: 'LOG_ONLY' };
    const baseHits = hits.filter(h => !h.ruleCode.startsWith('DISC-'));
    const topSeverity = (0, ruleRegistry_1.computeSeverityFromHits)(baseHits);
    const hasDisc001 = hits.some(h => h.ruleCode === 'DISC-001');
    const hasDisc002 = hits.some(h => h.ruleCode === 'DISC-002');
    const hasCritOrHigh = topSeverity === 'CRITICAL' || topSeverity === 'HIGH';
    const level = (hasCritOrHigh || hasDisc001) ? 'HIGH' :
        (topSeverity === 'MEDIUM' || hasDisc002) ? 'MEDIUM' :
            'LOW';
    return { level, status: ESCALATION_STATUS_MAP[level] };
}
//# sourceMappingURL=escalation.js.map