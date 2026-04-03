// ============================================================
// FUNDUREX — INFLUWATCH
// Route handlers — Authentication (multi-tenant)
//
// POST /api/influwatch/auth/login
// Returns a signed JWT for a valid internal actor.
// Requires tenantSlug to resolve the tenant context.
//
// Note: the `tenants` table has no RLS (it's the root lookup
// table). The `internal_actors` table has RLS, so we must
// set app.tenant_id before querying it.
// ============================================================

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { signToken } from '../utils/auth';

// ─────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, tenantSlug } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  // Resolve tenant — tenants table has no RLS, safe to query directly.
  // If no slug provided, fall back to 'default' for backward compat.
  const slug = tenantSlug || 'default';
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, firmName: true, status: true },
  });

  if (!tenant) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (tenant.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Tenant account is not active' });
    return;
  }

  // Set tenant context for RLS before querying internal_actors.
  // Uses $transaction to guarantee SET and SELECT share the same connection.
  const actor = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenant.id}, true)`;
    await tx.$executeRaw`SELECT set_config('app.rls_bypass', 'false', true)`;

    return tx.internalActor.findFirst({
      where: { tenantId: tenant.id, email },
      select: { id: true, displayName: true, email: true, role: true, status: true, passwordHash: true, tenantId: true },
    });
  });

  if (!actor || !actor.passwordHash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordValid = await bcrypt.compare(password, actor.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ id: actor.id, role: actor.role, email: actor.email, tenantId: actor.tenantId });

  res.status(200).json({
    token,
    actor: {
      id:          actor.id,
      displayName: actor.displayName,
      email:       actor.email,
      role:        actor.role,
      tenantId:    actor.tenantId,
    },
    tenant: {
      id:       tenant.id,
      firmName: tenant.firmName,
    },
  });
}
