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

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// Cache tenant status for 60s to avoid hitting DB on every request.
const tenantStatusCache = new Map<string, { status: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

export async function tenantGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    res.status(401).json({ error: 'Missing tenant context' });
    return;
  }

  // Check tenant status (cached).
  // The `tenants` table has no RLS — safe to query without tenant context.
  const cached = tenantStatusCache.get(tenantId);
  let status: string;

  if (cached && cached.expiresAt > Date.now()) {
    status = cached.status;
  } else {
    const tenant = await prisma.$queryRaw<Array<{ status: string }>>`
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
