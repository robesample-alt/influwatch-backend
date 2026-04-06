-- Phase 1 — Compensation Schema Precision
-- Adds three nullable String columns to compensation_structures.
-- Nullable so existing rows are not broken; values are computed
-- server-side and backfilled via a separate script/query.
-- No changes to existing columns, constraints, or indexes.

ALTER TABLE "compensation_structures"
  ADD COLUMN "compensationType"      TEXT,
  ADD COLUMN "compensationBasis"     TEXT,
  ADD COLUMN "transactionalityClass" TEXT;
