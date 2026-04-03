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
export declare function createCompensationStructure(tenantId: string, input: CreateCompensationStructureInput): Promise<{
    ambassador: any;
    promoterId: string;
}>;
/**
 * Return the most recent CompensationStructure for a promoter.
 * Returns null if none exists.
 */
export declare function getCompensationStructure(tenantId: string, promoterId: string): Promise<{
    ambassador: any;
    promoterId: string;
} | null>;
/**
 * Return all CompensationStructures, newest first.
 * Includes ambassador profile for each record.
 */
export declare function listCompensationStructures(tenantId: string): Promise<{
    ambassador: any;
    promoterId: string;
}[]>;
//# sourceMappingURL=compensationStructure.service.d.ts.map