import type { CreateContentRecordInput, ContentRecordFilters, UpdateArchiveStatusInput, AppendEventInput, ContentRecordResponse, PaginatedResponse, RecordComplianceActionInput } from '../models/types';
/**
 * Archive a new content record.
 * Computes checksum from sourceUrl + bodyText.
 * Scans bodyText for risky promotional phrases — sets PENDING_REVIEW if found.
 * Appends RECORD_CREATED event automatically.
 */
export declare function createContentRecord(input: CreateContentRecordInput): Promise<ContentRecordResponse>;
/**
 * List archived content records with optional filters.
 * Supports: ambassadorId, campaignId, sourcePlatform, archiveStatus.
 * Returns paginated result set.
 */
export declare function listContentRecords(filters: ContentRecordFilters): Promise<PaginatedResponse<ContentRecordResponse>>;
/**
 * Retrieve a single content record by ID.
 * Returns null if not found.
 */
export declare function getContentRecordById(id: string): Promise<ContentRecordResponse | null>;
/**
 * Transition a record to a new archive status.
 * Automatically appends a STATUS_CHANGED event to the audit log.
 */
export declare function updateArchiveStatus(id: string, input: UpdateArchiveStatusInput): Promise<ContentRecordResponse>;
/**
 * Get all media assets attached to a content record.
 */
export declare function getMediaAssets(contentRecordId: string): Promise<{
    id: string;
    createdAt: Date;
    contentRecordId: string;
    assetType: import(".prisma/client").$Enums.AssetType;
    assetUrl: string;
    mimeType: string | null;
    durationSeconds: number | null;
}[]>;
/**
 * Attach a media asset to a content record.
 * Appends MEDIA_ATTACHED event to the audit log.
 */
export declare function attachMediaAsset(contentRecordId: string, input: {
    assetType: string;
    assetUrl: string;
    mimeType?: string;
    durationSeconds?: number;
}): Promise<{
    id: string;
    createdAt: Date;
    contentRecordId: string;
    assetType: import(".prisma/client").$Enums.AssetType;
    assetUrl: string;
    mimeType: string | null;
    durationSeconds: number | null;
}>;
/**
 * Append an event to the immutable audit log.
 * This is the ONLY write path for ArchiveEventLog.
 * Never update or delete event log rows.
 */
export declare function appendEvent(input: AppendEventInput): Promise<{
    id: string;
    createdAt: Date;
    eventType: import(".prisma/client").$Enums.ArchiveEventType;
    eventNote: string | null;
    actorId: string | null;
    contentRecordId: string;
}>;
/**
 * Get the full audit event log for a content record.
 * Always ordered chronologically ascending.
 */
export declare function getEventLog(contentRecordId: string): Promise<{
    id: string;
    createdAt: Date;
    eventType: import(".prisma/client").$Enums.ArchiveEventType;
    eventNote: string | null;
    actorId: string | null;
    contentRecordId: string;
}[]>;
/**
 * Record a compliance decision against a content record.
 * Updates archiveStatus and appends an immutable audit event in one operation.
 */
export declare function recordComplianceAction(contentRecordId: string, input: RecordComplianceActionInput): Promise<ContentRecordResponse>;
/**
 * Return content records that have had a REQUEST_EDIT or WARN_PROMOTER
 * compliance action recorded against them.
 * Each result is enriched with the most recent remediation event details.
 * Source of truth: ArchiveEventLog — no new table required.
 */
export declare function getRemediationRecords(): Promise<{
    latestAction: import(".prisma/client").$Enums.ArchiveEventType | null;
    latestActionNote: string | null;
    latestActionAt: Date | null;
    campaign: {
        id: string;
        status: import(".prisma/client").$Enums.CampaignStatus;
        campaignName: string;
        campaignType: import(".prisma/client").$Enums.CampaignType;
    } | null;
    ambassador: {
        id: string;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
    };
    hasAffiliateLink: boolean;
    id: string;
    campaignId: string | null;
    createdAt: Date;
    updatedAt: Date;
    sourcePlatform: import(".prisma/client").$Enums.SourcePlatform;
    contentType: import(".prisma/client").$Enums.ContentType;
    sourceUrl: string;
    externalContentId: string | null;
    title: string | null;
    bodyText: string;
    transcriptText: string | null;
    postedAt: Date | null;
    capturedAt: Date;
    archiveStatus: import(".prisma/client").$Enums.ArchiveStatus;
    severity: import(".prisma/client").$Enums.Severity | null;
    checksum: string | null;
    compensationPosture: string | null;
    ambassadorId: string;
}[]>;
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
export declare function getCertifiedRecords(): Promise<{
    certifiedAt: Date;
    certifiedNote: string;
    certifiedBy: string | null;
    campaign: {
        id: string;
        status: import(".prisma/client").$Enums.CampaignStatus;
        campaignName: string;
        campaignType: import(".prisma/client").$Enums.CampaignType;
    } | null;
    ambassador: {
        id: string;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
    };
    hasAffiliateLink: boolean;
    id: string;
    campaignId: string | null;
    createdAt: Date;
    updatedAt: Date;
    sourcePlatform: import(".prisma/client").$Enums.SourcePlatform;
    contentType: import(".prisma/client").$Enums.ContentType;
    sourceUrl: string;
    externalContentId: string | null;
    title: string | null;
    bodyText: string;
    transcriptText: string | null;
    postedAt: Date | null;
    capturedAt: Date;
    archiveStatus: import(".prisma/client").$Enums.ArchiveStatus;
    severity: import(".prisma/client").$Enums.Severity | null;
    checksum: string | null;
    compensationPosture: string | null;
    ambassadorId: string;
}[]>;
/**
 * Return a paginated, newest-first list of all ArchiveEventLog rows
 * across every content record. Powers the global Audit Log screen.
 * Optionally filtered by category (capture / decision / escalation / config).
 */
