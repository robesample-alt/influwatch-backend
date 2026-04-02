export type CompensationInput = {
    compensationForm: string;
    compensationTrigger: string;
    productType: string;
};
export type CompensationClassification = {
    isTransactionBased: boolean;
    isSecurityLinked: boolean;
    isCompensationVariable: boolean;
    requiresDisclosure: boolean;
    requiresPrincipalReview: boolean;
    supervisionPosture: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};
/**
 * Classify a compensation structure into supervision posture
 * and derived compliance flags.
 *
 * Rule order within supervisionPosture is strict —
 * do not reorder without WSP amendment.
 */
export declare function classifyCompensation(input: CompensationInput): CompensationClassification;
//# sourceMappingURL=compensationClassifier.d.ts.map