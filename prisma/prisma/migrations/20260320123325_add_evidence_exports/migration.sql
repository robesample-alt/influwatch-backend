-- CreateTable
CREATE TABLE "evidence_exports" (
    "id" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRangeStart" TIMESTAMP(3),
    "dateRangeEnd" TIMESTAMP(3),
    "ambassadorId" TEXT,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "packageChecksum" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETE',
    "notes" TEXT,

    CONSTRAINT "evidence_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evidence_exports_generatedBy_idx" ON "evidence_exports"("generatedBy");

-- CreateIndex
CREATE INDEX "evidence_exports_exportType_idx" ON "evidence_exports"("exportType");

-- CreateIndex
CREATE INDEX "evidence_exports_generatedAt_idx" ON "evidence_exports"("generatedAt");

-- CreateIndex
CREATE INDEX "evidence_exports_ambassadorId_idx" ON "evidence_exports"("ambassadorId");
