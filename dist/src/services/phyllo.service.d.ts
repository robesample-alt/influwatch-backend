export declare function createPhylloUser(tenantId: string, ambassadorId: string, displayName: string): Promise<any>;
export declare function createSdkToken(tenantId: string, ambassadorId: string): Promise<{
    token: any;
    phylloUserId: string | null;
}>;
export declare function linkPhylloAccount(tenantId: string, ambassadorId: string, phylloAccountId: string): Promise<void>;
export declare function fetchPhylloContent(phylloAccountId: string): Promise<any>;
export declare function findAmbassadorByPhylloAccount(phylloAccountId: string): Promise<any>;
//# sourceMappingURL=phyllo.service.d.ts.map