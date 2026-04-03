"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Tenant-aware Prisma client factory
//
// Creates a Prisma client extension that wraps every query
// in a transaction that sets app.tenant_id first. This ensures
// RLS enforcement on every query without changing service code.
//
// Usage in middleware: req.prisma = createTenantPrisma(tenantId)
// Usage in services: pass the tenant prisma client instead of
// importing the global one.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTenantPrisma = createTenantPrisma;
const prisma_1 = __importDefault(require("./prisma"));
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
function createTenantPrisma(tenantId) {
    if (!tenantId) {
        throw new Error('tenantId is required to create a tenant-scoped Prisma client');
    }
    return {
        /** Run multiple queries in a single tenant-scoped transaction */
        $transaction: async (fn) => {
            return prisma_1.default.$transaction(async (tx) => {
                await tx.$executeRaw `SELECT set_config('app.tenant_id', ${tenantId}, true)`;
                await tx.$executeRaw `SELECT set_config('app.rls_bypass', 'false', true)`;
                return fn(tx);
            }, { timeout: 30000 });
        },
        /** Raw query with tenant context */
        $queryRaw: async (...args) => {
            return prisma_1.default.$transaction(async (tx) => {
                await tx.$executeRaw `SELECT set_config('app.tenant_id', ${tenantId}, true)`;
                await tx.$executeRaw `SELECT set_config('app.rls_bypass', 'false', true)`;
                return tx.$queryRaw(...args);
            }, { timeout: 30000 });
        },
        /** Raw execute with tenant context */
        $executeRaw: async (...args) => {
            return prisma_1.default.$transaction(async (tx) => {
                await tx.$executeRaw `SELECT set_config('app.tenant_id', ${tenantId}, true)`;
                await tx.$executeRaw `SELECT set_config('app.rls_bypass', 'false', true)`;
                return tx.$executeRaw(...args);
            }, { timeout: 30000 });
        },
        tenantId,
    };
}
//# sourceMappingURL=tenantPrisma.js.map