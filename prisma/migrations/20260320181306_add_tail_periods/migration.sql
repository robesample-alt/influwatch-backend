-- CreateTable
CREATE TABLE "tail_periods" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "contractEndDate" TIMESTAMP(3) NOT NULL,
    "tailDays" INTEGER NOT NULL,
    "tailStartDate" TIMESTAMP(3) NOT NULL,
    "tailEndDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "riskTier" TEXT,
    "tailType" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "postContractFlags" INTEGER NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "closedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tail_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tail_periods_ambassadorId_idx" ON "tail_periods"("ambassadorId");

-- CreateIndex
CREATE INDEX "tail_periods_status_idx" ON "tail_periods"("status");

-- CreateIndex
CREATE INDEX "tail_periods_tailEndDate_idx" ON "tail_periods"("tailEndDate");

-- AddForeignKey
ALTER TABLE "tail_periods" ADD CONSTRAINT "tail_periods_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
