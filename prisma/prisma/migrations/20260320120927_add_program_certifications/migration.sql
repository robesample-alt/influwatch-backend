-- CreateTable
CREATE TABLE "program_certifications" (
    "id" TEXT NOT NULL,
    "principalId" TEXT NOT NULL,
    "certificationYear" INTEGER NOT NULL,
    "certifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rulesCertified" TEXT NOT NULL,
    "supervisorySystemAdequate" BOOLEAN NOT NULL,
    "findings" TEXT,
    "certificationNote" TEXT,

    CONSTRAINT "program_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_certifications_principalId_idx" ON "program_certifications"("principalId");

-- CreateIndex
CREATE INDEX "program_certifications_certificationYear_idx" ON "program_certifications"("certificationYear");

-- CreateIndex
CREATE INDEX "program_certifications_certifiedAt_idx" ON "program_certifications"("certifiedAt");

-- AddForeignKey
ALTER TABLE "program_certifications" ADD CONSTRAINT "program_certifications_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "internal_actors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
