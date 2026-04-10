-- Promoter pre-approval submissions from the portal

CREATE TABLE "promoter_submissions" (
  "id"           TEXT PRIMARY KEY,
  "tenantId"     TEXT NOT NULL,
  "ambassadorId" TEXT NOT NULL,
  "platform"     TEXT NOT NULL,
  "contentType"  TEXT NOT NULL,
  "draftText"    TEXT,
  "url"          TEXT,
  "notes"        TEXT,
  "status"       TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedBy"   TEXT,
  "reviewedAt"   TIMESTAMPTZ,
  "reviewNotes"  TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "promoter_submissions_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "promoter_submissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "promoter_submissions_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "internal_actors"("id") ON DELETE SET NULL
);

CREATE INDEX "promoter_submissions_tenantId_idx" ON "promoter_submissions"("tenantId");
CREATE INDEX "promoter_submissions_ambassadorId_idx" ON "promoter_submissions"("ambassadorId");
CREATE INDEX "promoter_submissions_status_idx" ON "promoter_submissions"("status");

ALTER TABLE "promoter_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promoter_submissions" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "promoter_submissions"
  FOR ALL USING (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  )
  WITH CHECK (
    is_rls_bypass() OR "tenantId" = current_tenant_id()
  );

GRANT ALL PRIVILEGES ON "promoter_submissions" TO iw_app;
