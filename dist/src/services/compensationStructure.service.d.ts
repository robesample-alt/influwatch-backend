export type CreateCompensationStructureInput = {
    promoterId: string;
    campaignId?: string | null;
    compensationForm: string;
    compensationTrigger: string;
    productType: string;
    writtenAgreementRequired: boolean;
    agreementReference?: string | null;
    notes?: string | null;
};
/**
 * Create a new CompensationStructure for a promoter.
 *
 * Classification fields are always computed from compensationForm,
 * compensationTrigger, and productType — never accepted from the caller.
 *
 * If the computed supervisionPosture differs from the promoter's most
 * recent existing structure, a CompensationEvent is written to the audit log.
 */
export declare function createCompensationStructure(input: CreateCompensationStructureInput): Promise<{
    ambassador: {
        id: string;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
    } | null;
    promoterId: string;
}>;
/**
 * Return the most recent CompensationStructure for a promoter.
 * Returns null if none exists.
 */
export declare function getCompensationStructure(promoterId: string): Promise<{
    ambassador: {
        id: string;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
    } | null;
    promoterId: string;
} | null>;
/**
 * Return all CompensationStructures, newest first.
 * Includes ambassador profile for each record.
 */
export declare function listCompensationStructures(): Promise<{
    ambassador: {
        id: string;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
    } | null;
    promoterId: string;
}[]>;
//# sourceMappingURL=compensationStructure.service.d.ts.map