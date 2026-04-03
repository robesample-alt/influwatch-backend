"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Content Records
//
// Express-compatible route handlers.
// All business logic delegated to service layer.
// Routes handle: request parsing, validation, response shaping.
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContentRecord = createContentRecord;
exports.listContentRecords = listContentRecords;
exports.listCertifiedRecords = listCertifiedRecords;
exports.listAuditEvents = listAuditEvents;
exports.listRemediationRecords = listRemediationRecords;
exports.listSlaBreachedRecords = listSlaBreachedRecords;
exports.listDisclosureLog = listDisclosureLog;
exports.listDisclosureFlags = listDisclosureFlags;
exports.getContentRecord = getContentRecord;
exports.getContentRecordEvents = getContentRecordEvents;
exports.getContentRecordAssets = getContentRecordAssets;
exports.attachAsset = attachAsset;
exports.updateStatus = updateStatus;
exports.appendEvent = appendEvent;
exports.recordAction = recordAction;
const ContentRecordService = __importStar(require("../services/contentRecord.service"));
const AmbassadorService = __importStar(require("../services/ambassador.service"));
const validation_1 = require("../utils/validation");
const types_1 = require("../models/types");
// ─────────────────────────────────────────
// POST /content-records
//
// Archive a new content record.
// Validates input, checks for duplicates by checksum,
// creates record, appends RECORD_CREATED event.
// ─────────────────────────────────────────
async function createContentRecord(req, res, next) {
    try {
        const { valid, errors } = (0, validation_1.validateCreateContentRecord)(req.body);
        if (!valid) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }
        const tenantId = req.user.tenantId;
        // Verify ambassador exists
        const ambassador = await AmbassadorService.getAmbassadorById(tenantId, req.body.ambassadorId);
        if (!ambassador) {
            return res.status(404).json({ error: 'Ambassador not found', ambassadorId: req.body.ambassadorId });
        }
        // Dedup check
        const { computeChecksum } = await Promise.resolve().then(() => __importStar(require('../utils/checksum')));
        const checksum = computeChecksum(req.body.sourceUrl, req.body.bodyText);
        const duplicate = await ContentRecordService.findByChecksum(tenantId, checksum);
        if (duplicate) {
            return res.status(409).json({
                error: 'Duplicate content detected',
                existingId: duplicate.id,
                capturedAt: duplicate.capturedAt,
            });
        }
        const record = await ContentRecordService.createContentRecord(tenantId, req.body);
        return res.status(201).json(record);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /content-records
//
// List content records with optional filters:
//   ?ambassadorId=
//   ?campaignId=
//   ?sourcePlatform=INSTAGRAM
//   ?archiveStatus=PENDING_REVIEW
//   ?page=1&pageSize=25
// ─────────────────────────────────────────
async function listContentRecords(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const filters = (0, validation_1.parseContentRecordFilters)(req.query);
        const result = await ContentRecordService.listContentRecords(tenantId, filters);
        return res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /content-records/certified
//
// Return content records that have a COMPLIANCE_CERTIFIED audit event —
// supervisory sign-offs under FINRA 3110/3130.
// Must be mounted BEFORE /:id to avoid route shadowing.
// ─────────────────────────────────────────
async function listCertifiedRecords(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const records = await ContentRecordService.getCertifiedRecords(tenantId);
        return res.status(200).json(records);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /content-records/events
//
// Return a paginated, newest-first list of ALL ArchiveEventLog rows
// across every content record. Powers the global Audit Log screen.
// Optional query params: ?page=1&pageSize=50&category=capture|decision|escalation|config
// Must be mounted BEFORE /:id to avoid route shadowing.
// ─────────────────────────────────────────
async function listAuditEvents(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize) || 50));
        const category = req.query.category;
        const result = await ContentRecordService.listAuditEvents(tenantId, { page, pageSize, category });
        return res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /content-records/remediation
//
// Return content records that have had a REQUEST_EDIT or WARN_PROMOTER
// compliance action recorded. Each result includes latestAction,
// latestActionNote, latestActionAt derived from the audit event log.
// Must be mounted BEFORE /:id to avoid route shadowing.
// ─────────────────────────────────────────
async function listRemediationRecords(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const records = await ContentRecordService.getRemediationRecords(tenantId);
        return res.status(200).json(records);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /content-records/sla-breached
//
// Return all active records (PENDING_REVIEW or ESCALATED)
// whose SLA deadline has passed, sorted most overdue first.
// Must be mounted BEFORE /:id to avoid route shadowing.
// ─────────────────────────────────────────
async function listSlaBreachedRecords(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const records = await ContentRecordService.getSlaBreachedRecords(tenantId);
        return res.status(200).json({ count: records.length, records });
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /content-records/disclosure-flags
//
// Return all detection records whose ruleCode starts with 'DISC-',
// enriched with parent content record metadata and ambassador identity.
// Powers the Automated Disclosure Checker screen.
// Optional: ?status=PENDING_REVIEW  ?ambassadorId=<id>
// Must be mounted BEFORE /:id to avoid route shadowing.
// ─────────────────────────────────────────
// ─────────────────────────────────────────
// GET /content-records/disclosure-log
//
// Content records with DISC- hits, per-record grouped.
// Optional: ?ambassadorId= ?outcome=SATISFIED|NOT_SATISFIED
// ─────────────────────────────────────────
async function listDisclosureLog(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const ambassadorId = req.query.ambassadorId;
        const outcome = req.query.outcome;
        const records = await ContentRecordService.listDisclosureLog(tenantId, { ambassadorId, outcome });
        return res.status(200).json({ count: records.length, records });
    }
    catch (err) {
        next(err);
    }
}
async function listDisclosureFlags(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const archiveStatus = req.query.status;
        const ambassadorId = req.query.ambassadorId;
        const flags = await ContentRecordService.listDisclosureFlags(tenantId, { archiveStatus, ambassadorId });
        return res.status(200).json({ count: flags.length, flags });
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /content-records/:id
//
// Retrieve a single content record by ID.
// ─────────────────────────────────────────
async function getContentRecord(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const record = await ContentRecordService.getContentRecordById(tenantId, req.params.id);
        if (!record) {
            return res.status(404).json({ error: 'Content record not found', id: req.params.id });
        }
        return res.status(200).json(record);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /content-records/:id/events
//
// Retrieve the full immutable audit event log
// for a content record, ordered chronologically.
// ─────────────────────────────────────────
async function getContentRecordEvents(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const events = await ContentRecordService.getEventLog(tenantId, req.params.id);
        return res.status(200).json({ contentRecordId: req.params.id, events });
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /content-records/:id/assets
//
// Retrieve all media assets attached to a
// content record.
// ─────────────────────────────────────────
async function getContentRecordAssets(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const assets = await ContentRecordService.getMediaAssets(tenantId, req.params.id);
        return res.status(200).json({ contentRecordId: req.params.id, assets });
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// POST /content-records/:id/assets
//
// Attach a media asset to a content record.
// ─────────────────────────────────────────
async function attachAsset(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const { valid, errors } = (0, validation_1.validateCreateMediaAsset)(req.body);
        if (!valid) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }
        const asset = await ContentRecordService.attachMediaAsset(tenantId, req.params.id, req.body);
        return res.status(201).json(asset);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// PATCH /content-records/:id/status
//
// Update the archive status of a content record.
// Appends STATUS_CHANGED to the event log.
// ─────────────────────────────────────────
async function updateStatus(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const { archiveStatus, note } = req.body;
        if (!archiveStatus) {
            return res.status(400).json({ error: 'archiveStatus is required' });
        }
        // actorId would come from auth middleware in production
        const actorId = req.user?.id;
        const updated = await ContentRecordService.updateArchiveStatus(tenantId, req.params.id, {
            archiveStatus,
            note,
            actorId,
        });
        return res.status(200).json(updated);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// POST /content-records/:id/events
//
// Manually append a note or event to the audit log.
// Used by compliance operators to annotate records.
// ─────────────────────────────────────────
async function appendEvent(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const { eventType, eventNote } = req.body;
        if (!eventType) {
            return res.status(400).json({ error: 'eventType is required' });
        }
        const actorId = req.user?.id;
        const event = await ContentRecordService.appendEvent(tenantId, {
            contentRecordId: req.params.id,
            eventType: eventType,
            eventNote,
            actorId,
        });
        return res.status(201).json(event);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// POST /content-records/:id/actions
//
// Record a compliance decision against a content record.
// Updates archiveStatus and appends an audit event atomically.
//
// Body: { action: ComplianceActionType, note?: string }
// ─────────────────────────────────────────
async function recordAction(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const { action, note } = req.body;
        if (!action) {
            return res.status(400).json({ error: 'action is required' });
        }
        if (!types_1.VALID_COMPLIANCE_ACTIONS.includes(action)) {
            return res.status(400).json({
                error: 'Invalid action',
                validActions: types_1.VALID_COMPLIANCE_ACTIONS,
            });
        }
        const actorId = req.user?.id;
        const record = await ContentRecordService.recordComplianceAction(tenantId, req.params.id, { action, note, actorId });
        return res.status(200).json(record);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=contentRecords.routes.js.map