import { Severity } from '@prisma/client';
/**
 * Scan bodyText for risky promotional phrases.
 * Returns the highest severity level matched, or LOW if nothing matches.
 */
export declare function computeSeverity(bodyText: string): Severity;
//# sourceMappingURL=severityEngine.d.ts.map