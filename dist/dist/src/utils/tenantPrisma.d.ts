/**
 * Wraps every model query so that app.tenant_id is set on the
 * same connection via an interactive transaction.
 *
 * This is the ONLY safe way to enforce RLS with Prisma's
 * connection pooling. A plain SET followed by a query can
 * land on different connections.
 *
 * The returned object proxies all Prisma model operations
 * through withTenantContext.
 */
export declare function createTenantPrisma(tenantId: string): {
    /** Run multiple queries in a single tenant-scoped transaction */
    $transaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
    /** Raw query with tenant context */
    $queryRaw: (query: TemplateStringsArray | import("@prisma/client/runtime/library").Sql, ...values: any[]) => Promise<any>;
    /** Raw execute with tenant context */
    $executeRaw: (query: TemplateStringsArray | import("@prisma/client/runtime/library").Sql, ...values: any[]) => Promise<any>;
    tenantId: string;
};
//# sourceMappingURL=tenantPrisma.d.ts.map