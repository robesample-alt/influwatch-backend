// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — ContentRecord
//
// All database operations for content records.
// Route handlers call this layer only — no Prisma in routes.
// ============================================================

import prisma from '../utils/prisma';
import { computeChecksum } from '../utils/checksum';
import { detectRuleHits, computeSeverityFromHits, RuleHit, CompensationContext } from '../lib/ruleRegistry';
import { getSlaStatus } from '../utils/sla';
import { ArchiveEventType, ArchiveStatus } from '@prisma/client';
import { sendEscalationAlert } from '../utils/mailer';

import type {
  CreateContentRecordInput,
  ContentRecordFilters,
  UpdateArchiveStatusInput,
  AppendEventInput,
  ContentRecordResponse,
  PaginatedResponse,
  RecordComplianceActionInput,
  ComplianceActionType,
} from '../models/types';

// ─────────────────────────────────────────
// AMBASSADOR INCLUDE SHAPE
// Reused in all queries that return records
// ─────────────────────────────────────────

const ambassadorSelect = {
  id:              true,
  displayName:     true,
  handle:          true,
  primaryPlatform: true,
  status:          true,
} as const;

const campaignSelect = {
  id:           true,
  campaignName: true,
  campaignType: true,
  status:       true,
} as const;

// (phrase detection delegated to ruleRegistry.ts)

// ─────────────────────────────────────────
// ESCALATION LAYER
// ─────────────────────────────────────────

type EscalationLevel  = 'HIGH' | 'MEDIUM' | 'LOW';
type EscalationStatus = 'NON_COMPLIANT' | 'REVIEW_REQUIRED' | 'LOG_ONLY';

interface EscalationResult {
  level:  EscalationLevel;
  status: EscalationStatus;
}

const ESCALATION_STATUS_MAP: Record<EscalationLevel, EscalationStatus> = {
  HIGH:   'NON_COMPLIANT',
  MEDIUM: 'REVIEW_REQUIRED',
  LOW:    'LOG_ONLY',
};

/**
 * Derives an escalation level from detection hits.
 * HIGH   → CRITICAL/HIGH severity, or any DISC-001/DISC-002 hit
 * MEDIUM → MEDIUM severity only
 * LOW    → no hits or LOW severity only
 */
function computeEscalation(hits: RuleHit[]): EscalationResult {
  if (hits.length === 0) return { level: 'LOW', status: 'LOG_ONLY' };

  const baseHits      = hits.filter(h => !h.ruleCode.startsWith('DISC-'));
  const topSeverity   = computeSeverityFromHits(baseHits);
  const hasDisc001    = hits.some(h => h.ruleCode === 'DISC-001');
  const hasDisc002    = hits.some(h => h.ruleCode === 'DISC-002');
  const hasCritOrHigh = topSeverity === 'CRITICAL' || topSeverity === 'HIGH';

  const level: EscalationLevel =
    (hasCritOrHigh || hasDisc001)  ? 'HIGH'   :
    (topSeverity === 'MEDIUM' || hasDisc002) ? 'MEDIUM'  :
                                     'LOW';

  return { level, status: ESCALATION_STATUS_MAP[level] };
}

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

/**
 * Archive a new content record.
 * Computes checksum from sourceUrl + bodyText.
 * Scans bodyText for risky promotional phrases — sets PENDING_REVIEW if found.
 * Appends RECORD_CREATED event automatically.
 */
