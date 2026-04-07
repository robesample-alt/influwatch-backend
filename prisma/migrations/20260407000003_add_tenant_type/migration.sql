-- Phase A — Tenant Type Foundation
ALTER TABLE "tenants" ADD COLUMN "tenantType" TEXT;

-- Seed existing tenants as BD (broker-dealer)
UPDATE "tenants" SET "tenantType" = 'BD' WHERE "tenantType" IS NULL;
