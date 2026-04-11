-- Counsel-reviewed acknowledgment of supervisory obligations on
-- compensation structures with elevated supervisory posture.
ALTER TABLE "compensation_structures" ADD COLUMN "acknowledgedAt" TIMESTAMP(3);
ALTER TABLE "compensation_structures" ADD COLUMN "acknowledgedBy" TEXT;