export async function createContentRecord(
  input: CreateContentRecordInput
): Promise<ContentRecordResponse> {
  const checksum = computeChecksum(input.sourceUrl, input.bodyText);
  const bodyText = input.bodyText ?? '';

  // ── Compensation context resolution ───────────────────────────────────────
  // Fetch the promoter's most recent CompensationStructure. If found, build
  // CompensationContext so COMP-001/002/003 rules are evaluated at ingestion.
  // Promoters with no CompensationStructure skip COMP evaluation entirely.
  const compensationStructure = await prisma.compensationStructure.findFirst({
    where:   { promoterId: input.ambassadorId },
    orderBy: { createdAt: 'desc' },
  });

  let compensationCtx: CompensationContext | undefined;
  let compensationPosture: string | null = null;
  let hasAffiliateLink                   = false;

  if (compensationStructure) {
    // Extract URLs from bodyText, normalize: lowercase, strip query params, strip trailing slash
    const URL_REGEX     = /https?:\/\/[^\s"'<>)\]]+/gi;
    const rawUrls       = bodyText.match(URL_REGEX) ?? [];
    const normalize     = (url: string) =>
      url.toLowerCase().replace(/\?.*$/, '').replace(/\/+$/, '');
    const extractedUrls = rawUrls.map(normalize);

    // Match extracted URLs against active AffiliateLinks for this promoter
    if (extractedUrls.length > 0) {
      const affiliateLinks = await prisma.affiliateLink.findMany({
        where:  { promoterId: input.ambassadorId, active: true },
        select: { url: true },
      });
      const normalizedStored = affiliateLinks.map(l => normalize(l.url));
      hasAffiliateLink = extractedUrls.some(u => normalizedStored.includes(u));
    }

    compensationPosture = compensationStructure.supervisionPosture;

    compensationCtx = {
      isTransactionBased: compensationStructure.isTransactionBased,
      isSecurityLinked:   compensationStructure.isSecurityLinked,
      supervisionPosture: compensationStructure.supervisionPosture,
      compensationForm:   compensationStructure.compensationForm,
      hasAffiliateLink,
    };
  }

  const hits       = detectRuleHits(bodyText, compensationCtx);
  const severity   = computeSeverityFromHits(hits);
  const escalation = computeEscalation(hits);
  const archiveStatus =
    escalation.level === 'HIGH'   ? ArchiveStatus.ESCALATED      :
    escalation.level === 'MEDIUM' ? ArchiveStatus.PENDING_REVIEW  :
                                    ArchiveStatus.CAPTURED;

  const record = await prisma.contentRecord.create({
    data: {
      ambassadorId:      input.ambassadorId,
      campaignId:        input.campaignId ?? null,
      sourcePlatform:    input.sourcePlatform,
      contentType:       input.contentType,
      sourceUrl:         input.sourceUrl,
      externalContentId: input.externalContentId ?? null,
      title:             input.title ?? null,
      bodyText:          input.bodyText,
      transcriptText:    input.transcriptText ?? null,
      postedAt:          input.postedAt ? new Date(input.postedAt) : null,
      archiveStatus,
      severity,
      checksum,
      compensationPosture,
      hasAffiliateLink,
    },
    include: {
      ambassador:       { select: ambassadorSelect },
      campaign:         { select: campaignSelect },
      detectionRecords: true,
    },
  });

  await appendEvent({
    contentRecordId: record.id,
    eventType:       ArchiveEventType.RECORD_CREATED,
    eventNote:       `Content captured from ${input.sourcePlatform} — ${input.sourceUrl}`,
  });

  if (hits.length > 0) {
    // Write one DetectionRecord per matched phrase
    await prisma.detectionRecord.createMany({
      data: hits.map(h => ({
        contentRecordId: record.id,
        ruleCode:        h.ruleCode,
        ruleName:        h.ruleName,
        matchedPhrase:   h.matchedPhrase,
        severity:        h.severity,
        detectionMethod: h.detectionMethod,
      })),
    });

    // Narrative event log note — preserved alongside structured detection records
    const phraseList = hits.map(h => `"${h.matchedPhrase}"`).join(', ');
    await appendEvent({
      contentRecordId: record.id,
      eventType:       ArchiveEventType.STATUS_CHANGED,
      eventNote:       `Auto-flagged [${escalation.level}/${escalation.status}] — matched phrase${hits.length > 1 ? 's' : ''}: ${phraseList}`,
    });
  }

  // After record creation, send alert for HIGH escalations
  if (escalation.level === 'HIGH') {
    const ruleCodes = [...new Set(hits.map(h => h.ruleCode))];
    sendEscalationAlert({
      recordId:     record.id,
      ambassadorId: record.ambassadorId,
      ruleCodes,
      level:        escalation.level,
    }).catch(() => {}); // fire-and-forget, never block the response
  }

  return record;
}

// ─────────────────────────────────────────
// LIST (with filters + pagination)
// ─────────────────────────────────────────

/**
 * List archived content records with optional filters.
 * Supports: ambassadorId, campaignId, sourcePlatform, archiveStatus.
 * Returns paginated result set.
 */
export async function listContentRecords(
  filters: ContentRecordFilters
): Promise<PaginatedResponse<ContentRecordResponse>> {
  const {
    ambassadorId,
    campaignId,
    sourcePlatform,
    archiveStatus,
    page     = 1,
    pageSize = 25,
  } = filters;

  const where = {
    ...(ambassadorId   ? { ambassadorId }   : {}),
    ...(campaignId     ? { campaignId }     : {}),
    ...(sourcePlatform ? { sourcePlatform } : {}),
    ...(archiveStatus  ? { archiveStatus }  : {}),
  };

  const [total, records] = await Promise.all([
    prisma.contentRecord.count({ where }),
    prisma.contentRecord.findMany({
      where,
      include: {
        ambassador: { select: ambassadorSelect },
        campaign:   { select: campaignSelect },
      },
      orderBy: { capturedAt: 'desc' },
      skip:  (page - 1) * pageSize,
      take:  pageSize,
    }),
  ]);

  return {
    data:       records,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────

/**
 * Retrieve a single content record by ID.
 * Returns null if not found.
 */
export async function getContentRecordById(
  id: string
): Promise<ContentRecordResponse | null> {
  const record = await prisma.contentRecord.findUnique({
    where: { id },
    include: {
      ambassador:       { select: ambassadorSelect },
      campaign:         { select: campaignSelect },
      detectionRecords: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!record) return null;

  const sla = getSlaStatus(record.capturedAt, record.severity, record.archiveStatus);

  return {
    ...record,
    slaDeadline:       sla.slaDeadline,
    slaHoursRemaining: sla.slaHoursRemaining,
    slaBreached:       sla.slaBreached,
  } as any;
}

// ─────────────────────────────────────────
// UPDATE ARCHIVE STATUS
// ─────────────────────────────────────────

/**
 * Transition a record to a new archive status.
 * Automatically appends a STATUS_CHANGED event to the audit log.
 */
export async function updateArchiveStatus(
  id: string,
  input: UpdateArchiveStatusInput
): Promise<ContentRecordResponse> {
  const existing = await prisma.contentRecord.findUniqueOrThrow({
    where: { id },
    select: { archiveStatus: true },
  });

  const updated = await prisma.contentRecord.update({
    where: { id },
    data:  { archiveStatus: input.archiveStatus },
    include: {
      ambassador: { select: ambassadorSelect },
      campaign:   { select: campaignSelect },
    },
  });

  await appendEvent({
    contentRecordId: id,
    eventType:       ArchiveEventType.STATUS_CHANGED,
    eventNote:       input.note
      ?? `Status changed: ${existing.archiveStatus} → ${input.archiveStatus}`,
    actorId: input.actorId,
  });

  return updated;
}

// ─────────────────────────────────────────
// MEDIA ASSETS
// ─────────────────────────────────────────

/**
 * Get all media assets attached to a content record.
 */
export async function getMediaAssets(contentRecordId: string) {
  return prisma.contentMediaAsset.findMany({
    where:   { contentRecordId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Attach a media asset to a content record.
 * Appends MEDIA_ATTACHED event to the audit log.
 */
export async function attachMediaAsset(
  contentRecordId: string,
  input: {
    assetType:        string;
    assetUrl:         string;
    mimeType?:        string;
    durationSeconds?: number;
  }
) {
  const asset = await prisma.contentMediaAsset.create({
    data: {
      contentRecordId,
      assetType:       input.assetType as any,
      assetUrl:        input.assetUrl,
      mimeType:        input.mimeType ?? null,
      durationSeconds: input.durationSeconds ?? null,
    },
  });

  await appendEvent({
    contentRecordId,
    eventType: ArchiveEventType.MEDIA_ATTACHED,
    eventNote: `Asset attached: ${input.assetType} — ${input.assetUrl}`,
  });

  return asset;
}

// ─────────────────────────────────────────
// ARCHIVE EVENT LOG
// ─────────────────────────────────────────

/**
 * Append an event to the immutable audit log.
 * This is the ONLY write path for ArchiveEventLog.
 * Never update or delete event log rows.
 */
export async function appendEvent(input: AppendEventInput) {
  return prisma.archiveEventLog.create({
    data: {
      contentRecordId: input.contentRecordId,
      eventType:       input.eventType,
      eventNote:       input.eventNote ?? null,
      actorId:         input.actorId  ?? null,
    },
  });
}

/**
 * Get the full audit event log for a content record.
 * Always ordered chronologically ascending.
 */
export async function getEventLog(contentRecordId: string) {
  return prisma.archiveEventLog.findMany({
    where:   { contentRecordId },
    orderBy: { createdAt: 'asc' },
  });
}

// ─────────────────────────────────────────
// COMPLIANCE ACTION ENGINE — Phase 1
// ─────────────────────────────────────────

const ACTION_EVENT_MAP: Record<ComplianceActionType, ArchiveEventType> = {
  APPROVE:           ArchiveEventType.COMPLIANCE_APPROVED,
  REQUEST_EDIT:      ArchiveEventType.COMPLIANCE_EDIT_REQUESTED,
  WARN_PROMOTER:     ArchiveEventType.COMPLIANCE_WARN_ISSUED,
  SUSPEND_PROMOTER:  ArchiveEventType.COMPLIANCE_PROMOTER_SUSPENDED,
  ESCALATE:          ArchiveEventType.COMPLIANCE_ESCALATED,
  CERTIFY:           ArchiveEventType.COMPLIANCE_CERTIFIED,
};

// ─────────────────────────────────────────────────────────────────────
// Phase 1 action → status mapping
//
// Normal closure path:
//   APPROVE          → CLOSED        (routine review sign-off; no cert required)
//
// Remediation paths:
//   REQUEST_EDIT     → PENDING_REVIEW (returned for promoter edit; re-enters queue)
//   WARN_PROMOTER    → REVIEWED       (warning issued; remediation holding state)
//
// Escalation path:
//   ESCALATE         → ESCALATED
//   SUSPEND_PROMOTER → ESCALATED
//
// Supervisory certification path (for escalated / material cases only):
//   CERTIFY          → CLOSED         (principal sign-off; COMPLIANCE_CERTIFIED event written)
//
// Key distinction: APPROVE → CLOSED is a normal reviewer closure.
//                  CERTIFY → CLOSED is a principal supervisory attestation.
//                  Both produce CLOSED but only CERTIFY writes COMPLIANCE_CERTIFIED
//                  to the audit log, which is what feeds the Certifications tab.
// ─────────────────────────────────────────────────────────────────────
const ACTION_STATUS_MAP: Record<ComplianceActionType, ArchiveStatus> = {
  APPROVE:           ArchiveStatus.CLOSED,
  REQUEST_EDIT:      ArchiveStatus.PENDING_REVIEW,
  WARN_PROMOTER:     ArchiveStatus.REVIEWED,
  SUSPEND_PROMOTER:  ArchiveStatus.ESCALATED,
  ESCALATE:          ArchiveStatus.ESCALATED,
  CERTIFY:           ArchiveStatus.CLOSED,
};

/**
 * Record a compliance decision against a content record.
 * Updates archiveStatus and appends an immutable audit event in one operation.
 */
export async function recordComplianceAction(
  contentRecordId: string,
  input: RecordComplianceActionInput
): Promise<ContentRecordResponse> {
  const newStatus = ACTION_STATUS_MAP[input.action];

  const updated = await prisma.contentRecord.update({
    where: { id: contentRecordId },
    data:  { archiveStatus: newStatus },
    include: {
      ambassador: { select: ambassadorSelect },
      campaign:   { select: campaignSelect },
    },
  });

  await appendEvent({
    contentRecordId,
    eventType: ACTION_EVENT_MAP[input.action],
    eventNote: input.note ?? `Compliance action recorded: ${input.action}`,
    actorId:   input.actorId,
  });

  return updated;
}

// ─────────────────────────────────────────
// REMEDIATION RECORDS — Phase 1
// ─────────────────────────────────────────

const REMEDIATION_EVENT_TYPES = [
  ArchiveEventType.COMPLIANCE_EDIT_REQUESTED,
  ArchiveEventType.COMPLIANCE_WARN_ISSUED,
] as const;

/**
 * Return content records that have had a REQUEST_EDIT or WARN_PROMOTER
 * compliance action recorded against them.
 * Each result is enriched with the most recent remediation event details.
 * Source of truth: ArchiveEventLog — no new table required.
 */
export async function getRemediationRecords() {
  // Most recent remediation event per content record (distinct by contentRecordId)
  const latestEvents = await prisma.archiveEventLog.findMany({
    where:   { eventType: { in: [...REMEDIATION_EVENT_TYPES] } },
    orderBy: { createdAt: 'desc' },
    distinct: ['contentRecordId'],
  });

  if (!latestEvents.length) return [];

  const recordIds = latestEvents.map(e => e.contentRecordId);

  const records = await prisma.contentRecord.findMany({
    where: { id: { in: recordIds } },
    include: {
      ambassador: { select: ambassadorSelect },
      campaign:   { select: campaignSelect },
    },
    orderBy: { capturedAt: 'desc' },
  });

  // Merge latest remediation event data into each record response
  const eventMap = new Map(latestEvents.map(e => [e.contentRecordId, e]));

  return records.map(rec => ({
    ...rec,
    latestAction:     eventMap.get(rec.id)?.eventType  ?? null,
    latestActionNote: eventMap.get(rec.id)?.eventNote  ?? null,
    latestActionAt:   eventMap.get(rec.id)?.createdAt  ?? null,
  }));
}

// ─────────────────────────────────────────
// CERTIFIED RECORDS — Phase 1
// ─────────────────────────────────────────

/**
 * Return content records that have received a formal supervisory sign-off
 * (CERTIFY action → archiveStatus CLOSED + COMPLIANCE_CERTIFIED audit event).
 *
 * This represents the terminal state of a compliance case under
 * FINRA Rule 3110 / 3130 supervisory closure requirements.
 * Source of truth: COMPLIANCE_CERTIFIED events in ArchiveEventLog.
 * Records with archiveStatus = CLOSED but no COMPLIANCE_CERTIFIED event
 * (i.e. routine APPROVE closures) are excluded. No new table required.
 */
export async function getCertifiedRecords() {
  // Fetch COMPLIANCE_CERTIFIED events to get the sign-off timestamp and note
  const certEvents = await prisma.archiveEventLog.findMany({
    where:    { eventType: ArchiveEventType.COMPLIANCE_CERTIFIED },
    orderBy:  { createdAt: 'desc' },
    distinct: ['contentRecordId'],
  });

  if (!certEvents.length) return [];

  const recordIds = certEvents.map(e => e.contentRecordId);

  const records = await prisma.contentRecord.findMany({
    where: { id: { in: recordIds } },
    include: {
      ambassador: { select: ambassadorSelect },
      campaign:   { select: campaignSelect },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const eventMap = new Map(certEvents.map(e => [e.contentRecordId, e]));

  return records.map(rec => ({
    ...rec,
    certifiedAt:   eventMap.get(rec.id)?.createdAt ?? rec.updatedAt,
    certifiedNote: eventMap.get(rec.id)?.eventNote  ?? 'Supervisory sign-off recorded',
    certifiedBy:   eventMap.get(rec.id)?.actorId    ?? null,
  }));
}

// ─────────────────────────────────────────
// GLOBAL AUDIT EVENT LOG — Phase 1
// ─────────────────────────────────────────

// Maps UI category labels → sets of ArchiveEventType values
const AUDIT_CATEGORY_MAP: Record<string, ArchiveEventType[]> = {
  capture:    [ArchiveEventType.RECORD_CREATED, ArchiveEventType.MEDIA_ATTACHED],
  decision:   [
    ArchiveEventType.STATUS_CHANGED,
    ArchiveEventType.COMPLIANCE_APPROVED,
    ArchiveEventType.COMPLIANCE_EDIT_REQUESTED,
    ArchiveEventType.COMPLIANCE_WARN_ISSUED,
    ArchiveEventType.REVIEW_STARTED,
    ArchiveEventType.REVIEW_COMPLETED,
    ArchiveEventType.NOTE_ADDED,
  ],
  escalation: [
    ArchiveEventType.COMPLIANCE_ESCALATED,
    ArchiveEventType.COMPLIANCE_PROMOTER_SUSPENDED,
    ArchiveEventType.ESCALATION_RAISED,
    ArchiveEventType.INCIDENT_LINKED,
  ],
  config:     [ArchiveEventType.RECORD_PURGED, ArchiveEventType.RECORD_EXPORTED],
};

/**
 * Return a paginated, newest-first list of all ArchiveEventLog rows
 * across every content record. Powers the global Audit Log screen.
 * Optionally filtered by category (capture / decision / escalation / config).
 */
export async function listAuditEvents(options: {
  page?:     number;
  pageSize?: number;
  category?: string;
}) {
  const { page = 1, pageSize = 50, category } = options;

  const eventTypes = category ? AUDIT_CATEGORY_MAP[category.toLowerCase()] : undefined;
  const where = eventTypes?.length ? { eventType: { in: eventTypes } } : {};

  const [total, events] = await Promise.all([
    prisma.archiveEventLog.count({ where }),
    prisma.archiveEventLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        contentRecord: {
          select: {
            id: true,
            ambassador: { select: { handle: true, displayName: true } },
          },
        },
      },
    }),
  ]);

  return {
    data:       events,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─────────────────────────────────────────
// SLA BREACHED RECORDS
// ─────────────────────────────────────────

/**
 * Return all active content records (PENDING_REVIEW or ESCALATED)
 * whose SLA deadline has passed, sorted most overdue first.
 */
export async function getSlaBreachedRecords() {
  const active = await prisma.contentRecord.findMany({
    where: {
      archiveStatus: { in: [ArchiveStatus.PENDING_REVIEW, ArchiveStatus.ESCALATED] },
    },
    include: {
      ambassador:       { select: ambassadorSelect },
      campaign:         { select: campaignSelect },
      detectionRecords: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { capturedAt: 'asc' },
  });

  const breached = active
    .map(record => {
      const sla = getSlaStatus(record.capturedAt, record.severity, record.archiveStatus);
      return { ...record, ...sla };
    })
    .filter(record => record.slaBreached)
    .sort((a, b) => (a.slaHoursRemaining as number) - (b.slaHoursRemaining as number));

  return breached;
}

// ─────────────────────────────────────────
// DISCLOSURE FLAGS — Phase 1
// ─────────────────────────────────────────

/**
 * Return all detection records whose ruleCode starts with 'DISC-'.
 * Each result is enriched with the parent content record's key fields
 * (sourcePlatform, capturedAt, archiveStatus, bodyText preview)
 * and the ambassador's displayName and handle.
 *
 * Optional filters:
 *   archiveStatus — filter by content record archive status
 *   ambassadorId  — filter to a single promoter's records
 */
export async function listDisclosureFlags(options: {
  archiveStatus?: string;
  ambassadorId?:  string;
}) {
  const { archiveStatus, ambassadorId } = options;

  const flags = await prisma.detectionRecord.findMany({
    where: {
      ruleCode: { startsWith: 'DISC-' },
      contentRecord: {
        ...(archiveStatus ? { archiveStatus: archiveStatus as ArchiveStatus } : {}),
        ...(ambassadorId  ? { ambassadorId }                                  : {}),
      },
    },
    include: {
      contentRecord: {
        select: {
          id:            true,
          ambassadorId:  true,
          sourcePlatform: true,
          capturedAt:    true,
          archiveStatus: true,
          bodyText:      true,
          ambassador: {
            select: { displayName: true, handle: true },
          },
        },
      },
    },
    orderBy: { contentRecord: { capturedAt: 'desc' } },
  });

  return flags.map(f => ({
    detectionRecordId: f.id,
    ruleCode:          f.ruleCode,
    ruleName:          f.ruleName,
    matchedPhrase:     f.matchedPhrase,
    severity:          f.severity,
    detectionMethod:   f.detectionMethod,
    createdAt:         f.createdAt,
    contentRecord: {
      id:              f.contentRecord.id,
      ambassadorId:    f.contentRecord.ambassadorId,
      sourcePlatform:  f.contentRecord.sourcePlatform,
      capturedAt:      f.contentRecord.capturedAt,
      archiveStatus:   f.contentRecord.archiveStatus,
      bodyTextPreview: f.contentRecord.bodyText.slice(0, 100),
    },
    ambassador: {
      displayName: f.contentRecord.ambassador.displayName,
      handle:      f.contentRecord.ambassador.handle,
    },
  }));
}

// ─────────────────────────────────────────
// DISCLOSURE LOG — Phase 1
// ─────────────────────────────────────────

/**
 * Return all content records that have at least one DISC- detection hit,
 * grouped by content record (not by individual flag).
 *
 * disclosureOutcome logic:
 *   SATISFIED     — archiveStatus is REVIEWED or CLOSED
 *   NOT_SATISFIED — archiveStatus is PENDING_REVIEW or ESCALATED
 *   (anything else, e.g. CAPTURED / INCIDENT_OPENED, maps to NOT_SATISFIED)
 *
 * Optional filters:
 *   ambassadorId — filter to a single promoter
 *   outcome      — 'SATISFIED' | 'NOT_SATISFIED'
 */
export async function listDisclosureLog(options: {
  ambassadorId?: string;
  outcome?:      string;
}) {
  const { ambassadorId, outcome } = options;

  const SATISFIED_STATUSES: ArchiveStatus[] = [ArchiveStatus.REVIEWED, ArchiveStatus.CLOSED];

  // Fetch all content records that have at least one DISC- detection record
  const records = await prisma.contentRecord.findMany({
    where: {
      ...(ambassadorId ? { ambassadorId } : {}),
      detectionRecords: {
        some: { ruleCode: { startsWith: 'DISC-' } },
      },
    },
    include: {
      ambassador: { select: { id: true, displayName: true, handle: true } },
      detectionRecords: {
        where:   { ruleCode: { startsWith: 'DISC-' } },
        orderBy: { createdAt: 'asc' },
        select: {
          id:              true,
          ruleCode:        true,
          ruleName:        true,
          matchedPhrase:   true,
          severity:        true,
          detectionMethod: true,
          createdAt:       true,
        },
      },
    },
    orderBy: { capturedAt: 'desc' },
  });

  const mapped = records.map(rec => {
    const disclosureOutcome: 'SATISFIED' | 'NOT_SATISFIED' =
      SATISFIED_STATUSES.includes(rec.archiveStatus as ArchiveStatus)
        ? 'SATISFIED'
        : 'NOT_SATISFIED';

    return {
      id:               rec.id,
      ambassadorId:     rec.ambassadorId,
      ambassador: {
        displayName: rec.ambassador.displayName,
        handle:      rec.ambassador.handle,
      },
      sourcePlatform:   rec.sourcePlatform,
      capturedAt:       rec.capturedAt,
      archiveStatus:    rec.archiveStatus,
      bodyTextPreview:  rec.bodyText.slice(0, 100),
      checksum:         rec.checksum,
      disclosureOutcome,
      disclosureHits:   rec.detectionRecords,
    };
  });

  // Apply outcome filter in memory — outcome is derived, not a DB column
  const filtered = outcome
    ? mapped.filter(r => r.disclosureOutcome === outcome.toUpperCase())
    : mapped;

  return filtered;
}

// ─────────────────────────────────────────
// DEDUP CHECK
// ─────────────────────────────────────────

/**
 * Check whether a content record with this checksum
 * already exists in the archive.
 * Used at ingestion to prevent duplicate captures.
 */
export async function findByChecksum(checksum: string) {
  return prisma.contentRecord.findFirst({
    where: { checksum },
    select: { id: true, capturedAt: true, ambassadorId: true },
  });
}
