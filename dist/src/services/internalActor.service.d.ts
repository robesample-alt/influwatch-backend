import { InternalActorRole, InternalActorStatus } from '@prisma/client';
/**
 * List all internal actors. Optionally filter by role or status.
 */
export declare function listInternalActors(tenantId: string, opts?: {
    role?: InternalActorRole;
    status?: InternalActorStatus;
}): Promise<{
    id: string;
    role: import(".prisma/client").$Enums.InternalActorRole;
    status: import(".prisma/client").$Enums.InternalActorStatus;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    email: string;
    seriesLicense: string | null;
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
}[]>;
/**
 * List only supervisory-capable actors (REGISTERED_PRINCIPAL + DESIGNATED_SUPERVISOR).
 * Used by the Register Promoter dropdown and assignment patch endpoint.
 */
export declare function listSupervisors(tenantId: string): Promise<{
    id: string;
    role: import(".prisma/client").$Enums.InternalActorRole;
    status: import(".prisma/client").$Enums.InternalActorStatus;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    email: string;
    seriesLicense: string | null;
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
}[]>;
/**
 * Fetch a single internal actor by id.
 */
export declare function getInternalActorById(tenantId: string, id: string): Promise<{
    id: string;
    role: import(".prisma/client").$Enums.InternalActorRole;
    status: import(".prisma/client").$Enums.InternalActorStatus;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    email: string;
    seriesLicense: string | null;
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
} | null>;
//# sourceMappingURL=internalActor.service.d.ts.map