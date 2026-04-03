-- ============================================================
-- FUNDUREX — INFLUWATCH
-- Migration: Row Level Security (RLS) for tenant isolation
--
-- Defense-in-depth: even if application code has a bug,
-- the database will refuse cross-tenant reads/writes.
--
-- Uses PostgreSQL session variable `app.tenant_id` set
-- per-request by the application layer.
-- ============================================================

-- ─────────────────────────────────────────
-- 1. Create a non-superuser application role.
--    PostgreSQL superusers ALWAYS bypass RLS, even with
--    FORCE ROW LEVEL SECURITY. The only way to enforce RLS
--    is to connect as a non-superuser role.
--
--    This creates `iw_app` with LOGIN and grants it access
--    to all tables. Prisma should connect as this role.
--    Password is set via environment variable at deploy time.
-- ─────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'iw_app') THEN
    CREATE ROLE iw_app LOGIN PASSWORD 'changeme_at_deploy';
  END IF;
END
$$;

-- Grant schema + table access to the app role
GRANT USAGE ON SCHEMA public TO iw_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO iw_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO iw_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO iw_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO iw_app;

-- ─────────────────────────────────────────
-- 2. Helper function: returns the current tenant ID from session.
--    Returns NULL if not set — policies will block all rows.
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true);  -- true = return NULL if not set
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────
-- 3. Helper function: check if current session is in
--    super-admin bypass mode. Used by policies to allow
--    cross-tenant access when explicitly enabled.
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_rls_bypass() RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(current_setting('app.rls_bypass', true), 'false') = 'true';
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────
-- 4. Enable RLS + FORCE RLS on all tenant-scoped tables.
--    FORCE ensures RLS applies even to table owners / superusers.
-- ─────────────────────────────────────────

-- internal_actors
ALTER TABLE "internal_actors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "internal_actors" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "internal_actors"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- ambassador_profiles
ALTER TABLE "ambassador_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ambassador_profiles" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ambassador_profiles"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- promoter_contracts
ALTER TABLE "promoter_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promoter_contracts" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "promoter_contracts"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- campaigns
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "campaigns"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- content_records
ALTER TABLE "content_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_records" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "content_records"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- content_media_assets
ALTER TABLE "content_media_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_media_assets" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "content_media_assets"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- archive_event_logs
ALTER TABLE "archive_event_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "archive_event_logs" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "archive_event_logs"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- supervisory_attestations
ALTER TABLE "supervisory_attestations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supervisory_attestations" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "supervisory_attestations"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- program_certifications
ALTER TABLE "program_certifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "program_certifications" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "program_certifications"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- tenant_config
ALTER TABLE "tenant_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_config" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "tenant_config"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- legal_holds
ALTER TABLE "legal_holds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "legal_holds" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "legal_holds"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- evidence_exports
ALTER TABLE "evidence_exports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evidence_exports" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "evidence_exports"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- pre_approval_requests
ALTER TABLE "pre_approval_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pre_approval_requests" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "pre_approval_requests"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- tail_periods
ALTER TABLE "tail_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tail_periods" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "tail_periods"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- detection_records
ALTER TABLE "detection_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "detection_records" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "detection_records"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- compensation_structures
ALTER TABLE "compensation_structures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compensation_structures" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "compensation_structures"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- affiliate_links
ALTER TABLE "affiliate_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "affiliate_links" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "affiliate_links"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- compensation_events
ALTER TABLE "compensation_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compensation_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "compensation_events"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- ─────────────────────────────────────────
-- 5. The `tenants` table itself does NOT get tenant RLS.
--    It's the root identity table — the login flow needs
--    to look up tenants by slug before a tenant context exists.
--    Access control is handled at the application layer.
-- ─────────────────────────────────────────

-- ─────────────────────────────────────────
-- 6. Prisma migration table exclusion.
--    _prisma_migrations is owned by Prisma and must remain
--    accessible without tenant context. No RLS applied.
-- ─────────────────────────────────────────
