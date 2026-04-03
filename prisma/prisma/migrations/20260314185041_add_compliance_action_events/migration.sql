-- CreateEnum
CREATE TYPE "AmbassadorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "SourcePlatform" AS ENUM ('YOUTUBE', 'INSTAGRAM', 'TWITTER_X', 'TIKTOK', 'LINKEDIN', 'FACEBOOK', 'TELEGRAM', 'EMAIL', 'PODCAST', 'BLOG', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'SHORT_FORM_VIDEO', 'IMAGE_POST', 'CAROUSEL', 'STORY', 'REEL', 'TWEET', 'THREAD', 'LONG_FORM_POST', 'EMAIL_BLAST', 'PODCAST_EPISODE', 'LIVE_STREAM', 'NEWSLETTER', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('FORMATION', 'DSS_EVALUATION', 'APPROVED', 'LIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('INVESTMENT', 'FINTECH', 'FINANCIAL_PRODUCT', 'PLATFORM_LAUNCH');

-- CreateEnum
CREATE TYPE "ArchiveStatus" AS ENUM ('CAPTURED', 'PENDING_REVIEW', 'REVIEWED', 'ESCALATED', 'INCIDENT_OPENED', 'CLOSED', 'PURGED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('VIDEO_FILE', 'THUMBNAIL', 'SCREENSHOT', 'AUDIO_FILE', 'ATTACHMENT', 'TRANSCRIPT_FILE', 'RAW_HTML');

-- CreateEnum
CREATE TYPE "ArchiveEventType" AS ENUM ('RECORD_CREATED', 'STATUS_CHANGED', 'MEDIA_ATTACHED', 'REVIEW_STARTED', 'REVIEW_COMPLETED', 'ESCALATION_RAISED', 'INCIDENT_LINKED', 'NOTE_ADDED', 'RECORD_EXPORTED', 'RECORD_PURGED', 'COMPLIANCE_APPROVED', 'COMPLIANCE_EDIT_REQUESTED', 'COMPLIANCE_WARN_ISSUED', 'COMPLIANCE_PROMOTER_SUSPENDED', 'COMPLIANCE_ESCALATED');

-- CreateTable
CREATE TABLE "ambassador_profiles" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "primaryPlatform" "SourcePlatform" NOT NULL,
    "status" "AmbassadorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "campaignType" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'FORMATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_records" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "campaignId" TEXT,
    "sourcePlatform" "SourcePlatform" NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "externalContentId" TEXT,
    "title" TEXT,
    "bodyText" TEXT NOT NULL,
    "transcriptText" TEXT,
    "postedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archiveStatus" "ArchiveStatus" NOT NULL DEFAULT 'CAPTURED',
    "severity" "Severity",
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_media_assets" (
    "id" TEXT NOT NULL,
    "contentRecordId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "assetUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archive_event_logs" (
    "id" TEXT NOT NULL,
    "contentRecordId" TEXT NOT NULL,
    "eventType" "ArchiveEventType" NOT NULL,
    "eventNote" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archive_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ambassador_profiles_handle_idx" ON "ambassador_profiles"("handle");

-- CreateIndex
CREATE INDEX "ambassador_profiles_status_idx" ON "ambassador_profiles"("status");

-- CreateIndex
CREATE INDEX "ambassador_profiles_primaryPlatform_idx" ON "ambassador_profiles"("primaryPlatform");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_campaignType_idx" ON "campaigns"("campaignType");

-- CreateIndex
CREATE INDEX "content_records_ambassadorId_idx" ON "content_records"("ambassadorId");

-- CreateIndex
CREATE INDEX "content_records_campaignId_idx" ON "content_records"("campaignId");

-- CreateIndex
CREATE INDEX "content_records_sourcePlatform_idx" ON "content_records"("sourcePlatform");

-- CreateIndex
CREATE INDEX "content_records_archiveStatus_idx" ON "content_records"("archiveStatus");

-- CreateIndex
CREATE INDEX "content_records_capturedAt_idx" ON "content_records"("capturedAt");

-- CreateIndex
CREATE INDEX "content_records_postedAt_idx" ON "content_records"("postedAt");

-- CreateIndex
CREATE INDEX "content_records_externalContentId_idx" ON "content_records"("externalContentId");

-- CreateIndex
CREATE INDEX "content_media_assets_contentRecordId_idx" ON "content_media_assets"("contentRecordId");

-- CreateIndex
CREATE INDEX "content_media_assets_assetType_idx" ON "content_media_assets"("assetType");

-- CreateIndex
CREATE INDEX "archive_event_logs_contentRecordId_idx" ON "archive_event_logs"("contentRecordId");

-- CreateIndex
CREATE INDEX "archive_event_logs_eventType_idx" ON "archive_event_logs"("eventType");

-- CreateIndex
CREATE INDEX "archive_event_logs_createdAt_idx" ON "archive_event_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "content_records" ADD CONSTRAINT "content_records_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_records" ADD CONSTRAINT "content_records_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_media_assets" ADD CONSTRAINT "content_media_assets_contentRecordId_fkey" FOREIGN KEY ("contentRecordId") REFERENCES "content_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_event_logs" ADD CONSTRAINT "archive_event_logs_contentRecordId_fkey" FOREIGN KEY ("contentRecordId") REFERENCES "content_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
