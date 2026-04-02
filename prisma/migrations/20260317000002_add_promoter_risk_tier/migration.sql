-- Migration: 20260317000002_add_promoter_risk_tier
-- Adds PromoterRiskTier enum and riskTier column to ambassador_profiles.
-- riskTier is nullable — existing rows default to NULL (unclassified).
-- Set at onboarding via POST /ambassadors; updated by compliance staff.

CREATE TYPE "PromoterRiskTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE "ambassador_profiles" ADD COLUMN "riskTier" "PromoterRiskTier";
