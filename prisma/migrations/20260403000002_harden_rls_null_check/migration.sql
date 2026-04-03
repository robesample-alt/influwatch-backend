-- ============================================================
-- FUNDUREX — INFLUWATCH
-- Migration: Harden RLS policies with explicit NULL check
--
-- Ensures tenant_id must be non-NULL AND match the row.
-- Protects against any edge case where NULL comparison
-- could silently pass.
-- ============================================================

-- Drop and recreate all tenant_isolation policies with explicit NULL guard.
-- Pattern: bypass OR (tenant_id IS NOT NULL AND matches row)

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'internal_actors', 'ambassador_profiles', 'promoter_contracts',
    'campaigns', 'content_records', 'content_media_assets',
    'archive_event_logs', 'supervisory_attestations', 'program_certifications',
    'tenant_config', 'legal_holds', 'evidence_exports',
    'pre_approval_requests', 'tail_periods', 'detection_records',
    'compensation_structures', 'affiliate_links', 'compensation_events'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I FOR ALL '
      'USING (is_rls_bypass() OR (current_tenant_id() IS NOT NULL AND "tenantId" = current_tenant_id())) '
      'WITH CHECK (is_rls_bypass() OR (current_tenant_id() IS NOT NULL AND "tenantId" = current_tenant_id()))',
      tbl
    );
  END LOOP;
END
$$;
