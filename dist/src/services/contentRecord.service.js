"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — ContentRecord
//
// All database operations for content records.
// Route handlers call this layer only — no Prisma in routes.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContentRecord = createContentRecord;
exports.listContentRecords = listContentRecords;
exports.getContentRecordById = getContentRecordById;
exports.updateArchiveStatus = updateArchiveStatus;
exports.getMediaAssets = getMediaAssets;
exports.attachMediaAsset = attachMediaAsset;
exports.appendEvent = appendEvent;
exports.getEventLog = getEventLog;
exports.recordComplianceAction = recordComplianceAction;
exports.getRemediationRecords = getRemediationRecords;
exports.getCertifiedRecords = getCertifiedRecords;
exports.listAuditEvents = listAuditEvents;
exports.getSlaBreachedRecords = getSlaBreachedRecords;
exports.listDisclosureFlags = listDisclosureFlags;
exports.listDisclosureLog = listDisclosureLog;
exports.findByChecksum = findByChecksum;
const tenantContext_1 = require("../utils/tenantContext");
const checksum_1 = require("../utils/checksum");
const ruleRegistry_1 = require("../lib/ruleRegistry");
const severityEngine_1 = require("../lib/severityEngine");
const llmDetection_1 = require("../lib/llmDetection");
const exposureEngine_1 = require("../lib/exposureEngine");
const campaignConformance_1 = require("../lib/campaignConformance");
const client_1 = require("@prisma/client");
const sla_1 = require("../utils/sla");
const client_2 = require("@prisma/client");
const mailer_1 = require("../utils/mailer");
// ─────────────────────────────────────────
// AMBASSADOR INCLUDE SHAPE
// Reused in all queries that return records
// ─────────────────────────────────────────
const ambassadorSelect = {
    id: true,
    displayName: true,
    handle: true,
    primaryPlatform: true,
    status: true,
};
const campaignSelect = {
    id: true,
    campaignName: true,
    campaignType: true,
    status: true,
};
const ESCALATION_STATUS_MAP = {
    HIGH: 'NON_COMPLIANT',
    MEDIUM: 'REVIEW_REQUIRED',
    LOW: 'LOG_ONLY',
};
/**
 * Derives an escalation level from detection hits.
 * HIGH   → CRITICAL/HIGH severity, or any DISC-001/DISC-002 hit
 * MEDIUM → MEDIUM severity only
 * LOW    → no hits or LOW severity only
 */
