-- CreateTable
CREATE TABLE "pre_approval_requests" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "contentPreview" TEXT NOT NULL,
    "requiredBy" TIMESTAMP(3),
    "assignedPrincipalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decision" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "slaHours" INTEGER NOT NULL DEFAULT 48,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pre_approval_requests_ambassadorId_idx" ON "pre_approval_requests"("ambassadorId");

-- CreateIndex
CREATE INDEX "pre_approval_requests_status_idx" ON "pre_approval_requests"("status");

-- CreateIndex
CREATE INDEX "pre_approval_requests_assignedPrincipalId_idx" ON "pre_approval_requests"("assignedPrincipalId");

-- CreateIndex
CREATE INDEX "pre_approval_requests_createdAt_idx" ON "pre_approval_requests"("createdAt");

-- AddForeignKey
ALTER TABLE "pre_approval_requests" ADD CONSTRAINT "pre_approval_requests_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_approval_requests" ADD CONSTRAINT "pre_approval_requests_assignedPrincipalId_fkey" FOREIGN KEY ("assignedPrincipalId") REFERENCES "internal_actors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
