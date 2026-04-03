-- CreateTable
CREATE TABLE "legal_holds" (
    "id" TEXT NOT NULL,
    "holdName" TEXT NOT NULL,
    "holdType" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "recordsFrozen" INTEGER NOT NULL DEFAULT 0,
    "placedBy" TEXT NOT NULL,
    "legalAuthority" TEXT NOT NULL,
    "datePlaced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "basis" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "releasedBy" TEXT,
    "releasedAt" TIMESTAMP(3),
    "releaseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_holds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "legal_holds_status_idx" ON "legal_holds"("status");

-- CreateIndex
CREATE INDEX "legal_holds_datePlaced_idx" ON "legal_holds"("datePlaced");
