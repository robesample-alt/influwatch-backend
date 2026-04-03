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

import { PrismaClient, Prisma } from '@prisma/client';
import prisma from './prisma';
import logger from './logger';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

interface TenantContextOptions {
  tenantId: string;
  bypass?: boolean;   // super-admin mode — skips tenant_id, sets rls_bypass
  reason?: string;    // required when bypass = true, logged for audit
}

// ─────────────────────────────────────────
// Core: run a callback within a tenant-scoped transaction
//
// This ensures SET and all queries share the same connection.
// Prisma's connection pool means a plain $executeRaw followed
// by a query could land on different connections — the
// interactive $transaction prevents that.
// ─────────────────────────────────────────

export async function withTenantContext<T>(
  opts: TenantContextOptions,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  const { tenantId, bypass = false, reason } = opts;

  if (bypass) {
    if (!reason) {
      throw new Error('RLS bypass requires a reason for audit logging');
    }
    logger.warn({ tenantId, reason }, 'RLS bypass activated');

    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.rls_bypass', 'true', true)`;
      await tx.$executeRaw`SELECT set_config('app.tenant_id', '', true)`;
      return fn(tx);
    }, { timeout: 30000 });
  }

  if (!tenantId) {
    throw new Error('Tenant context required: tenantId must be set before any database query');
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.rls_bypass', 'false', true)`;
    return fn(tx);
  }, { timeout: 30000 });
}

// ─────────────────────────────────────────
// Super-admin: run a function across all tenants
// or for a specific system operation.
//
// MUST provide a reason — it's logged for audit.
// ─────────────────────────────────────────

export async function withSystemContext<T>(
  reason: string,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return withTenantContext({ tenantId: '', bypass: true, reason }, fn);
}

// ─────────────────────────────────────────
// Background job helper: run a function for a specific tenant
// outside of an HTTP request context.
//
// Use this in cron jobs, queue workers, etc.
// ─────────────────────────────────────────

export async function withBackgroundTenantContext<T>(
  tenantId: string,
  jobName: string,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  logger.info({ tenantId, jobName }, 'Background job starting with tenant context');
  return withTenantContext({ tenantId }, fn);
}