function computeEscalation(hits) {
    if (hits.length === 0)
        return { level: 'LOW', status: 'LOG_ONLY' };
    const baseHits = hits.filter(h => !h.ruleCode.startsWith('DISC-'));
    const topSeverity = (0, ruleRegistry_1.computeSeverityFromHits)(baseHits);
    const hasDisc001 = hits.some(h => h.ruleCode === 'DISC-001');
    const hasDisc002 = hits.some(h => h.ruleCode === 'DISC-002');
    const hasCritOrHigh = topSeverity === 'CRITICAL' || topSeverity === 'HIGH';
    const level = (hasCritOrHigh || hasDisc001) ? 'HIGH' :
        (topSeverity === 'MEDIUM' || hasDisc002) ? 'MEDIUM' :
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
async function createContentRecord(tenantId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const checksum = (0, checksum_1.computeChecksum)(input.sourceUrl, input.bodyText);
        const bodyText = input.bodyText ?? '';
        // ── Compensation context resolution ───────────────────────────────────────
        // Fetch the promoter's most recent CompensationStructure. If found, build
        // CompensationContext so COMP-001/002/003 rules are evaluated at ingestion.
        // Promoters with no CompensationStructure skip COMP evaluation entirely.
        const compensationStructure = await tx.compensationStructure.findFirst({
            where: { promoterId: input.ambassadorId, tenantId },
            orderBy: { createdAt: 'desc' },
        });
        let compensationCtx;
        let compensationPosture = null;
        let hasAffiliateLink = false;
        let hasReferralCode = false;
        if (compensationStructure) {
            // Extract URLs from bodyText, normalize: lowercase, strip query params, strip trailing slash
            const URL_REGEX = /https?:\/\/[^\s"'<>)\]]+/gi;
            const rawUrls = bodyText.match(URL_REGEX) ?? [];
            const normalize = (url) => url.toLowerCase().replace(/\?.*$/, '').replace(/\/+$/, '');
            const extractedUrls = rawUrls.map(normalize);
            // Fetch active AffiliateLinks for this promoter (URLs + referral codes)
            const affiliateLinks = await tx.affiliateLink.findMany({
                where: { promoterId: input.ambassadorId, tenantId, active: true },
                select: { url: true, referralCode: true },
            });
            // Match URLs
            if (extractedUrls.length > 0) {
                const normalizedStored = affiliateLinks.map(l => normalize(l.url));
                hasAffiliateLink = extractedUrls.some(u => normalizedStored.includes(u));
            }
            // Match referral codes — case-insensitive scan of body text
            const referralCodes = affiliateLinks
                .map(l => l.referralCode)
                .filter((c) => !!c && c.trim().length > 0);
            if (referralCodes.length > 0) {
                const bodyLower = bodyText.toLowerCase();
                hasReferralCode = referralCodes.some(code => bodyLower.includes(code.toLowerCase()));
            }
            compensationPosture = compensationStructure.supervisionPosture;
            compensationCtx = {
                isTransactionBased: compensationStructure.isTransactionBased,
                isSecurityLinked: compensationStructure.isSecurityLinked,
                supervisionPosture: compensationStructure.supervisionPosture,
                compensationForm: compensationStructure.compensationForm,
                hasAffiliateLink,
            };
        }
        // ── Phrase-based detection (fast, deterministic) ─────────────────────────
        const phraseHits = (0, ruleRegistry_1.detectRuleHits)(bodyText, compensationCtx);
        // ── LLM contextual detection (semantic, fail-open) ───────────────────────
        // Gated on HIGH/CRITICAL posture promoters — those are the only ones where
        // the cost (latency + tokens) is justified. Flat-fee / uncompensated /
        // medium-posture promoters skip the LLM call entirely.
        //
        // The service never throws; on key-missing / timeout / API error / parse
        // error it returns an empty findings list and a non-null error. We proceed
        // with phrase-only detection in every failure case.
        const llmPosture = (compensationPosture || '').toUpperCase();
        const llmEligible = llmPosture === 'CRITICAL' || llmPosture === 'HIGH';
        let llmResult = null;
        if (llmEligible && bodyText && bodyText.trim().length > 0 && compensationStructure) {
            llmResult = await (0, llmDetection_1.runLlmDetection)({
                bodyText,
                transcriptText: input.transcriptText ?? null,
                supervisionPosture: compensationStructure.supervisionPosture,
                compensationForm: compensationStructure.compensationForm,
                isTransactionBased: compensationStructure.isTransactionBased,
                isSecurityLinked: compensationStructure.isSecurityLinked,
            });
        }
        // Merge LLM findings into the unified hits list so the downstream
        // severity + escalation logic sees every detection regardless of source.
        // LLM findings keep their own rule codes (LLM-001..LLM-005) and are
        // tagged with DetectionMethod.LLM_ANALYSIS for audit distinguishability.
        const llmHitsForMerge = (llmResult?.findings ?? []).map(f => ({
            ruleCode: f.ruleCode,
            ruleName: f.ruleName,
            matchedPhrase: f.matchedPhrase,
            severity: f.severity,
            detectionMethod: client_1.DetectionMethod.LLM_ANALYSIS,
        }));
        const hits = [...phraseHits, ...llmHitsForMerge];
        const rawSeverity = (0, ruleRegistry_1.computeSeverityFromHits)(hits);
        // SEVERITY FLOOR RULE — enforced at every write site, not just in
        // the seed/rerun scripts. Raises severity to the higher of:
        //   (a) max(detection severities, including LLM findings)
        //   (b) posture floor (CRITICAL posture → MEDIUM floor)
        const severity = (0, severityEngine_1.applySeverityFloor)(rawSeverity, hits.map(h => h.severity), compensationPosture);
        const escalation = computeEscalation(hits);
        let archiveStatus = escalation.level === 'HIGH' ? client_2.ArchiveStatus.ESCALATED :
            escalation.level === 'MEDIUM' ? client_2.ArchiveStatus.PENDING_REVIEW :
                client_2.ArchiveStatus.CAPTURED;
        // If the posture floor raised severity above LOW but hit-based
        // escalation is still LOW, promote routing to PENDING_REVIEW so
        // supervisors actually see these records. Otherwise a CRITICAL
        // posture promoter could ingest clean content that never reaches
        // anyone's queue.
        if (severity !== 'LOW' && archiveStatus === client_2.ArchiveStatus.CAPTURED) {
            archiveStatus = client_2.ArchiveStatus.PENDING_REVIEW;
        }
        // ── Campaign conformance (Phase 4) ─────────────────────────────────────
        // If the record is linked to a campaign, check whether the promoter's
        // compensation type is in the campaign's allowed list. Fetch the campaign
        // only when a campaignId is present — no extra queries otherwise.
        let campaignConformanceMismatch = null;
        let campaignConformanceSummary = null;
        if (input.campaignId) {
            const campaign = await tx.campaign.findFirst({
                where: { id: input.campaignId, tenantId },
                select: { campaignName: true, allowedCompensationTypes: true, campaignRiskMode: true },
            });
            if (campaign) {
                const conformance = (0, campaignConformance_1.checkCampaignConformance)({
                    compensationType: compensationStructure?.compensationType ?? null,
                    allowedCompensationTypesJson: campaign.allowedCompensationTypes,
                    campaignRiskMode: campaign.campaignRiskMode,
                    campaignName: campaign.campaignName,
                });
                campaignConformanceMismatch = conformance.mismatch;
                campaignConformanceSummary = conformance.summary;
            }
        }
        // ── Exposure classification (Phase 2 + Phase 3 routing + Phase 4 drift) ─
        const exposure = (0, exposureEngine_1.computeExposure)({
            compensationType: compensationStructure?.compensationType ?? null,
            transactionalityClass: compensationStructure?.transactionalityClass ?? null,
            isTransactionBased: compensationStructure?.isTransactionBased ?? false,
            isSecurityLinked: compensationStructure?.isSecurityLinked ?? false,
            severity,
            hitRuleCodes: hits.map(h => h.ruleCode),
            compensationMismatchWithCampaign: campaignConformanceMismatch,
            hasAffiliateLink,
            hasReferralCode,
        });
        const record = await tx.contentRecord.create({
            data: {
                tenantId,
                ambassadorId: input.ambassadorId,
                campaignId: input.campaignId ?? null,
                sourcePlatform: input.sourcePlatform,
                contentType: input.contentType,
                sourceUrl: input.sourceUrl,
                externalContentId: input.externalContentId ?? null,
                title: input.title ?? null,
                bodyText: input.bodyText,
                transcriptText: input.transcriptText ?? null,
                postedAt: input.postedAt ? new Date(input.postedAt) : null,
                archiveStatus,
                severity,
                checksum,
                compensationPosture,
                hasAffiliateLink,
                hasReferralCode,
                // Phase 4 — campaign conformance
                compensationMismatchWithCampaign: campaignConformanceMismatch,
                campaignConformanceSummary,
                // Phase 2 exposure — log-only, does NOT affect routing
                exposureLevel: exposure.exposureLevel,
                requiresPrincipalReview: exposure.requiresPrincipalReview,
                exposureReasonCodes: JSON.stringify(exposure.exposureReasonCodes),
                exposureSummary: exposure.exposureSummary,
            },
            include: {
                ambassador: { select: ambassadorSelect },
                campaign: { select: campaignSelect },
                detectionRecords: true,
            },
        });
        await _appendEvent(tx, tenantId, {
            contentRecordId: record.id,
            eventType: client_2.ArchiveEventType.RECORD_CREATED,
            eventNote: `Content captured from ${input.sourcePlatform} — ${input.sourceUrl}`,
        });
        if (hits.length > 0) {
            // Write one DetectionRecord per matched phrase
            await tx.detectionRecord.createMany({
                data: hits.map(h => ({
                    tenantId,
                    contentRecordId: record.id,
                    ruleCode: h.ruleCode,
                    ruleName: h.ruleName,
                    matchedPhrase: h.matchedPhrase,
                    severity: h.severity,
                    detectionMethod: h.detectionMethod,
                })),
            });
            // Narrative event log note — preserved alongside structured detection records
            const phraseList = hits.map(h => `"${h.matchedPhrase}"`).join(', ');
            await _appendEvent(tx, tenantId, {
                contentRecordId: record.id,
                eventType: client_2.ArchiveEventType.STATUS_CHANGED,
                eventNote: `Auto-flagged [${escalation.level}/${escalation.status}] — flagged language: ${phraseList}`,
            });
        }
        // ── LLM audit trail ─────────────────────────────────────────────
        // Record that the LLM service ran, what model answered, how long
        // it took, and the raw response (capped). Stored as a NOTE_ADDED
        // event so a regulator inspecting the audit log can see exactly
        // what Claude returned, even if we later change the rule schema.
        if (llmResult) {
            const rawSnippet = (llmResult.rawResponse ?? '').slice(0, 8000);
            const summary = llmResult.error
                ? `LLM detection — degraded (${llmResult.error}), skipped. Phrase-only detection applied.`
                : `LLM detection — ${llmResult.findings.length} finding${llmResult.findings.length === 1 ? '' : 's'} in ${llmResult.latencyMs}ms via ${llmResult.modelId}.`;
            await _appendEvent(tx, tenantId, {
                contentRecordId: record.id,
                eventType: client_2.ArchiveEventType.NOTE_ADDED,
                eventNote: `${summary}${rawSnippet ? '\n\nRaw response:\n' + rawSnippet : ''}`,
            });
        }
        // After record creation, send alert for HIGH escalations
        if (escalation.level === 'HIGH') {
            const ruleCodes = [...new Set(hits.map(h => h.ruleCode))];
            (0, mailer_1.sendEscalationAlert)({
                recordId: record.id,
                ambassadorId: record.ambassadorId,
                ruleCodes,
                level: escalation.level,
            }).catch(() => { }); // fire-and-forget, never block the response
        }
        return record;
    });
}
// ─────────────────────────────────────────
// LIST (with filters + pagination)
// ─────────────────────────────────────────
/**
 * List archived content records with optional filters.
 * Supports: ambassadorId, campaignId, sourcePlatform, archiveStatus.
 * Returns paginated result set.
 */
