-- Referral code detection + compensated solicitation
ALTER TABLE "affiliate_links"
  ADD COLUMN "referralCode" TEXT;

ALTER TABLE "content_records"
  ADD COLUMN "hasReferralCode" BOOLEAN NOT NULL DEFAULT false;
