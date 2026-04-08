// ============================================================
// FUNDUREX — INFLUWATCH
// RLS Safety Check — verifies all tenant-scoped tables
// have Row Level Security enabled and enforced.
//
// Run at application startup. Fails fast if any table
// is missing RLS, preventing silent data leaks.
// ============================================================

import prisma from './prisma';
import logger from './logger';

// All tables that MUST have RLS enabled.
// This is the authoritative list — if you add a new tenant-scoped
// table, add it here or the startup check will fail.
const RLS_REQUIRED_TABLES = [
  'internal_actors',
  'ambassador_profiles',
  'promoter_contracts',
  'campaigns',
  'content_records',
  'content_media_assets',
  'archive_event_logs',
  'supervisory_attestations',
  'program_certifications',
  'tenant_config',
  'legal_holds',
  'evidence_exports',
  'pre_approval_requests',
  'tail_periods',
  'detection_records',
  'compensation_structures',
  'affiliate_links',
  'compensation_events',
  'campaign_promoters',
  'campaign_policies',
];

interface RlsStatus {
  tablename: string;
  rowsecurity: boolean;
  forcerowsecurity: boolean;
}

export async function verifyRls(): Promise<void> {
  logger.info('Verifying Row Level Security on all tenant-scoped tables...');

  const results = await prisma.$queryRaw<RlsStatus[]>`
    SELECT
      c.relname AS "tablename",
      c.relrowsecurity AS "rowsecurity",
      c.relforcerowsecurity AS "forcerowsecurity"
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname = ANY(${RLS_REQUIRED_TABLES})
    ORDER BY c.relname
  `;

  const missing: string[] = [];
  const notForced: string[] = [];

  for (const table of RLS_REQUIRED_TABLES) {
    const row = results.find(r => r.tablename === table);

    if (!row) {
      missing.push(`${table} (table not found)`);
      continue;
    }

    if (!row.rowsecurity) {
      missing.push(table);
    } else if (!row.forcerowsecurity) {
      notForced.push(table);
    }
  }

  if (missing.length > 0) {
    const msg = `RLS NOT ENABLED on: ${missing.join(', ')}`;
    logger.fatal(msg);
    throw new Error(`SECURITY: ${msg}. Cannot start without RLS on all tenant-scoped tables.`);
  }

  if (notForced.length > 0) {
    const msg = `RLS enabled but NOT FORCED on: ${notForced.join(', ')}`;
    logger.fatal(msg);
    throw new Error(`SECURITY: ${msg}. FORCE ROW LEVEL SECURITY required on all tenant-scoped tables.`);
  }

  // Verify policies exist on each table
  const policies = await prisma.$queryRaw<Array<{ tablename: string; policyname: string }>>`
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(${RLS_REQUIRED_TABLES})
  `;

  const tablesWithPolicies = new Set(policies.map(p => p.tablename));
  const noPolicies = RLS_REQUIRED_TABLES.filter(t => !tablesWithPolicies.has(t));

  if (noPolicies.length > 0) {
    const msg = `RLS enabled but NO POLICIES on: ${noPolicies.join(', ')}`;
    logger.fatal(msg);
    throw new Error(`SECURITY: ${msg}. Tables with RLS but no policies will block ALL access.`);
  }

  logger.info(`RLS verified: ${RLS_REQUIRED_TABLES.length} tables protected with FORCE ROW LEVEL SECURITY`);
}