async function listContentRecords(tenantId, filters) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const { ambassadorId, campaignId, sourcePlatform, archiveStatus, severity, capturedFrom, capturedTo, requiresPrincipalReview, exposureLevel, compensationMismatchWithCampaign, page = 1, pageSize = 25, } = filters;
        const capturedAt = {};
        if (capturedFrom)
            capturedAt.gte = new Date(capturedFrom);
        if (capturedTo)
            capturedAt.lte = new Date(capturedTo);
        const where = {
            tenantId,
            ...(ambassadorId ? { ambassadorId } : {}),
            ...(campaignId ? { campaignId } : {}),
            ...(sourcePlatform ? { sourcePlatform } : {}),
            ...(archiveStatus ? { archiveStatus } : {}),
            ...(severity ? { severity } : {}),
            ...(Object.keys(capturedAt).length ? { capturedAt } : {}),
            ...(requiresPrincipalReview != null ? { requiresPrincipalReview } : {}),
            ...(exposureLevel ? { exposureLevel } : {}),
            ...(compensationMismatchWithCampaign != null ? { compensationMismatchWithCampaign } : {}),
        };
        const [total, records] = await Promise.all([
            tx.contentRecord.count({ where }),
            tx.contentRecord.findMany({
                where,
                include: {
                    ambassador: { select: ambassadorSelect },
                    campaign: { select: campaignSelect },
                },
                orderBy: { capturedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);
        return {
            data: records,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    });
}
// ─────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────
/**
 * Retrieve a single content record by ID.
 * Returns null if not found.
 */
async function getContentRecordById(tenantId, id) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const record = await tx.contentRecord.findFirst({
            where: { id, tenantId },
            include: {
                ambassador: { select: ambassadorSelect },
                campaign: { select: campaignSelect },
                detectionRecords: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!record)
            return null;
        const sla = (0, sla_1.getSlaStatus)(record.capturedAt, record.severity, record.archiveStatus);
        return {
            ...record,
            slaDeadline: sla.slaDeadline,
            slaHoursRemaining: sla.slaHoursRemaining,
            slaBreached: sla.slaBreached,
        };
    });
}
// ─────────────────────────────────────────
// UPDATE ARCHIVE STATUS
// ─────────────────────────────────────────
/**
 * Transition a record to a new archive status.
 * Automatically appends a STATUS_CHANGED event to the audit log.
 */
async function updateArchiveStatus(tenantId, id, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const existing = await tx.contentRecord.findFirstOrThrow({
            where: { id, tenantId },
            select: { archiveStatus: true },
        });
        const updated = await tx.contentRecord.update({
            where: { id },
            data: { archiveStatus: input.archiveStatus },
            include: {
                ambassador: { select: ambassadorSelect },
                campaign: { select: campaignSelect },
            },
        });
        await _appendEvent(tx, tenantId, {
            contentRecordId: id,
            eventType: client_2.ArchiveEventType.STATUS_CHANGED,
            eventNote: input.note
                ?? `Status changed: ${existing.archiveStatus} → ${input.archiveStatus}`,
            actorId: input.actorId,
        });
        return updated;
    });
}
// ─────────────────────────────────────────
// MEDIA ASSETS
// ─────────────────────────────────────────
/**
 * Get all media assets attached to a content record.
 */
