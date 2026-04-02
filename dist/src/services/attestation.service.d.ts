export interface CreateAttestationInput {
    principalId: string;
    periodLabel: string;
    periodStart: Date;
    periodEnd: Date;
    promotersInScope: number;
    supervisoryNote?: string;
}
/**
 * Record a formal supervisory attestation.
 * Returns the created record with principal details included.
 * Logs creation to console for Phase 1 audit trail.
 */
export declare function createAttestation(input: CreateAttestationInput): Promise<{
    principal: {
        id: string;
        displayName: string;
        email: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
    };
} & {
    id: string;
    periodLabel: string;
    periodStart: Date;
    periodEnd: Date;
    promotersInScope: number;
    certifiedAt: Date;
    supervisoryNote: string | null;
    principalId: string;
}>;
/**
 * List all supervisory attestations, newest first.
 * Optionally filtered by periodLabel (exact match).
 * Includes principal displayName, email, and role.
 */
export declare function listAttestations(periodLabel?: string): Promise<({
    principal: {
        id: string;
        displayName: string;
        email: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
    };
} & {
    id: string;
    periodLabel: string;
    periodStart: Date;
    periodEnd: Date;
    promotersInScope: number;
    certifiedAt: Date;
    supervisoryNote: string | null;
    principalId: string;
})[]>;
//# sourceMappingURL=attestation.service.d.ts.map