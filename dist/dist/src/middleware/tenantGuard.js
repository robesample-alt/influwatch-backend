"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Middleware — Tenant Guard (RLS context)
//
// Runs after `authenticate` middleware.
// 1. Verifies the tenant exists and is ACTIVE
// 2. Attaches a tenant-scoped Prisma client to req
//
// IMPORTANT: This middleware does NOT set app.tenant_id on
// the shared Prisma client. That is unsafe with connection
// pooling (a SET on one connection could be used by a
// different request). Instead, it provides req.tenantPrisma
// which is a Prisma interactive transaction client that
// guarantees SET + queries share the same connection.
//
// Route handlers should use req.tenantPrisma for queries,
// OR use withTenantContext() from tenantContext.ts.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantGuard = tenantGuard;
const prisma_1 = __importDefault(require("../utils/prisma"));
// Cache tenant status for 60s to avoid hitting DB on every request.
const tenantStatusCache = new Map();
const CACHE_TTL_MS = 60000;
async function tenantGuard(req, res, next) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
        res.status(401).json({ error: 'Missing tenant context' });
        return;
    }
    // Check tenant status (cached).
    // The `tenants` table has no RLS — safe to query without tenant context.
    const cached = tenantStatusCache.get(tenantId);
    let status;
    if (cached && cached.expiresAt > Date.now()) {
        status = cached.status;
    }
    else {
        const tenant = await prisma_1.default.$queryRaw `
      SELECT "status" FROM "tenants" WHERE "id" = ${tenantId} LIMIT 1
    `;
        if (!tenant.length) {
            res.status(403).json({ error: 'Tenant not found' });
            return;
        }
        status = tenant[0].status;
        tenantStatusCache.set(tenantId, { status, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    if (status !== 'ACTIVE') {
        res.status(403).json({ error: 'Tenant account is not active' });
        return;
    }
    // Tenant is valid and active. Service layer is responsible for
    // setting tenant context using withTenantContext() or the
    // $transaction pattern before querying RLS-protected tables.
    //
    // The tenantGuard's role is defense: reject requests with
    // missing/invalid/inactive tenants before they reach routes.
    next();
}
//# sourceMappingURL=tenantGuard.js.map