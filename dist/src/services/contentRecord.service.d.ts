import type { CreateContentRecordInput, ContentRecordFilters, UpdateArchiveStatusInput, AppendEventInput, ContentRecordResponse, PaginatedResponse, RecordComplianceActionInput } from '../models/types';
/**
 * Archive a new content record.
 * Computes checksum from sourceUrl + bodyText.
 * Scans bodyText for risky promotional phrases — sets PENDING_REVIEW if found.
 * Appends RECORD_CREATED event automatically.
 */
export declare function createContentRecord(tenantId: string, input: CreateContentRecordInput): Promise<ContentRecordResponse>;
/**
 * List archived content records with optional filters.
 * Supports: ambassadorId, campaignId, sourcePlatform, archiveStatus.
 * Returns paginated result set.
 */
export declare function listContentRecords(tenantId: string, filters: ContentRecordFilters): Promise<PaginatedResponse<ContentRecordResponse>>;
/**
 * Retrieve a single content record by ID.
 * Returns null if not found.
 */
export declare function getContentRecordById(tenantId: string, id: string): Promise<ContentRecordResponse | null>;
/**
 * Transition a record to a new archive status.
 * Automatically appends a STATUS_CHANGED event to the audit log.
 */
export declare function updateArchiveStatus(tenantId: string, id: string, input: UpdateArchiveStatusInput): Promise<ContentRecordResponse>;
/**
 * Get all media assets attached to a content record.
 */
export declare function getMediaAssets(tenantId: string, contentRecordId: string): Promise<{
    tenantId: string;
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
export declare function attachMediaAsset(tenantId: string, contentRecordId: string, input: {
    assetType: string;
    assetUrl: string;
    mimeType?: string;
    durationSeconds?: number;
}): Promise<{
    tenantId: string;
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
export declare function appendEvent(tenantId: string, input: AppendEventInput): Promise<any>;
/**
 * Get the full audit event log for a content record.
 * Always ordered chronologically ascending.
 */
export declare function getEventLog(tenantId: string, contentRecordId: string): Promise<{
    tenantId: string;
    id: string;
    createdAt: Date;
    contentRecordId: string;
    eventType: import(".prisma/client").$Enums.ArchiveEventType;
    eventNote: string | null;
    actorId: string | null;
}[]>;
/**
 * Record a compliance decision against a content record.
 * Updates archiveStatus and appends an immutable audit event in one operation.
 */
export declare function recordComplianceAction(tenantId: string, contentRecordId: string, input: RecordComplianceActionInput): Promise<ContentRecordResponse>;
/**
 * Return content records that have had a REQUEST_EDIT or WARN_PROMOTER
 * compliance action recorded against them.
 * Each result is enriched with the most recent remediation event details.
 * Source of truth: ArchiveEventLog — no new table required.
 */
export declare function getRemediationRecords(tenantId: string): Promise<{
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
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
    };
    tenantId: string;
    hasAffiliateLink: boolean;
    severity: import(".prisma/client").$Enums.Severity | null;
    id: string;
    title: string | null;
    sourcePlatform: import(".prisma/client").$Enums.SourcePlatform;
    contentType: import(".prisma/client").$Enums.ContentType;
    sourceUrl: string;
    externalContentId: string | null;
    bodyText: string;
    transcriptText: string | null;
    postedAt: Date | null;
    capturedAt: Date;
    archiveStatus: import(".prisma/client").$Enums.ArchiveStatus;
    checksum: string | null;
    compensationPosture: string | null;
    exposureLevel: string | null;
    requiresPrincipalReview: boolean | null;
    exposureReasonCodes: string | null;
    exposureSummary: string | null;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    campaignId: string | null;
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
export declare function getCertifiedRecords(tenantId: string): Promise<any[]>;
/**
 * Return a paginated, newest-first list of all ArchiveEventLog rows
 * across every content record. Powers the global Audit Log screen.
 * Optionally filtered by category (capture / decision / escalation / config).
 */
export declare function listAuditEvents(tenantId: string, options: {
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
        tenantId: string;
        id: string;
        createdAt: Date;
        contentRecordId: string;
        eventType: import(".prisma/client").$Enums.ArchiveEventType;
        eventNote: string | null;
        actorId: string | null;
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
export declare function getSlaBreachedRecords(tenantId: string): Promise<{
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
        status: import(".prisma/client").$Enums.AmbassadorStatus;
        displayName: string;
        handle: string;
        primaryPlatform: import(".prisma/client").$Enums.SourcePlatform;
    };
    detectionRecords: {
        tenantId: string;
        ruleCode: string;
        severity: import(".prisma/client").$Enums.Severity;
        id: string;
        createdAt: Date;
        contentRecordId: string;
        ruleName: string;
        matchedPhrase: string | null;
        detectionMethod: import(".prisma/client").$Enums.DetectionMethod;
    }[];
    tenantId: string;
    hasAffiliateLink: boolean;
    severity: import(".prisma/client").$Enums.Severity | null;
    id: string;
    title: string | null;
    sourcePlatform: import(".prisma/client").$Enums.SourcePlatform;
    contentType: import(".prisma/client").$Enums.ContentType;
    sourceUrl: string;
    externalContentId: string | null;
    bodyText: string;
    transcriptText: string | null;
    postedAt: Date | null;
    capturedAt: Date;
    archiveStatus: import(".prisma/client").$Enums.ArchiveStatus;
    checksum: string | null;
    compensationPosture: string | null;
    exposureLevel: string | null;
    requiresPrincipalReview: boolean | null;
    exposureReasonCodes: string | null;
    exposureSummary: string | null;
    createdAt: Date;
    updatedAt: Date;
    ambassadorId: string;
    campaignId: string | null;
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
export declare function listDisclosureFlags(tenantId: string, options: {
    archiveStatus?: string;
    ambassadorId?: string;
}): Promise<{
    detectionRecordId: any;
    ruleCode: any;
    ruleName: any;
    matchedPhrase: any;
    severity: any;
    detectionMethod: any;
    createdAt: any;
    contentRecord: {
        id: any;
        ambassadorId: any;
        sourcePlatform: any;
        capturedAt: any;
        archiveStatus: any;
        bodyTextPreview: any;
    };
    ambassador: {
        displayName: any;
        handle: any;
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
export declare function listDisclosureLog(tenantId: string, options: {
    ambassadorId?: string;
    outcome?: string;
}): Promise<{
    id: any;
    ambassadorId: any;
    ambassador: {
        displayName: any;
        handle: any;
    };
    sourcePlatform: any;
    capturedAt: any;
    archiveStatus: any;
    bodyTextPreview: any;
    checksum: any;
    disclosureOutcome: "SATISFIED" | "NOT_SATISFIED";
    disclosureHits: any;
}[]>;
/**
 * Check whether a content record with this checksum
 * already exists in the archive.
 * Used at ingestion to prevent duplicate captures.
 */
export declare function findByChecksum(tenantId: string, checksum: string): Promise<{
    id: string;
    capturedAt: Date;
    ambassadorId: string;
} | null>;
//# sourceMappingURL=contentRecord.service.d.ts.map