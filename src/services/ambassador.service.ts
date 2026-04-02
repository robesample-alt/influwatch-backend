// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — Ambassador + Campaign
//
// Lightweight lookup services.
// Full ambassador and campaign management belongs
// to their respective modules in later phases.
// ============================================================

import prisma from '../utils/prisma';
import { AmbassadorStatus, SourcePlatform, PromoterRiskTier } from '@prisma/client';
import { validateCreateAmbassador } from '../utils/validation';

const SUPERVISOR_INCLUDE = {
  select: {
    id:            true,
    displayName:   true,
    email:         true,
    role:          true,
    status:        true,
    seriesLicense: true,
  },
} as const;

// ─────────────────────────────────────────
// AMBASSADOR
// ─────────────────────────────────────────

export async function getAmbassadorById(id: string) {
  return prisma.ambassadorProfile.findUnique({
    where:   { id },
    include: { assignedSupervisor: SUPERVISOR_INCLUDE },
  });
}

export async function listAmbassadors(status?: AmbassadorStatus) {
  return prisma.ambassadorProfile.findMany({
    where:   status ? { status } : {},
    include: { assignedSupervisor: SUPERVISOR_INCLUDE },
    orderBy: { displayName: 'asc' },
  });
}

/**
 * Full ambassador detail view — profile + all content records + derived counts.
 * Used by the Promoter Detail screen (Phase 1).
 */
export async function getAmbassadorDetail(id: string) {
  const [ambassador, records] = await Promise.all([
    prisma.ambassadorProfile.findUnique({
      where:   { id },
      include: { assignedSupervisor: SUPERVISOR_INCLUDE },
    }),
    prisma.contentRecord.findMany({
      where:    { ambassadorId: id },
      orderBy:  { capturedAt: 'desc' },
      select: {
        id:            true,
        archiveStatus: true,
        severity:      true,
        sourcePlatform: true,
        capturedAt:    true,
        checksum:      true,
        sourceUrl:     true,
      },
    }),
  ]);

  if (!ambassador) return null;

  const statusCounts = { total: 0, captured: 0, pending: 0, reviewed: 0, escalated: 0, closed: 0 };
  for (const r of records) {
    statusCounts.total++;
    if      (r.archiveStatus === 'CAPTURED')       statusCounts.captured++;
    else if (r.archiveStatus === 'PENDING_REVIEW') statusCounts.pending++;
    else if (r.archiveStatus === 'REVIEWED')       statusCounts.reviewed++;
    else if (r.archiveStatus === 'ESCALATED')      statusCounts.escalated++;
    else if (r.archiveStatus === 'CLOSED')         statusCounts.closed++;
  }

  const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
  const activeSevs = records
    .filter(r => r.archiveStatus !== 'CLOSED')
    .map(r => r.severity)
    .filter(Boolean) as string[];
  const highestSeverity = SEVERITY_ORDER.find(s => activeSevs.includes(s)) ?? null;

  const openCount = statusCounts.pending + statusCounts.reviewed + statusCounts.escalated;

  return { ambassador, records, statusCounts, highestSeverity, openCount };
}

export async function createAmbassador(input: {
  displayName:           string;
  handle:                string;
  primaryPlatform:       string;
  riskTier?:             string;
  assignedSupervisorId?: string;
}) {
  const { valid, errors } = validateCreateAmbassador(input);
  if (!valid) {
    const err = new Error(`Validation failed: ${errors.join('; ')}`);
    (err as any).validationErrors = errors;
    throw err;
  }

  return prisma.ambassadorProfile.create({
    data: {
      displayName:          input.displayName,
      handle:               input.handle,
      primaryPlatform:      input.primaryPlatform as SourcePlatform,
      riskTier:             (input.riskTier as PromoterRiskTier) ?? null,
      status:               AmbassadorStatus.ACTIVE,
      assignedSupervisorId: input.assignedSupervisorId ?? null,
    },
    include: { assignedSupervisor: SUPERVISOR_INCLUDE },
  });
}

export async function assignSupervisor(id: string, supervisorId: string | null) {
  return prisma.ambassadorProfile.update({
    where:   { id },
    data:    { assignedSupervisorId: supervisorId },
    include: { assignedSupervisor: SUPERVISOR_INCLUDE },
  });
}

// ─────────────────────────────────────────
// CAMPAIGN
// ─────────────────────────────────────────

export async function getCampaignById(id: string) {
  return prisma.campaign.findUnique({ where: { id } });
}

export async function listCampaigns() {
  return prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } });
}

// ─────────────────────────────────────────
// ACCOUNT MONITOR SUMMARY — Phase 1
// ─────────────────────────────────────────

/**
 * Return all ambassador profiles with aggregated capture statistics.
 * Powers the Account Monitor screen.
 *
 * Per-promoter data:
 *   totalCaptures  — all content records ever captured
 *   flagCount      — records currently in PENDING_REVIEW or ESCALATED
 *   lastCaptureAt  — most recent capturedAt timestamp, or null if none
 *   captures24h    — records captured in the last 24 hours
 *
 * Summary totals included at the root level for the summary bar.
 */
export async function getMonitorSummary() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const ambassadors = await prisma.ambassadorProfile.findMany({
    orderBy: { displayName: 'asc' },
    include: {
      assignedSupervisor: SUPERVISOR_INCLUDE,
      contentRecords: {
        select: {
          capturedAt:    true,
          archiveStatus: true,
        },
      },
    },
  });

  const promoters = ambassadors.map(a => {
    const recs          = a.contentRecords;
    const totalCaptures = recs.length;
    const pendingCount   = recs.filter(r => r.archiveStatus === 'PENDING_REVIEW').length;
    const escalatedCount = recs.filter(r => r.archiveStatus === 'ESCALATED').length;
    const flagCount      = pendingCount + escalatedCount;

    const lastCaptureAt  = recs.length > 0
      ? recs.reduce((max, r) => r.capturedAt > max ? r.capturedAt : max, recs[0].capturedAt)
      : null;
    const captures24h = recs.filter(r => r.capturedAt >= since24h).length;

    return {
      id:                 a.id,
      displayName:        a.displayName,
      handle:             a.handle,
      primaryPlatform:    a.primaryPlatform,
      status:             a.status,
      riskTier:           a.riskTier,
      assignedSupervisor: a.assignedSupervisor,
      totalCaptures,
      pendingCount,
      escalatedCount,
      flagCount,
      lastCaptureAt,
      captures24h,
    };
  });

  const summary = {
    total:         promoters.length,
    active:        promoters.filter(p => p.status === 'ACTIVE').length,
    paused:        promoters.filter(p => p.status === 'SUSPENDED' || p.status === 'INACTIVE').length,
    totalCaptures: promoters.reduce((sum, p) => sum + p.totalCaptures, 0),
    captures24h:   promoters.reduce((sum, p) => sum + p.captures24h, 0),
  };

  return { summary, promoters };
}
