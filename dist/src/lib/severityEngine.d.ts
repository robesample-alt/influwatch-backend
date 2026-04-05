import { Severity } from '@prisma/client';
/**
 * Scan bodyText for risky promotional phrases.
 * Returns the highest severity level matched, or LOW if nothing matches.
 */
export declare function computeSeverity(bodyText: string): Severity;
/**
 * Return the higher of two severities.
 */
export declare function maxSeverity(a: Severity, b: Severity): Severity;
/**
 * Map a compensation posture to its severity floor.
 * CRITICAL posture lifts clean records to MEDIUM.
 * All other postures leave the severity untouched.
 */
export declare function postureSeverityFloor(posture?: string | null): Severity;
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
export declare function applySeverityFloor(proposedSeverity: Severity, detectionSeverities: Severity[], posture?: string | null): Severity;
//# sourceMappingURL=severityEngine.d.ts.map