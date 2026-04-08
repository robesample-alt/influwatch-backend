-- Add Phyllo integration fields to ambassador_profiles
ALTER TABLE "ambassador_profiles" ADD COLUMN "phylloUserId" TEXT;
ALTER TABLE "ambassador_profiles" ADD COLUMN "phylloAccountId" TEXT;
CREATE INDEX "ambassador_profiles_phylloAccountId_idx" ON "ambassador_profiles"("phylloAccountId");
