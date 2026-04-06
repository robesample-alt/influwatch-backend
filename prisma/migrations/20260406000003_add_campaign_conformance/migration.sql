-- Phase 4 — Campaign Conformance / Drift Hooks
-- Adds governance fields to campaigns and conformance result to content_records.
-- All nullable, additive only.

ALTER TABLE "campaigns"
  ADD COLUMN "allowedCompensationTypes"  TEXT,
  ADD COLUMN "campaignRiskMode"          TEXT,
  ADD COLUMN "requiresPrincipalAtLaunch" BOOLEAN;

ALTER TABLE "content_records"
  ADD COLUMN "compensationMismatchWithCampaign" BOOLEAN,
  ADD COLUMN "campaignConformanceSummary"       TEXT;
