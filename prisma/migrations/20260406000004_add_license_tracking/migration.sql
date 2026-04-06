-- License tracking fields on InternalActor.
-- All nullable, additive only.
ALTER TABLE "internal_actors"
  ADD COLUMN "crdNumber"         TEXT,
  ADD COLUMN "licenseStatus"     TEXT,
  ADD COLUMN "licenseExpiryDate" TIMESTAMP,
  ADD COLUMN "supervisoryScope"  TEXT;
