/**
 * List all promoter contracts, newest first.
 * Optionally filtered to a single ambassador.
 */
export declare function listContracts(tenantId: string, ambassadorId?: string): Promise<({
    ambassador: {
        id: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    };
} & {
    tenantId: string;
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    notes: string | null;
    agreementType: string;
    contractId: string;
    signedDate: Date;
    effectiveDate: Date;
    expiryDate: Date | null;
    monitoringConsent: boolean;
    disclosureAck: boolean;
    disclosureRuleEnforced: boolean;
    compensationCap: number | null;
    compensationType: string | null;
    compensationRate: string | null;
})[]>;
/**
 * Return a single contract by its cuid primary key.
 * Returns null if not found.
 */
export declare function getContract(tenantId: string, id: string): Promise<({
    ambassador: {
        id: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    };
} & {
    tenantId: string;
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    notes: string | null;
    agreementType: string;
    contractId: string;
    signedDate: Date;
    effectiveDate: Date;
    expiryDate: Date | null;
    monitoringConsent: boolean;
    disclosureAck: boolean;
    disclosureRuleEnforced: boolean;
    compensationCap: number | null;
    compensationType: string | null;
    compensationRate: string | null;
}) | null>;
export interface CreateContractInput {
    ambassadorId: string;
    agreementType: string;
    contractId: string;
    signedDate: Date;
    effectiveDate: Date;
    expiryDate?: Date | null;
    monitoringConsent?: boolean;
    disclosureAck?: boolean;
    disclosureRuleEnforced?: boolean;
    compensationCap?: number | null;
    compensationType?: string | null;
    compensationRate?: string | null;
    status?: string;
    notes?: string | null;
}
/**
 * Create a new promoter contract.
 * Returns the created record with ambassador details.
 */
export declare function createContract(tenantId: string, input: CreateContractInput): Promise<{
    ambassador: {
        id: string;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        riskTier: import(".prisma/client").$Enums.PromoterRiskTier | null;
    };
} & {
    tenantId: string;
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    notes: string | null;
    agreementType: string;
    contractId: string;
    signedDate: Date;
    effectiveDate: Date;
    expiryDate: Date | null;
    monitoringConsent: boolean;
    disclosureAck: boolean;
    disclosureRuleEnforced: boolean;
    compensationCap: number | null;
    compensationType: string | null;
    compensationRate: string | null;
}>;
//# sourceMappingURL=contract.service.d.ts.map