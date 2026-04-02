-- ============================================================
-- FUNDUREX — INFLUWATCH PHASE 1
-- Migration: add_internal_actors
--
-- 1. Fix schema drift: add COMPLIANCE_CERTIFIED to ArchiveEventType
--    (was in schema.prisma but missing from the initial migration SQL)
-- 2. Add InternalActorRole and InternalActorStatus enums
-- 3. Create internal_actors table
-- 4. Add assignedSupervisorId FK column to ambassador_profiles
-- ============================================================

-- Fix schema drift: add COMPLIANCE_CERTIFIED to ArchiveEventType
-- IF NOT EXISTS is safe to run even if value already exists (Postgres 9.3+)
ALTER TYPE "ArchiveEventType" ADD VALUE IF NOT EXISTS 'COMPLIANCE_CERTIFIED';

-- CreateEnum
CREATE TYPE "InternalActorRole" AS ENUM ('REGISTERED_PRINCIPAL', 'DESIGNATED_SUPERVISOR', 'REVIEWER', 'COMPLIANCE_OFFICER', 'TENANT_ADMIN');

-- CreateEnum
CREATE TYPE "InternalActorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED');

-- CreateTable
CREATE TABLE "internal_actors" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "InternalActorRole" NOT NULL,
    "status" "InternalActorStatus" NOT NULL DEFAULT 'ACTIVE',
    "seriesLicense" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_actors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "internal_actors_email_key" ON "internal_actors"("email");

-- CreateIndex
CREATE INDEX "internal_actors_role_idx" ON "internal_actors"("role");

-- CreateIndex
CREATE INDEX "internal_actors_status_idx" ON "internal_actors"("status");

-- AlterTable: add supervisory assignment FK to ambassador_profiles
ALTER TABLE "ambassador_profiles" ADD COLUMN "assignedSupervisorId" TEXT;

-- CreateIndex
CREATE INDEX "ambassador_profiles_assignedSupervisorId_idx" ON "ambassador_profiles"("assignedSupervisorId");

-- AddForeignKey
ALTER TABLE "ambassador_profiles" ADD CONSTRAINT "ambassador_profiles_assignedSupervisorId_fkey"
    FOREIGN KEY ("assignedSupervisorId") REFERENCES "internal_actors"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
