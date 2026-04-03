/**
 * List all tail periods, newest first.
 * Optionally filter by status (ACTIVE | CLOSED | EXPIRED).
 */
export declare function listTailPeriods(tenantId: string, status?: string): Promise<({
    ambassador: {
        id: string;
        displayName: string;
        handle: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    };
} & {
    tenantId: string;
    reason: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    status: string;
    riskTier: string | null;
    contractEndDate: Date;
    tailDays: number;
    tailStartDate: Date;
    tailEndDate: Date;
    tailType: string;
    postContractFlags: number;
    closedAt: Date | null;
    closedBy: string | null;
    closedReason: string | null;
})[]>;
export interface CreateTailPeriodInput {
    ambassadorId: string;
    contractEndDate: Date;
    tailDays: number;
    tailStartDate: Date;
    tailEndDate: Date;
    reason?: string | null;
    riskTier?: string | null;
    tailType?: string;
}
/**
 * Create a new tail period.
 */
export declare function createTailPeriod(tenantId: string, input: CreateTailPeriodInput): Promise<{
    ambassador: {
        id: string;
        displayName: string;
        handle: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    };
} & {
    tenantId: string;
    reason: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    status: string;
    riskTier: string | null;
    contractEndDate: Date;
    tailDays: number;
    tailStartDate: Date;
    tailEndDate: Date;
    tailType: string;
    postContractFlags: number;
    closedAt: Date | null;
    closedBy: string | null;
    closedReason: string | null;
}>;
/**
 * Close a tail period.
 * Returns null if the tail period is not found.
 */
export declare function closeTailPeriod(tenantId: string, id: string, closedBy: string, closedReason: string): Promise<({
    ambassador: {
        id: string;
        displayName: string;
        handle: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    };
} & {
    tenantId: string;
    reason: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    status: string;
    riskTier: string | null;
    contractEndDate: Date;
    tailDays: number;
    tailStartDate: Date;
    tailEndDate: Date;
    tailType: string;
    postContractFlags: number;
    closedAt: Date | null;
    closedBy: string | null;
    closedReason: string | null;
}) | null>;
//# sourceMappingURL=tailPeriod.service.d.ts.map