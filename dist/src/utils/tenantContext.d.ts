import { PrismaClient } from '@prisma/client';
export type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
interface TenantContextOptions {
    tenantId: string;
    bypass?: boolean;
    reason?: string;
}
export declare function withTenantContext<T>(opts: TenantContextOptions, fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
export declare function withSystemContext<T>(reason: string, fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
export declare function withBackgroundTenantContext<T>(tenantId: string, jobName: string, fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
export {};
//# sourceMappingURL=tenantContext.d.ts.map