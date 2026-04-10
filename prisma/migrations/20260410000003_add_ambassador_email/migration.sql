-- Add email column to ambassador_profiles for promoter portal magic-link login
ALTER TABLE "ambassador_profiles" ADD COLUMN "email" TEXT;

-- Index for fast lookups during magic-link request
CREATE INDEX "ambassador_profiles_email_idx" ON "ambassador_profiles"("email");
