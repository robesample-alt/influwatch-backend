import { ArchiveStatus, ArchiveEventType, AmbassadorStatus, AssetType, CampaignStatus, CampaignType, ContentType, Severity, SourcePlatform, InternalActorRole, InternalActorStatus, PromoterRiskTier, DetectionMethod } from '@prisma/client';
export { ArchiveStatus, ArchiveEventType, AmbassadorStatus, AssetType, CampaignStatus, CampaignType, ContentType, Severity, SourcePlatform, InternalActorRole, InternalActorStatus, PromoterRiskTier, DetectionMethod, };
export interface CreateAmbassadorInput {
    displayName: string;
    handle: string;
    primaryPlatform: SourcePlatform;
    riskTier?: PromoterRiskTier;
    assignedSupervisorId?: string;
}
export interface AssignSupervisorInput {
    assignedSupervisorId: string | null;
}
export interface CreateContentRecordInput {
    ambassadorId: string;
    campaignId?: string;
    sourcePlatform: SourcePlatform;
    contentType: ContentType;
    sourceUrl: string;
    externalContentId?: string;
    title?: string;
    bodyText: string;
    transcriptText?: string;
    postedAt?: string;
}
export interface CreateMediaAssetInput {
    assetType: AssetType;
    assetUrl: string;
    mimeType?: string;
    durationSeconds?: number;
}
export interface ContentRecordFilters {
    ambassadorId?: string;
    campaignId?: string;
    sourcePlatform?: SourcePlatform;
    archiveStatus?: ArchiveStatus;
    severity?: Severity;
    capturedFrom?: string;
    capturedTo?: string;
    requiresPrincipalReview?: boolean;
    exposureLevel?: string;
    compensationMismatchWithCampaign?: boolean;
    page?: number;
    pageSize?: number;
}
export interface UpdateArchiveStatusInput {
    archiveStatus: ArchiveStatus;
    note?: string;
    actorId?: string;
}
export interface InternalActorSummary {
    id: string;
    displayName: string;
    email: string;
    role: InternalActorRole;
    status: InternalActorStatus;
    seriesLicense: string | null;
}
export interface InternalActorResponse extends InternalActorSummary {
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface AmbassadorSummary {
    id: string;
    displayName: string;
    handle: string;
    primaryPlatform: SourcePlatform;
    status: AmbassadorStatus;
    riskTier?: PromoterRiskTier | null;
    assignedSupervisor?: InternalActorSummary | null;
}
export interface CampaignSummary {
    id: string;
    campaignName: string;
    campaignType: CampaignType;
    status: CampaignStatus;
}
export interface DetectionRecordResponse {
    id: string;
    ruleCode: string;
    ruleName: string;
    matchedPhrase: string | null;
    severity: Severity;
    detectionMethod: DetectionMethod;
    createdAt: Date;
}
export interface MediaAssetResponse {
    id: string;
    assetType: AssetType;
    assetUrl: string;
    mimeType: string | null;
    durationSeconds: number | null;
    createdAt: Date;
}
export interface ArchiveEventResponse {
    id: string;
    eventType: ArchiveEventType;
    eventNote: string | null;
    actorId: string | null;
    createdAt: Date;
}
export interface ContentRecordResponse {
    id: string;
    ambassador: AmbassadorSummary;
    campaign: CampaignSummary | null;
    sourcePlatform: SourcePlatform;
    contentType: ContentType;
    sourceUrl: string;
    externalContentId: string | null;
    title: string | null;
    bodyText: string;
    transcriptText: string | null;
    postedAt: Date | null;
    capturedAt: Date;
    archiveStatus: ArchiveStatus;
    severity: Severity | null;
    detectionRecords?: DetectionRecordResponse[];
    checksum: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export type ComplianceActionType = 'APPROVE' | 'REQUEST_EDIT' | 'WARN_PROMOTER' | 'SUSPEND_PROMOTER' | 'ESCALATE' | 'CERTIFY';
export declare const VALID_COMPLIANCE_ACTIONS: ComplianceActionType[];
export interface RecordComplianceActionInput {
    action: ComplianceActionType;
    note?: string;
    actorId?: string;
}
export interface AppendEventInput {
    contentRecordId: string;
    eventType: ArchiveEventType;
    eventNote?: string;
    actorId?: string;
}
//# sourceMappingURL=types.d.ts.map