/**
 * List all legal holds, newest first.
 * Optionally filtered by status (e.g. 'ACTIVE', 'RELEASED').
 */
export declare function listHolds(status?: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
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
export declare function createHold(input: CreateHoldInput): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
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
export declare function releaseHold(id: string, releasedBy: string, releaseReason: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
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