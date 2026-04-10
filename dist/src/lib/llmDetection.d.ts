import type { Severity } from '@prisma/client';
import { type LlmRuleCode } from './llmDetection.constants';
export interface LlmDetectionInput {
    bodyText: string;
    transcriptText?: string | null;
    supervisionPosture: string;
    compensationForm: string;
    isTransactionBased: boolean;
    isSecurityLinked: boolean;
    tenantType?: string;
}
export interface LlmFinding {
    ruleCode: LlmRuleCode;
    ruleName: string;
    severity: Severity;
    matchedPhrase: string;
    explanation: string;
}
export interface LlmDetectionResult {
    findings: LlmFinding[];
    rawResponse: string | null;
    latencyMs: number;
    modelId: string;
    error?: string;
}
/**
 * Run LLM contextual detection on a piece of content.
 * Fail-open: returns { findings: [], error } on any failure.
 * Never throws.
 */
export declare function runLlmDetection(input: LlmDetectionInput): Promise<LlmDetectionResult>;
//# sourceMappingURL=llmDetection.d.ts.map