async function getMediaAssets(tenantId, contentRecordId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.contentMediaAsset.findMany({
            where: { contentRecordId, tenantId },
            orderBy: { createdAt: 'asc' },
        });
    });
}
/**
 * Attach a media asset to a content record.
 * Appends MEDIA_ATTACHED event to the audit log.
 */
async function attachMediaAsset(tenantId, contentRecordId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const asset = await tx.contentMediaAsset.create({
            data: {
                tenantId,
                contentRecordId,
                assetType: input.assetType,
                assetUrl: input.assetUrl,
                mimeType: input.mimeType ?? null,
                durationSeconds: input.durationSeconds ?? null,
            },
        });
        await _appendEvent(tx, tenantId, {
            contentRecordId,
            eventType: client_2.ArchiveEventType.MEDIA_ATTACHED,
            eventNote: `Asset attached: ${input.assetType} — ${input.assetUrl}`,
        });
        return asset;
    });
}
// ─────────────────────────────────────────
// ARCHIVE EVENT LOG
// ─────────────────────────────────────────
/**
 * Internal helper — writes an event using the provided transaction client.
 * Called from within withTenantContext wrappers to keep all writes in the same tx.
 */
async function _appendEvent(tx, tenantId, input) {
    return tx.archiveEventLog.create({
        data: {
            tenantId,
            contentRecordId: input.contentRecordId,
            eventType: input.eventType,
            eventNote: input.eventNote ?? null,
            actorId: input.actorId ?? null,
        },
    });
}
/**
 * Append an event to the immutable audit log.
 * This is the ONLY write path for ArchiveEventLog.
 * Never update or delete event log rows.
 */
