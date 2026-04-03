-- ============================================================
-- FUNDUREX — INFLUWATCH
-- Migration: Add multi-tenant architecture
--
-- 1. Create Tenant table + enum
-- 2. Insert default tenant from existing TenantConfig
-- 3. Add tenantId (nullable) to all 18 tables
-- 4. Backfill all rows with default tenant ID
-- 5. Make tenantId NOT NULL
-- 6. Add FK constraints + indexes
-- 7. Update unique constraints for tenant scope
-- ============================================================

-- 1. Create TenantStatus enum and tenants table
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "firmName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "crdNumber" TEXT,
    "secRegistration" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- 2. Insert default tenant (pull firm identity from existing TenantConfig if it exists)
INSERT INTO "tenants" ("id", "firmName", "slug", "crdNumber", "secRegistration", "status", "updatedAt")
SELECT
    'DEFAULT_TENANT',
    COALESCE("firmName", 'Default Firm'),
    'default',
    "crdNumber",
    "secRegistration",
    'ACTIVE',
    NOW()
FROM "tenant_config"
LIMIT 1;

-- If no tenant_config row exists, insert a fallback default tenant
INSERT INTO "tenants" ("id", "firmName", "slug", "status", "updatedAt")
SELECT 'DEFAULT_TENANT', 'Default Firm', 'default', 'ACTIVE', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'DEFAULT_TENANT');

-- 3. Add nullable tenantId to all tables
ALTER TABLE "internal_actors" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "ambassador_profiles" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "promoter_contracts" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "content_records" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "content_media_assets" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "archive_event_logs" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "supervisory_attestations" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "program_certifications" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "legal_holds" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "evidence_exports" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "pre_approval_requests" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "tail_periods" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "detection_records" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "compensation_structures" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "affiliate_links" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "compensation_events" ADD COLUMN "tenantId" TEXT;

-- 4. Backfill all existing rows with default tenant
UPDATE "internal_actors" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "ambassador_profiles" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "promoter_contracts" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "campaigns" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "content_records" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "content_media_assets" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "archive_event_logs" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "supervisory_attestations" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "program_certifications" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "legal_holds" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "evidence_exports" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "pre_approval_requests" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "tail_periods" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "detection_records" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "compensation_structures" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "affiliate_links" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
UPDATE "compensation_events" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;

-- 5. Make tenantId NOT NULL
ALTER TABLE "internal_actors" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ambassador_profiles" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "promoter_contracts" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "campaigns" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "content_records" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "content_media_assets" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "archive_event_logs" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "supervisory_attestations" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "program_certifications" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "legal_holds" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "evidence_exports" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "pre_approval_requests" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "tail_periods" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "detection_records" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "compensation_structures" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "affiliate_links" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "compensation_events" ALTER COLUMN "tenantId" SET NOT NULL;

-- 6. Add FK constraints
ALTER TABLE "internal_actors" ADD CONSTRAINT "internal_actors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ambassador_profiles" ADD CONSTRAINT "ambassador_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promoter_contracts" ADD CONSTRAINT "promoter_contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_records" ADD CONSTRAINT "content_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_media_assets" ADD CONSTRAINT "content_media_assets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "archive_event_logs" ADD CONSTRAINT "archive_event_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supervisory_attestations" ADD CONSTRAINT "supervisory_attestations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_certifications" ADD CONSTRAINT "program_certifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidence_exports" ADD CONSTRAINT "evidence_exports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pre_approval_requests" ADD CONSTRAINT "pre_approval_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tail_periods" ADD CONSTRAINT "tail_periods_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "detection_records" ADD CONSTRAINT "detection_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compensation_structures" ADD CONSTRAINT "compensation_structures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compensation_events" ADD CONSTRAINT "compensation_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Add tenantId indexes
CREATE INDEX "internal_actors_tenantId_idx" ON "internal_actors"("tenantId");
CREATE INDEX "ambassador_profiles_tenantId_idx" ON "ambassador_profiles"("tenantId");
CREATE INDEX "promoter_contracts_tenantId_idx" ON "promoter_contracts"("tenantId");
CREATE INDEX "campaigns_tenantId_idx" ON "campaigns"("tenantId");
CREATE INDEX "content_records_tenantId_idx" ON "content_records"("tenantId");
CREATE INDEX "content_media_assets_tenantId_idx" ON "content_media_assets"("tenantId");
CREATE INDEX "archive_event_logs_tenantId_idx" ON "archive_event_logs"("tenantId");
CREATE INDEX "supervisory_attestations_tenantId_idx" ON "supervisory_attestations"("tenantId");
CREATE INDEX "program_certifications_tenantId_idx" ON "program_certifications"("tenantId");
CREATE INDEX "legal_holds_tenantId_idx" ON "legal_holds"("tenantId");
CREATE INDEX "evidence_exports_tenantId_idx" ON "evidence_exports"("tenantId");
CREATE INDEX "pre_approval_requests_tenantId_idx" ON "pre_approval_requests"("tenantId");
CREATE INDEX "tail_periods_tenantId_idx" ON "tail_periods"("tenantId");
CREATE INDEX "detection_records_tenantId_idx" ON "detection_records"("tenantId");
CREATE INDEX "compensation_structures_tenantId_idx" ON "compensation_structures"("tenantId");
CREATE INDEX "affiliate_links_tenantId_idx" ON "affiliate_links"("tenantId");
CREATE INDEX "compensation_events_tenantId_idx" ON "compensation_events"("tenantId");

-- 8. Update unique constraints for tenant scope
-- InternalActor: email unique per tenant (drop global unique, add composite)
ALTER TABLE "internal_actors" DROP CONSTRAINT IF EXISTS "internal_actors_email_key";
CREATE UNIQUE INDEX "internal_actors_tenantId_email_key" ON "internal_actors"("tenantId", "email");

-- PromoterContract: contractId unique per tenant (drop global unique, add composite)
ALTER TABLE "promoter_contracts" DROP CONSTRAINT IF EXISTS "promoter_contracts_contractId_key";
CREATE UNIQUE INDEX "promoter_contracts_tenantId_contractId_key" ON "promoter_contracts"("tenantId", "contractId");

-- 9. Update TenantConfig: add tenantId, migrate existing data
ALTER TABLE "tenant_config" ADD COLUMN "tenantId" TEXT;
UPDATE "tenant_config" SET "tenantId" = 'DEFAULT_TENANT' WHERE "tenantId" IS NULL;
ALTER TABLE "tenant_config" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "tenant_config" ADD CONSTRAINT "tenant_config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "tenant_config_tenantId_key" ON "tenant_config"("tenantId");

-- 10. Remove firm identity columns from TenantConfig (now on Tenant)
ALTER TABLE "tenant_config" DROP COLUMN IF EXISTS "firmName";
ALTER TABLE "tenant_config" DROP COLUMN IF EXISTS "crdNumber";
ALTER TABLE "tenant_config" DROP COLUMN IF EXISTS "secRegistration";
ALTER TABLE "tenant_config" DROP COLUMN IF EXISTS "primaryContact";
