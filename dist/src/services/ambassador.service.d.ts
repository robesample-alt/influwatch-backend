import { AmbassadorStatus } from '@prisma/client';
export declare function getAmbassadorById(tenantId: string, id: string): Promise<({
    assignedSupervisor: {
        id: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
        status: import(".prisma/client").$Enums.InternalActorStatus;
        displayName: string;
        email: string;
        seriesLicense: string | null;
    } | null;
} & {
    tenantId: string;
    id: string;
    status: import(".prisma/client").$Enums.AmbassadorStatus;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    handle: string;
    primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
    riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    supervisoryRelationship: string | null;
    assignedSupervisorId: string | null;
    phylloUserId: string | null;
    phylloAccountId: string | null;
}) | null>;
export declare function listAmbassadors(tenantId: string, status?: AmbassadorStatus): Promise<({
    assignedSupervisor: {
        id: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
        status: import(".prisma/client").$Enums.InternalActorStatus;
        displayName: string;
        email: string;
        seriesLicense: string | null;
    } | null;
} & {
    tenantId: string;
    id: string;
    status: import(".prisma/client").$Enums.AmbassadorStatus;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    handle: string;
    primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
    riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    supervisoryRelationship: string | null;
    assignedSupervisorId: string | null;
    phylloUserId: string | null;
    phylloAccountId: string | null;
})[]>;
/**
 * Full ambassador detail view — profile + all content records + derived counts.
 * Used by the Promoter Detail screen (Phase 1).
 */
export declare function getAmbassadorDetail(tenantId: string, id: string): Promise<{
    ambassador: {
        assignedSupervisor: {
            id: string;
            role: import(".prisma/client").$Enums.InternalActorRole;
            status: import(".prisma/client").$Enums.InternalActorStatus;
            displayName: string;
            email: string;
            seriesLicense: string | null;
        } | null;
    } & {
        tenantId: string;
        id: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
        supervisoryRelationship: string | null;
        assignedSupervisorId: string | null;
        phylloUserId: string | null;
        phylloAccountId: string | null;
    };
    records: {
        severity: import(".prisma/client").$Enums.Severity | null;
        id: string;
        sourcePlatform: import(".prisma/client").$Enums.SourcePlatform;
        sourceUrl: string;
        capturedAt: Date;
        archiveStatus: import(".prisma/client").$Enums.ArchiveStatus;
        checksum: string | null;
        exposureLevel: string | null;
        requiresPrincipalReview: boolean | null;
        exposureReasonCodes: string | null;
        exposureSummary: string | null;
    }[];
    statusCounts: {
        total: number;
        captured: number;
        pending: number;
        reviewed: number;
        escalated: number;
        closed: number;
    };
    highestSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null;
    openCount: number;
} | null>;
export declare function createAmbassador(tenantId: string, input: {
    displayName: string;
    handle: string;
    primaryPlatform: string;
    riskTier?: string;
    assignedSupervisorId?: string;
    supervisoryRelationship?: string;
    compensation?: {
        compensationType?: string;
        productType?: string;
        isTransactionBased?: boolean;
        isSecurityLinked?: boolean;
        supervisionPosture?: string;
        transactionalityClass?: string;
        compensationRate?: string;
    };
}): Promise<{
    assignedSupervisor: {
        id: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
        status: import(".prisma/client").$Enums.InternalActorStatus;
        displayName: string;
        email: string;
        seriesLicense: string | null;
    } | null;
} & {
    tenantId: string;
    id: string;
    status: import(".prisma/client").$Enums.AmbassadorStatus;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    handle: string;
    primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
    riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    supervisoryRelationship: string | null;
    assignedSupervisorId: string | null;
    phylloUserId: string | null;
    phylloAccountId: string | null;
}>;
export declare function assignSupervisor(tenantId: string, id: string, supervisorId: string | null): Promise<{
    assignedSupervisor: {
        id: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
        status: import(".prisma/client").$Enums.InternalActorStatus;
        displayName: string;
        email: string;
        seriesLicense: string | null;
    } | null;
} & {
    tenantId: string;
    id: string;
    status: import(".prisma/client").$Enums.AmbassadorStatus;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    handle: string;
    primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
    riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    supervisoryRelationship: string | null;
    assignedSupervisorId: string | null;
    phylloUserId: string | null;
    phylloAccountId: string | null;
}>;
export declare function getCampaignById(tenantId: string, id: string): Promise<{
    tenantId: string;
    id: string;
    status: import(".prisma/client").$Enums.CampaignStatus;
    createdAt: Date;
    updatedAt: Date;
    campaignName: string;
    campaignType: import(".prisma/client").$Enums.CampaignType;
    allowedCompensationTypes: string | null;
    campaignRiskMode: string | null;
    requiresPrincipalAtLaunch: boolean | null;
} | null>;
export declare function listCampaigns(tenantId: string): Promise<{
    tenantId: string;
    id: string;
    status: import(".prisma/client").$Enums.CampaignStatus;
    createdAt: Date;
    updatedAt: Date;
    campaignName: string;
    campaignType: import(".prisma/client").$Enums.CampaignType;
    allowedCompensationTypes: string | null;
    campaignRiskMode: string | null;
    requiresPrincipalAtLaunch: boolean | null;
}[]>;
/**
 * Return all ambassador profiles with aggregated capture statistics.
 * Powers the Account Monitor screen.
 *
 * Per-promoter data:
 *   totalCaptures  — all content records ever captured
 *   flagCount      — records currently in PENDING_REVIEW or ESCALATED
 *   lastCaptureAt  — most recent capturedAt timestamp, or null if none
 *   captures24h    — records captured in the last 24 hours
 *
 * Summary totals included at the root level for the summary bar.
 */
export declare function getMonitorSummary(tenantId: string): Promise<{
    summary: {
        total: number;
        active: number;
        paused: number;
        totalCaptures: number;
        captures24h: number;
    };
    promoters: {
        id: string;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
        assignedSupervisor: {
            id: string;
            role: import(".prisma/client").$Enums.InternalActorRole;
            status: import(".prisma/client").$Enums.InternalActorStatus;
            displayName: string;
            email: string;
            seriesLicense: string | null;
        } | null;
        totalCaptures: number;
        pendingCount: number;
        escalatedCount: number;
        flagCount: number;
        lastCaptureAt: Date | null;
        captures24h: number;
    }[];
}>;
//# sourceMappingURL=ambassador.service.d.ts.map