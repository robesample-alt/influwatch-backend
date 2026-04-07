export interface ContentScenario {
    ambassadorId: string;
    sourcePlatform: string;
    contentType: string;
    campaignId?: string;
    bodyVariants: string[];
    /** Expected risk level for documentation — not used in logic */
    expectedRisk: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    /** Tenant type this scenario is most representative of. ALL = universal. */
    tenantType: 'BD' | 'ISSUER' | 'REG_CF' | 'FINTECH' | 'RIA' | 'ALL';
}
export declare const SCENARIO_POOL: ContentScenario[];
/**
 * Pick N random scenarios from the pool, selecting a random variant
 * for each. Returns ready-to-ingest content record inputs.
 */
export declare function pickRandomScenarios(count: number, tenantType?: string): Array<{
    ambassadorId: string;
    sourcePlatform: string;
    contentType: string;
    campaignId?: string;
    bodyText: string;
    sourceUrl: string;
}>;
//# sourceMappingURL=demoSimulator.d.ts.map