export declare function listAuditEvents(options: {
    page?: number;
    pageSize?: number;
    category?: string;
}): Promise<{
    data: ({
        contentRecord: {
            id: string;
            ambassador: {
                displayName: string;
                handle: string;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        eventType: import(".prisma/client").$Enums.ArchiveEventType;
        eventNote: string | null;
        actorId: string | null;
        contentRecordId: string;
    })[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * Return all active content records (PENDING_REVIEW or ESCALATED)
 * whose SLA deadline has passed, sorted most overdue first.
 */
export declare function getSlaBreachedRecords(): Promise<{
    slaDeadline: Date;
    slaHoursRemaining: number | null;
    slaBreached: boolean;
    campaign: {
        id: string;
        status: import(".prisma/client").$Enums.CampaignStatus;
        campaignName: string;
        campaignType: import(".prisma/client").$Enums.CampaignType;
    } | null;
    ambassador: {
        id: string;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
        status: import(".prisma/client").$Enums.AmbassadorStatus;
    };
    detectionRecords: {
        id: string;
        createdAt: Date;
        severity: import(".prisma/client").$Enums.Severity;
        contentRecordId: string;
        ruleCode: string;
        ruleName: string;
        matchedPhrase: string | null;
        detectionMethod: import(".prisma/client").$Enums.DetectionMethod;
    }[];
    hasAffiliateLink: boolean;
    id: string;
    campaignId: string | null;
    createdAt: Date;
    updatedAt: Date;
    sourcePlatform: import(".prisma/client").$Enums.SourcePlatform;
    contentType: import(".prisma/client").$Enums.ContentType;
    sourceUrl: string;
    externalContentId: string | null;
    title: string | null;
    bodyText: string;
    transcriptText: string | null;
    postedAt: Date | null;
    capturedAt: Date;
    archiveStatus: import(".prisma/client").$Enums.ArchiveStatus;
    severity: import(".prisma/client").$Enums.Severity | null;
    checksum: string | null;
    compensationPosture: string | null;
    ambassadorId: string;
}[]>;
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
export declare function listDisclosureFlags(options: {
    archiveStatus?: string;
    ambassadorId?: string;
}): Promise<{
    detectionRecordId: string;
    ruleCode: string;
    ruleName: string;
    matchedPhrase: string | null;
    severity: import(".prisma/client").$Enums.Severity;
    detectionMethod: import(".prisma/client").$Enums.DetectionMethod;
    createdAt: Date;
    contentRecord: {
        id: string;
        ambassadorId: string;
        sourcePlatform: import(".prisma/client").$Enums.SourcePlatform;
        capturedAt: Date;
        archiveStatus: import(".prisma/client").$Enums.ArchiveStatus;
        bodyTextPreview: string;
    };
    ambassador: {
        displayName: string;
        handle: string;
    };
}[]>;
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
export declare function listDisclosureLog(options: {
    ambassadorId?: string;
    outcome?: string;
}): Promise<{
    id: string;
    ambassadorId: string;
    ambassador: {
        displayName: string;
        handle: string;
    };
    sourcePlatform: import(".prisma/client").$Enums.SourcePlatform;
    capturedAt: Date;
    archiveStatus: import(".prisma/client").$Enums.ArchiveStatus;
    bodyTextPreview: string;
    checksum: string | null;
    disclosureOutcome: "SATISFIED" | "NOT_SATISFIED";
    disclosureHits: {
        id: string;
        createdAt: Date;
        severity: import(".prisma/client").$Enums.Severity;
        ruleCode: string;
        ruleName: string;
        matchedPhrase: string | null;
        detectionMethod: import(".prisma/client").$Enums.DetectionMethod;
    }[];
}[]>;
/**
 * Check whether a content record with this checksum
 * already exists in the archive.
 * Used at ingestion to prevent duplicate captures.
 */
export declare function findByChecksum(checksum: string): Promise<{
    id: string;
    capturedAt: Date;
    ambassadorId: string;
} | null>;
//# sourceMappingURL=contentRecord.service.d.ts.map