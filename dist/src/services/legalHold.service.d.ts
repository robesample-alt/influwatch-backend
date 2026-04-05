/**
 * List all legal holds, newest first.
 * Optionally filtered by status (e.g. 'ACTIVE', 'RELEASED').
 */
export declare function listHolds(tenantId: string, status?: string): Promise<{
    tenantId: string;
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    holdName: string;
    holdType: string;
    scope: string;
    recordsFrozen: number;
    placedBy: string;
    legalAuthority: string;
    datePlaced: Date;
    basis: string;
    releasedBy: string | null;
    releasedAt: Date | null;
    releaseReason: string | null;
}[]>;
export interface CreateHoldInput {
    holdName: string;
    holdType: string;
    scope: string;
    recordsFrozen?: number;
    placedBy: string;
    legalAuthority: string;
    datePlaced?: Date;
    basis: string;
    status?: string;
}
/**
 * Create a new legal hold record.
 */
export declare function createHold(tenantId: string, input: CreateHoldInput): Promise<{
    tenantId: string;
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    holdName: string;
    holdType: string;
    scope: string;
    recordsFrozen: number;
    placedBy: string;
    legalAuthority: string;
    datePlaced: Date;
    basis: string;
    releasedBy: string | null;
    releasedAt: Date | null;
    releaseReason: string | null;
}>;
/**
 * Release a legal hold by setting status to RELEASED
 * and recording who released it and why.
 * Returns null if the hold does not exist.
 */
export declare function releaseHold(tenantId: string, id: string, releasedBy: string, releaseReason: string): Promise<{
    tenantId: string;
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    holdName: string;
    holdType: string;
    scope: string;
    recordsFrozen: number;
    placedBy: string;
    legalAuthority: string;
    datePlaced: Date;
    basis: string;
    releasedBy: string | null;
    releasedAt: Date | null;
    releaseReason: string | null;
} | null>;
//# sourceMappingURL=legalHold.service.d.ts.map