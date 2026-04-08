"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// RLS Safety Check — verifies all tenant-scoped tables
// have Row Level Security enabled and enforced.
//
// Run at application startup. Fails fast if any table
// is missing RLS, preventing silent data leaks.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRls = verifyRls;
const prisma_1 = __importDefault(require("./prisma"));
const logger_1 = __importDefault(require("./logger"));
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
async function verifyRls() {
    logger_1.default.info('Verifying Row Level Security on all tenant-scoped tables...');
    const results = await prisma_1.default.$queryRaw `
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
    const missing = [];
    const notForced = [];
    for (const table of RLS_REQUIRED_TABLES) {
        const row = results.find(r => r.tablename === table);
        if (!row) {
            missing.push(`${table} (table not found)`);
            continue;
        }
        if (!row.rowsecurity) {
            missing.push(table);
        }
        else if (!row.forcerowsecurity) {
            notForced.push(table);
        }
    }
    if (missing.length > 0) {
        const msg = `RLS NOT ENABLED on: ${missing.join(', ')}`;
        logger_1.default.fatal(msg);
        throw new Error(`SECURITY: ${msg}. Cannot start without RLS on all tenant-scoped tables.`);
    }
    if (notForced.length > 0) {
        const msg = `RLS enabled but NOT FORCED on: ${notForced.join(', ')}`;
        logger_1.default.fatal(msg);
        throw new Error(`SECURITY: ${msg}. FORCE ROW LEVEL SECURITY required on all tenant-scoped tables.`);
    }
    // Verify policies exist on each table
    const policies = await prisma_1.default.$queryRaw `
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(${RLS_REQUIRED_TABLES})
  `;
    const tablesWithPolicies = new Set(policies.map(p => p.tablename));
    const noPolicies = RLS_REQUIRED_TABLES.filter(t => !tablesWithPolicies.has(t));
    if (noPolicies.length > 0) {
        const msg = `RLS enabled but NO POLICIES on: ${noPolicies.join(', ')}`;
        logger_1.default.fatal(msg);
        throw new Error(`SECURITY: ${msg}. Tables with RLS but no policies will block ALL access.`);
    }
    logger_1.default.info(`RLS verified: ${RLS_REQUIRED_TABLES.length} tables protected with FORCE ROW LEVEL SECURITY`);
}
//# sourceMappingURL=rlsCheck.js.map