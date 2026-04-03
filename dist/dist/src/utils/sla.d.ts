export declare function getSlaDeadline(capturedAt: Date, severity: string | null): Date;
export interface SlaStatus {
    slaDeadline: Date;
    slaHoursRemaining: number | null;
    slaBreached: boolean;
}
export declare function getSlaStatus(capturedAt: Date, severity: string | null, archiveStatus: string): SlaStatus;
//# sourceMappingURL=sla.d.ts.map