-- Add RLS to campaign_promoters and campaign_policies tables

-- campaign_promoters
ALTER TABLE "campaign_promoters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_promoters" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "campaign_promoters"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- campaign_policies
ALTER TABLE "campaign_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_policies" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "campaign_policies"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

-- Grant access to app role
GRANT ALL PRIVILEGES ON "campaign_promoters" TO iw_app;
GRANT ALL PRIVILEGES ON "campaign_policies" TO iw_app;
