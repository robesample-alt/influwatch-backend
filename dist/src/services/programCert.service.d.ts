/**
 * List all annual program certifications, newest first.
 * Includes signing principal details.
 */
export declare function listProgramCerts(tenantId: string): Promise<({
    principal: {
        id: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
        displayName: string;
        email: string;
        seriesLicense: string | null;
    };
} & {
    tenantId: string;
    findings: string | null;
    id: string;
    certifiedAt: Date;
    principalId: string;
    certificationYear: number;
    rulesCertified: string;
    supervisorySystemAdequate: boolean;
    certificationNote: string | null;
})[]>;
export interface CreateProgramCertInput {
    principalId: string;
    certificationYear: number;
    rulesCertified: string;
    supervisorySystemAdequate: boolean;
    findings?: string | null;
    certificationNote?: string | null;
}
/**
 * Create a new annual supervisory program certification.
 * Returns the created record with principal details.
 */
export declare function createProgramCert(tenantId: string, input: CreateProgramCertInput): Promise<{
    principal: {
        id: string;
        role: import(".prisma/client").$Enums.InternalActorRole;
        displayName: string;
        email: string;
        seriesLicense: string | null;
    };
} & {
    tenantId: string;
    findings: string | null;
    id: string;
    certifiedAt: Date;
    principalId: string;
    certificationYear: number;
    rulesCertified: string;
    supervisorySystemAdequate: boolean;
    certificationNote: string | null;
}>;
//# sourceMappingURL=programCert.service.d.ts.map