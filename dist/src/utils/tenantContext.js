"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Tenant Context — RLS integration for Prisma
//
// Sets the PostgreSQL session variable `app.tenant_id` before
// every query so that Row Level Security policies enforce
// tenant isolation at the database layer.
//
// Uses Prisma's $transaction with interactive mode to guarantee
// the SET and the queries run on the same connection.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTenantContext = withTenantContext;
exports.withSystemContext = withSystemContext;
exports.withBackgroundTenantContext = withBackgroundTenantContext;
const prisma_1 = __importDefault(require("./prisma"));
const logger_1 = __importDefault(require("./logger"));
// ─────────────────────────────────────────
// Core: run a callback within a tenant-scoped transaction
//
// This ensures SET and all queries share the same connection.
// Prisma's connection pool means a plain $executeRaw followed
// by a query could land on different connections — the
// interactive $transaction prevents that.
// ─────────────────────────────────────────
async function withTenantContext(opts, fn) {
    const { tenantId, bypass = false, reason } = opts;
    if (bypass) {
        if (!reason) {
            throw new Error('RLS bypass requires a reason for audit logging');
        }
        logger_1.default.warn({ tenantId, reason }, 'RLS bypass activated');
        return prisma_1.default.$transaction(async (tx) => {
            await tx.$executeRaw `SELECT set_config('app.rls_bypass', 'true', true)`;
            await tx.$executeRaw `SELECT set_config('app.tenant_id', '', true)`;
            return fn(tx);
        }, { timeout: 30000 });
    }
    if (!tenantId) {
        throw new Error('Tenant context required: tenantId must be set before any database query');
    }
    return prisma_1.default.$transaction(async (tx) => {
        await tx.$executeRaw `SELECT set_config('app.tenant_id', ${tenantId}, true)`;
        await tx.$executeRaw `SELECT set_config('app.rls_bypass', 'false', true)`;
        return fn(tx);
    }, { timeout: 30000 });
}
// ─────────────────────────────────────────
// Super-admin: run a function across all tenants
// or for a specific system operation.
//
// MUST provide a reason — it's logged for audit.
// ─────────────────────────────────────────
async function withSystemContext(reason, fn) {
    return withTenantContext({ tenantId: '', bypass: true, reason }, fn);
}
// ─────────────────────────────────────────
// Background job helper: run a function for a specific tenant
// outside of an HTTP request context.
//
// Use this in cron jobs, queue workers, etc.
// ─────────────────────────────────────────
async function withBackgroundTenantContext(tenantId, jobName, fn) {
    logger_1.default.info({ tenantId, jobName }, 'Background job starting with tenant context');
    return withTenantContext({ tenantId }, fn);
}
//# sourceMappingURL=tenantContext.js.map