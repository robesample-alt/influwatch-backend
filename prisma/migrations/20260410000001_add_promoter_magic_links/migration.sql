-- Promoter magic link auth tokens

CREATE TABLE "promoter_magic_links" (
  "id"           TEXT PRIMARY KEY,
  "ambassadorId" TEXT NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "tokenHash"    TEXT NOT NULL,
  "expiresAt"    TIMESTAMPTZ NOT NULL,
  "usedAt"       TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "promoter_magic_links_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "promoter_magic_links_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE INDEX "promoter_magic_links_tokenHash_idx" ON "promoter_magic_links"("tokenHash");
CREATE INDEX "promoter_magic_links_ambassadorId_idx" ON "promoter_magic_links"("ambassadorId");
CREATE INDEX "promoter_magic_links_email_idx" ON "promoter_magic_links"("email");

ALTER TABLE "promoter_magic_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promoter_magic_links" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "promoter_magic_links"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

GRANT ALL PRIVILEGES ON "promoter_magic_links" TO iw_app;