async function appendEvent(tenantId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return _appendEvent(tx, tenantId, input);
    });
}
/**
 * Get the full audit event log for a content record.
 * Always ordered chronologically ascending.
 */
async function getEventLog(tenantId, contentRecordId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.archiveEventLog.findMany({
            where: { contentRecordId, tenantId },
            orderBy: { createdAt: 'asc' },
        });
    });
}
// ─────────────────────────────────────────
// COMPLIANCE ACTION ENGINE — Phase 1
// ─────────────────────────────────────────
const ACTION_EVENT_MAP = {
    APPROVE: client_2.ArchiveEventType.COMPLIANCE_APPROVED,
    REQUEST_EDIT: client_2.ArchiveEventType.COMPLIANCE_EDIT_REQUESTED,
    WARN_PROMOTER: client_2.ArchiveEventType.COMPLIANCE_WARN_ISSUED,
    SUSPEND_PROMOTER: client_2.ArchiveEventType.COMPLIANCE_PROMOTER_SUSPENDED,
    ESCALATE: client_2.ArchiveEventType.COMPLIANCE_ESCALATED,
    CERTIFY: client_2.ArchiveEventType.COMPLIANCE_CERTIFIED,
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
const ACTION_STATUS_MAP = {
    APPROVE: client_2.ArchiveStatus.CLOSED,
    REQUEST_EDIT: client_2.ArchiveStatus.PENDING_REVIEW,
    WARN_PROMOTER: client_2.ArchiveStatus.REVIEWED,
    SUSPEND_PROMOTER: client_2.ArchiveStatus.ESCALATED,
    ESCALATE: client_2.ArchiveStatus.ESCALATED,
    CERTIFY: client_2.ArchiveStatus.CLOSED,
};
/**
 * Record a compliance decision against a content record.
 * Updates archiveStatus and appends an immutable audit event in one operation.
 */
async function recordComplianceAction(tenantId, contentRecordId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const newStatus = ACTION_STATUS_MAP[input.action];
        // Validate tenant ownership before updating
        await tx.contentRecord.findFirstOrThrow({
            where: { id: contentRecordId, tenantId },
            select: { id: true },
        });
        const updated = await tx.contentRecord.update({
            where: { id: contentRecordId },
            data: { archiveStatus: newStatus },
            include: {
                ambassador: { select: ambassadorSelect },
                campaign: { select: campaignSelect },
            },
        });
        await _appendEvent(tx, tenantId, {
            contentRecordId,
            eventType: ACTION_EVENT_MAP[input.action],
            eventNote: input.note ?? `Compliance action recorded: ${input.action}`,
            actorId: input.actorId,
        });
        return updated;
    });
}
// ─────────────────────────────────────────
// REMEDIATION RECORDS — Phase 1
// ─────────────────────────────────────────
const REMEDIATION_EVENT_TYPES = [
    client_2.ArchiveEventType.COMPLIANCE_EDIT_REQUESTED,
    client_2.ArchiveEventType.COMPLIANCE_WARN_ISSUED,
];
/**
 * Return content records that have had a REQUEST_EDIT or WARN_PROMOTER
 * compliance action recorded against them.
 * Each result is enriched with the most recent remediation event details.
 * Source of truth: ArchiveEventLog — no new table required.
 */
