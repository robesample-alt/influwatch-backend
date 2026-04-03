-- ============================================================
-- FUNDUREX — INFLUWATCH
-- Migration: Add compensation_structures, affiliate_links,
-- and compensation_events tables.
-- These were previously created via db push.
-- ============================================================

-- Compensation Structures
CREATE TABLE "compensation_structures" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "campaignId" TEXT,
    "compensationForm" TEXT NOT NULL,
    "compensationTrigger" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "isTransactionBased" BOOLEAN NOT NULL,
    "isSecurityLinked" BOOLEAN NOT NULL,
    "isCompensationVariable" BOOLEAN NOT NULL,
    "requiresDisclosure" BOOLEAN NOT NULL,
    "requiresPrincipalReview" BOOLEAN NOT NULL,
    "supervisionPosture" TEXT NOT NULL,
    "writtenAgreementRequired" BOOLEAN NOT NULL,
    "agreementReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_structures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "compensation_structures_promoterId_idx" ON "compensation_structures"("promoterId");
CREATE INDEX "compensation_structures_supervisionPosture_idx" ON "compensation_structures"("supervisionPosture");

-- Affiliate Links
CREATE TABLE "affiliate_links" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "campaignId" TEXT,
    "compensationStructureId" TEXT,
    "isSecuritiesOffering" BOOLEAN NOT NULL DEFAULT false,
    "offeringType" TEXT,
    "linkType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "affiliate_links_promoterId_idx" ON "affiliate_links"("promoterId");
CREATE INDEX "affiliate_links_active_idx" ON "affiliate_links"("active");

-- Compensation Events
CREATE TABLE "compensation_events" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "previousPosture" TEXT NOT NULL,
    "newPosture" TEXT NOT NULL,
    "reason" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compensation_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "compensation_events_promoterId_idx" ON "compensation_events"("promoterId");
CREATE INDEX "compensation_events_createdAt_idx" ON "compensation_events"("createdAt");
