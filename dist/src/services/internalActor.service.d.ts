import { InternalActorRole, InternalActorStatus } from '@prisma/client';
/**
 * List all internal actors. Optionally filter by role or status.
 */
export declare function listInternalActors(opts?: {
    role?: InternalActorRole;
    status?: InternalActorStatus;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    status: import(".prisma/client").$Enums.InternalActorStatus;
    email: string;
    role: import(".prisma/client").$Enums.InternalActorRole;
    seriesLicense: string | null;
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
}[]>;
/**
 * List only supervisory-capable actors (REGISTERED_PRINCIPAL + DESIGNATED_SUPERVISOR).
 * Used by the Register Promoter dropdown and assignment patch endpoint.
 */
export declare function listSupervisors(): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    status: import(".prisma/client").$Enums.InternalActorStatus;
    email: string;
    role: import(".prisma/client").$Enums.InternalActorRole;
    seriesLicense: string | null;
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
}[]>;
/**
 * Fetch a single internal actor by id.
 */
export declare function getInternalActorById(id: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    status: import(".prisma/client").$Enums.InternalActorStatus;
    email: string;
    role: import(".prisma/client").$Enums.InternalActorRole;
    seriesLicense: string | null;
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
} | null>;
//# sourceMappingURL=internalActor.service.d.ts.map