async function getRemediationRecords(tenantId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        // Most recent remediation event per content record (distinct by contentRecordId)
        const latestEvents = await tx.archiveEventLog.findMany({
            where: { tenantId, eventType: { in: [...REMEDIATION_EVENT_TYPES] } },
            orderBy: { createdAt: 'desc' },
            distinct: ['contentRecordId'],
        });
        if (!latestEvents.length)
            return [];
        const recordIds = latestEvents.map(e => e.contentRecordId);
        const records = await tx.contentRecord.findMany({
            where: { id: { in: recordIds }, tenantId },
            include: {
                ambassador: { select: ambassadorSelect },
                campaign: { select: campaignSelect },
            },
            orderBy: { capturedAt: 'desc' },
        });
        // Merge latest remediation event data into each record response
        const eventMap = new Map(latestEvents.map(e => [e.contentRecordId, e]));
        return records.map(rec => ({
            ...rec,
            latestAction: eventMap.get(rec.id)?.eventType ?? null,
            latestActionNote: eventMap.get(rec.id)?.eventNote ?? null,
            latestActionAt: eventMap.get(rec.id)?.createdAt ?? null,
        }));
    });
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
async function getCertifiedRecords(tenantId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const certEvents = await tx.archiveEventLog.findMany({
            where: { tenantId, eventType: client_2.ArchiveEventType.COMPLIANCE_CERTIFIED },
            orderBy: { createdAt: 'desc' },
            distinct: ['contentRecordId'],
        });
        if (!certEvents.length)
            return [];
        const recordIds = certEvents.map((e) => e.contentRecordId);
        const records = await tx.contentRecord.findMany({
            where: { id: { in: recordIds }, tenantId },
            include: {
                ambassador: { select: ambassadorSelect },
                campaign: { select: campaignSelect },
            },
            orderBy: { updatedAt: 'desc' },
        });
        const eventMap = new Map(certEvents.map((e) => [e.contentRecordId, e]));
        return records.map((rec) => ({
            ...rec,
            certifiedAt: eventMap.get(rec.id)?.createdAt ?? rec.updatedAt,
            certifiedNote: eventMap.get(rec.id)?.eventNote ?? 'Supervisory sign-off recorded',
            certifiedBy: eventMap.get(rec.id)?.actorId ?? null,
        }));
    });
}
// ─────────────────────────────────────────
// GLOBAL AUDIT EVENT LOG — Phase 1
// ─────────────────────────────────────────
// Maps UI category labels → sets of ArchiveEventType values
const AUDIT_CATEGORY_MAP = {
    capture: [client_2.ArchiveEventType.RECORD_CREATED, client_2.ArchiveEventType.MEDIA_ATTACHED],
    decision: [
        client_2.ArchiveEventType.STATUS_CHANGED,
        client_2.ArchiveEventType.COMPLIANCE_APPROVED,
        client_2.ArchiveEventType.COMPLIANCE_EDIT_REQUESTED,
        client_2.ArchiveEventType.COMPLIANCE_WARN_ISSUED,
        client_2.ArchiveEventType.REVIEW_STARTED,
        client_2.ArchiveEventType.REVIEW_COMPLETED,
        client_2.ArchiveEventType.NOTE_ADDED,
    ],
    escalation: [
        client_2.ArchiveEventType.COMPLIANCE_ESCALATED,
        client_2.ArchiveEventType.COMPLIANCE_PROMOTER_SUSPENDED,
        client_2.ArchiveEventType.ESCALATION_RAISED,
        client_2.ArchiveEventType.INCIDENT_LINKED,
    ],
    config: [client_2.ArchiveEventType.RECORD_PURGED, client_2.ArchiveEventType.RECORD_EXPORTED],
};
/**
 * Return a paginated, newest-first list of all ArchiveEventLog rows
 * across every content record. Powers the global Audit Log screen.
 * Optionally filtered by category (capture / decision / escalation / config).
 */
