-- CreateTable
CREATE TABLE "promoter_contracts" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "agreementType" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "signedDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "monitoringConsent" BOOLEAN NOT NULL DEFAULT false,
    "disclosureAck" BOOLEAN NOT NULL DEFAULT false,
    "disclosureRuleEnforced" BOOLEAN NOT NULL DEFAULT true,
    "compensationCap" DOUBLE PRECISION,
    "compensationType" TEXT,
    "compensationRate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promoter_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promoter_contracts_contractId_key" ON "promoter_contracts"("contractId");

-- CreateIndex
CREATE INDEX "promoter_contracts_ambassadorId_idx" ON "promoter_contracts"("ambassadorId");

-- CreateIndex
CREATE INDEX "promoter_contracts_status_idx" ON "promoter_contracts"("status");

-- CreateIndex
CREATE INDEX "promoter_contracts_contractId_idx" ON "promoter_contracts"("contractId");

-- AddForeignKey
ALTER TABLE "promoter_contracts" ADD CONSTRAINT "promoter_contracts_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
