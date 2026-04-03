"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// SLA Utility
//
// Computes SLA deadlines and breach status for content records.
// Thresholds by severity:
//   CRITICAL  —  24 hours
//   HIGH      —  48 hours
//   MEDIUM    — 120 hours
//   LOW       — 240 hours (also used as default for null/unknown)
//
// Only records with archiveStatus PENDING_REVIEW or ESCALATED
// are considered active for SLA purposes.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlaDeadline = getSlaDeadline;
exports.getSlaStatus = getSlaStatus;
const SLA_HOURS = {
    CRITICAL: 24,
    HIGH: 48,
    MEDIUM: 120,
    LOW: 240,
};
const DEFAULT_SLA_HOURS = 240;
const ACTIVE_STATUSES = new Set(['PENDING_REVIEW', 'ESCALATED']);
// ─────────────────────────────────────────
// getSlaDeadline
// Returns the Date by which this record must be reviewed.
// ─────────────────────────────────────────
function getSlaDeadline(capturedAt, severity) {
    const hours = (severity ? (SLA_HOURS[severity] ?? DEFAULT_SLA_HOURS) : DEFAULT_SLA_HOURS);
    return new Date(capturedAt.getTime() + hours * 60 * 60 * 1000);
}
function getSlaStatus(capturedAt, severity, archiveStatus) {
    const slaDeadline = getSlaDeadline(capturedAt, severity);
    if (!ACTIVE_STATUSES.has(archiveStatus)) {
        return { slaDeadline, slaHoursRemaining: null, slaBreached: false };
    }
    const nowMs = Date.now();
    const msRemaining = slaDeadline.getTime() - nowMs;
    const slaHoursRemaining = parseFloat((msRemaining / (60 * 60 * 1000)).toFixed(2));
    const slaBreached = msRemaining < 0;
    return { slaDeadline, slaHoursRemaining, slaBreached };
}
//# sourceMappingURL=sla.js.map