async function listAuditEvents(tenantId, options) {
    const { page = 1, pageSize = 50, category } = options;
    const eventTypes = category ? AUDIT_CATEGORY_MAP[category.toLowerCase()] : undefined;
    const where = { tenantId, ...(eventTypes?.length ? { eventType: { in: eventTypes } } : {}) };
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const [total, events] = await Promise.all([
            tx.archiveEventLog.count({ where }),
            tx.archiveEventLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
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
            data: events,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    });
}
// ─────────────────────────────────────────
// SLA BREACHED RECORDS
// ─────────────────────────────────────────
/**
 * Return all active content records (PENDING_REVIEW or ESCALATED)
 * whose SLA deadline has passed, sorted most overdue first.
 */
async function getSlaBreachedRecords(tenantId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const active = await tx.contentRecord.findMany({
            where: {
                tenantId,
                archiveStatus: { in: [client_2.ArchiveStatus.PENDING_REVIEW, client_2.ArchiveStatus.ESCALATED] },
            },
            include: {
                ambassador: { select: ambassadorSelect },
                campaign: { select: campaignSelect },
                detectionRecords: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { capturedAt: 'asc' },
        });
        const breached = active
            .map(record => {
            const sla = (0, sla_1.getSlaStatus)(record.capturedAt, record.severity, record.archiveStatus);
            return { ...record, ...sla };
        })
            .filter(record => record.slaBreached)
            .sort((a, b) => a.slaHoursRemaining - b.slaHoursRemaining);
        return breached;
    });
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
async function listDisclosureFlags(tenantId, options) {
    const { archiveStatus, ambassadorId } = options;
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const flags = await tx.detectionRecord.findMany({
            where: {
                tenantId,
                ruleCode: { startsWith: 'DISC-' },
                contentRecord: {
                    tenantId,
                    ...(archiveStatus ? { archiveStatus: archiveStatus } : {}),
                    ...(ambassadorId ? { ambassadorId } : {}),
                },
            },
            include: {
                contentRecord: {
                    select: {
                        id: true,
                        ambassadorId: true,
                        sourcePlatform: true,
                        capturedAt: true,
                        archiveStatus: true,
                        bodyText: true,
                        ambassador: {
                            select: { displayName: true, handle: true },
                        },
                    },
                },
            },
            orderBy: { contentRecord: { capturedAt: 'desc' } },
        });
        return flags.map((f) => ({
            detectionRecordId: f.id,
            ruleCode: f.ruleCode,
            ruleName: f.ruleName,
            matchedPhrase: f.matchedPhrase,
            severity: f.severity,
            detectionMethod: f.detectionMethod,
            createdAt: f.createdAt,
            contentRecord: {
                id: f.contentRecord.id,
                ambassadorId: f.contentRecord.ambassadorId,
                sourcePlatform: f.contentRecord.sourcePlatform,
                capturedAt: f.contentRecord.capturedAt,
                archiveStatus: f.contentRecord.archiveStatus,
                bodyTextPreview: f.contentRecord.bodyText.slice(0, 100),
            },
            ambassador: {
                displayName: f.contentRecord.ambassador.displayName,
                handle: f.contentRecord.ambassador.handle,
            },
        }));
    });
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
async function listDisclosureLog(tenantId, options) {
    const { ambassadorId, outcome } = options;
    const SATISFIED_STATUSES = [client_2.ArchiveStatus.REVIEWED, client_2.ArchiveStatus.CLOSED];
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        // Fetch all content records that have at least one DISC- detection record
        const records = await tx.contentRecord.findMany({
            where: {
                tenantId,
                ...(ambassadorId ? { ambassadorId } : {}),
                detectionRecords: {
                    some: { ruleCode: { startsWith: 'DISC-' } },
                },
            },
            include: {
                ambassador: { select: { id: true, displayName: true, handle: true } },
                detectionRecords: {
                    where: { ruleCode: { startsWith: 'DISC-' } },
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        ruleCode: true,
                        ruleName: true,
                        matchedPhrase: true,
                        severity: true,
                        detectionMethod: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { capturedAt: 'desc' },
        });
        const mapped = records.map((rec) => {
            const disclosureOutcome = SATISFIED_STATUSES.includes(rec.archiveStatus)
                ? 'SATISFIED'
                : 'NOT_SATISFIED';
            return {
                id: rec.id,
                ambassadorId: rec.ambassadorId,
                ambassador: {
                    displayName: rec.ambassador.displayName,
                    handle: rec.ambassador.handle,
                },
                sourcePlatform: rec.sourcePlatform,
                capturedAt: rec.capturedAt,
                archiveStatus: rec.archiveStatus,
                bodyTextPreview: rec.bodyText.slice(0, 100),
                checksum: rec.checksum,
                disclosureOutcome,
                disclosureHits: rec.detectionRecords,
            };
        });
        // Apply outcome filter in memory — outcome is derived, not a DB column
        const filtered = outcome
            ? mapped.filter((r) => r.disclosureOutcome === outcome.toUpperCase())
            : mapped;
        return filtered;
    });
}
// ─────────────────────────────────────────
// DEDUP CHECK
// ─────────────────────────────────────────
/**
 * Check whether a content record with this checksum
 * already exists in the archive.
 * Used at ingestion to prevent duplicate captures.
 */
async function findByChecksum(tenantId, checksum) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.contentRecord.findFirst({
            where: { checksum, tenantId },
            select: { id: true, capturedAt: true, ambassadorId: true },
        });
    });
}
//# sourceMappingURL=contentRecord.service.js.map