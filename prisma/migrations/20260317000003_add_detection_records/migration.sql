-- Migration: 20260317000003_add_detection_records
--
-- Adds:
--   1. DetectionMethod enum
--   2. detection_records table with FK to content_records (CASCADE)
--
-- Notes:
--   - "Severity" enum already exists; referenced here without re-creating.
--   - No backfill of existing rows — seed handles application-layer backfill.
--   - Append-only table; no triggers or default-value migrations required.

CREATE TYPE "DetectionMethod" AS ENUM ('PHRASE_MATCH', 'DISCLOSURE_CHECK', 'PATTERN_MATCH');

CREATE TABLE "detection_records" (
    "id"              TEXT NOT NULL,
    "contentRecordId" TEXT NOT NULL,
    "ruleCode"        TEXT NOT NULL,
    "ruleName"        TEXT NOT NULL,
    "matchedPhrase"   TEXT,
    "severity"        "Severity" NOT NULL,
    "detectionMethod" "DetectionMethod" NOT NULL DEFAULT 'PHRASE_MATCH',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detection_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "detection_records_contentRecordId_idx" ON "detection_records"("contentRecordId");
CREATE INDEX "detection_records_ruleCode_idx" ON "detection_records"("ruleCode");

ALTER TABLE "detection_records"
    ADD CONSTRAINT "detection_records_contentRecordId_fkey"
    FOREIGN KEY ("contentRecordId") REFERENCES "content_records"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
