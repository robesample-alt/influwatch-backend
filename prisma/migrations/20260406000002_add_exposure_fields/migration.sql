-- Phase 2 — Exposure Engine (Log-Only)
-- Adds four nullable columns to content_records for storing
-- the computed exposure classification. These fields are
-- populated at ingestion but do NOT affect routing, queue
-- selection, severity, or archiveStatus in this phase.

ALTER TABLE "content_records"
  ADD COLUMN "exposureLevel"           TEXT,
  ADD COLUMN "requiresPrincipalReview" BOOLEAN,
  ADD COLUMN "exposureReasonCodes"     TEXT,
  ADD COLUMN "exposureSummary"         TEXT;
