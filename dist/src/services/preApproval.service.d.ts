declare const VALID_DECISION_STATUSES: readonly ["APPROVED", "REJECTED", "REVISION_REQUESTED"];
export type DecisionStatus = typeof VALID_DECISION_STATUSES[number];
export { VALID_DECISION_STATUSES };
declare const VALID_STATUSES: readonly ["PENDING", "APPROVED", "REJECTED", "REVISION_REQUESTED"];
export { VALID_STATUSES };
/**
 * List all pre-approval requests, newest first.
 * Optionally filter by status.
 */
export declare function listRequests(tenantId: string, status?: string): Promise<({
    ambassador: {
        id: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        displayName: string;
        handle: string;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    };
    assignedPrincipal: {
        id: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
        displayName: string;
        email: string;
    } | null;
} & {
    tenantId: string;
    id: string;
    status: string;
    contentType: string;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    decision: string | null;
    submittedBy: string;
    platform: string;
    contentPreview: string;
    requiredBy: Date | null;
    assignedPrincipalId: string | null;
    decidedBy: string | null;
    decidedAt: Date | null;
    slaHours: number;
})[]>;
export interface CreateRequestInput {
    ambassadorId: string;
    submittedBy: string;
    contentType: string;
    platform: string;
    contentPreview: string;
    requiredBy?: Date | null;
    assignedPrincipalId?: string | null;
    slaHours?: number;
}
/**
 * Submit a new pre-approval request.
 */
export declare function createRequest(tenantId: string, input: CreateRequestInput): Promise<{
    ambassador: {
        id: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        displayName: string;
        handle: string;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    };
    assignedPrincipal: {
        id: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
        displayName: string;
        email: string;
    } | null;
} & {
    tenantId: string;
    id: string;
    status: string;
    contentType: string;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    decision: string | null;
    submittedBy: string;
    platform: string;
    contentPreview: string;
    requiredBy: Date | null;
    assignedPrincipalId: string | null;
    decidedBy: string | null;
    decidedAt: Date | null;
    slaHours: number;
}>;
/**
 * Record a decision on a pre-approval request.
 * Returns null if the request is not found.
 */
export declare function decideRequest(tenantId: string, id: string, decision: string, decidedBy: string, status: DecisionStatus): Promise<({
    ambassador: {
        id: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        displayName: string;
        handle: string;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    };
    assignedPrincipal: {
        id: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
        displayName: string;
        email: string;
    } | null;
} & {
    tenantId: string;
    id: string;
    status: string;
    contentType: string;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    decision: string | null;
    submittedBy: string;
    platform: string;
    contentPreview: string;
    requiredBy: Date | null;
    assignedPrincipalId: string | null;
    decidedBy: string | null;
    decidedAt: Date | null;
    slaHours: number;
}) | null>;
//# sourceMappingURL=preApproval.service.d.ts.map