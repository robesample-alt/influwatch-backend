import { Writable } from 'stream';
export interface EvidencePackageInput {
    tenant: {
        firmName: string;
        crdNumber?: string | null;
        secRegistration?: string | null;
    };
    promoter: {
        id: string;
        displayName: string;
        handle: string;
        primaryPlatform: string;
        riskTier?: string | null;
    };
    compensation?: {
        compensationForm: string;
        compensationTrigger: string;
        productType: string;
        supervisionPosture: string;
        requiresDisclosure: boolean;
    } | null;
    dateRange: {
        from: Date;
        to: Date;
    };
    records: Array<{
        id: string;
        sourcePlatform: string;
        contentType: string;
        sourceUrl: string;
        bodyText: string;
        transcriptText?: string | null;
        postedAt?: Date | null;
        capturedAt: Date;
        archiveStatus: string;
        severity?: string | null;
        compensationPosture?: string | null;
        checksum?: string | null;
        detections: Array<{
            ruleCode: string;
            ruleName: string;
            matchedPhrase?: string | null;
            severity: string;
        }>;
        events: Array<{
            eventType: string;
            eventNote?: string | null;
            actorId?: string | null;
            createdAt: Date;
        }>;
    }>;
    attestations: Array<{
        principalName: string;
        principalRole: string;
        periodLabel: string;
        certifiedAt: Date;
        supervisoryNote?: string | null;
    }>;
    generatedAt: Date;
}
export declare function generateEvidencePdf(input: EvidencePackageInput, output: Writable): Promise<void>;
//# sourceMappingURL=pdfGenerator.d.ts.map