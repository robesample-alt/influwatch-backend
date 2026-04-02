-- CreateTable
CREATE TABLE "tenant_config" (
    "id" TEXT NOT NULL,
    "firmName" TEXT NOT NULL,
    "crdNumber" TEXT,
    "secRegistration" TEXT,
    "primaryContact" TEXT,
    "pollIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "historicalBackfillDays" INTEGER NOT NULL DEFAULT 30,
    "authErrorAlertThreshold" INTEGER NOT NULL DEFAULT 3,
    "gapReportThreshold" INTEGER NOT NULL DEFAULT 2,
    "postContractTailDays" INTEGER NOT NULL DEFAULT 60,
    "slaThresholdCritical" INTEGER NOT NULL DEFAULT 24,
    "slaThresholdHigh" INTEGER NOT NULL DEFAULT 48,
    "slaThresholdMedium" INTEGER NOT NULL DEFAULT 120,
    "slaThresholdLow" INTEGER NOT NULL DEFAULT 240,
    "retentionYears" INTEGER NOT NULL DEFAULT 7,
    "objectLockMode" TEXT NOT NULL DEFAULT 'COMPLIANCE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_config_pkey" PRIMARY KEY ("id")
);
