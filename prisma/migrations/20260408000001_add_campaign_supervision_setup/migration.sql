-- Campaign Supervision Setup Layer

-- Extend CampaignStatus enum
ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

-- Campaign Promoters — explicit promoter assignments per campaign
CREATE TABLE "campaign_promoters" (
  "id"                      TEXT NOT NULL,
  "tenantId"                TEXT NOT NULL,
  "campaignId"              TEXT NOT NULL,
  "promoterId"              TEXT NOT NULL,
  "compensationStructureId" TEXT NOT NULL,
  "status"                  TEXT NOT NULL DEFAULT 'ACTIVE',
  "assignedPrincipalId"     TEXT,
  "agreementExecutedAt"     TIMESTAMP(3),
  "agreementReference"      TEXT,
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaign_promoters_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "campaign_promoters_campaignId_promoterId_key" UNIQUE ("campaignId", "promoterId"),
  CONSTRAINT "campaign_promoters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT,
  CONSTRAINT "campaign_promoters_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT,
  CONSTRAINT "campaign_promoters_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "ambassador_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "campaign_promoters_compensationStructureId_fkey" FOREIGN KEY ("compensationStructureId") REFERENCES "compensation_structures"("id") ON DELETE RESTRICT,
  CONSTRAINT "campaign_promoters_assignedPrincipalId_fkey" FOREIGN KEY ("assignedPrincipalId") REFERENCES "internal_actors"("id") ON DELETE SET NULL
);
CREATE INDEX "campaign_promoters_tenantId_idx" ON "campaign_promoters"("tenantId");
CREATE INDEX "campaign_promoters_campaignId_idx" ON "campaign_promoters"("campaignId");

-- Campaign Policies — compensation constraints per campaign
CREATE TABLE "campaign_policies" (
  "id"                        TEXT NOT NULL,
  "tenantId"                  TEXT NOT NULL,
  "campaignId"                TEXT NOT NULL,
  "allowedCompensationTypes"  TEXT NOT NULL,
  "transactionalityTolerance" TEXT NOT NULL DEFAULT 'ALLOW_ALL',
  "requiresPrincipalForAll"   BOOLEAN NOT NULL DEFAULT false,
  "activatedAt"               TIMESTAMP(3),
  "activatedByPrincipalId"    TEXT,
  "activationNote"            TEXT,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaign_policies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "campaign_policies_campaignId_key" UNIQUE ("campaignId"),
  CONSTRAINT "campaign_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT,
  CONSTRAINT "campaign_policies_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT,
  CONSTRAINT "campaign_policies_activatedByPrincipalId_fkey" FOREIGN KEY ("activatedByPrincipalId") REFERENCES "internal_actors"("id") ON DELETE SET NULL
);
CREATE INDEX "campaign_policies_tenantId_idx" ON "campaign_policies"("tenantId");

-- Seed existing campaigns as LIVE (backward compatible)
UPDATE "campaigns" SET "status" = 'LIVE' WHERE "status" = 'FORMATION' OR "status" = 'DSS_EVALUATION';
