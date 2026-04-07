ALTER TABLE "affiliate_links"
  ADD COLUMN "linkStatus" TEXT,
  ADD COLUMN "discoveredInContentId" TEXT;
CREATE INDEX IF NOT EXISTS "affiliate_links_linkStatus_idx" ON "affiliate_links" ("linkStatus");
