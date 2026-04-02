-- CreateTable
CREATE TABLE "supervisory_attestations" (
    "id" TEXT NOT NULL,
    "principalId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "promotersInScope" INTEGER NOT NULL,
    "certifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supervisoryNote" TEXT,

    CONSTRAINT "supervisory_attestations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supervisory_attestations_principalId_idx" ON "supervisory_attestations"("principalId");

-- CreateIndex
CREATE INDEX "supervisory_attestations_certifiedAt_idx" ON "supervisory_attestations"("certifiedAt");

-- AddForeignKey
ALTER TABLE "supervisory_attestations" ADD CONSTRAINT "supervisory_attestations_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "internal_actors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
