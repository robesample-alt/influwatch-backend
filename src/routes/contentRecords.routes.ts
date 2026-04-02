// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Content Records
//
// Express-compatible route handlers.
// All business logic delegated to service layer.
// Routes handle: request parsing, validation, response shaping.
// ============================================================

import { Request, Response, NextFunction } from 'express';

import * as ContentRecordService from '../services/contentRecord.service';
import * as AmbassadorService    from '../services/ambassador.service';

import {
  validateCreateContentRecord,
  validateCreateMediaAsset,
  parseContentRecordFilters,
} from '../utils/validation';

import { ArchiveEventType } from '@prisma/client';
import type { UpdateArchiveStatusInput } from '../models/types';
import { VALID_COMPLIANCE_ACTIONS } from '../models/types';

// ─────────────────────────────────────────
// POST /content-records
//
// Archive a new content record.
// Validates input, checks for duplicates by checksum,
// creates record, appends RECORD_CREATED event.
// ─────────────────────────────────────────

export async function createContentRecord(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { valid, errors } = validateCreateContentRecord(req.body);
    if (!valid) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Verify ambassador exists
    const ambassador = await AmbassadorService.getAmbassadorById(req.body.ambassadorId);
    if (!ambassador) {
      return res.status(404).json({ error: 'Ambassador not found', ambassadorId: req.body.ambassadorId });
    }

    // Dedup check
    const { computeChecksum } = await import('../utils/checksum');
    const checksum = computeChecksum(req.body.sourceUrl, req.body.bodyText);
    const duplicate = await ContentRecordService.findByChecksum(checksum);

    if (duplicate) {
      return res.status(409).json({
        error:      'Duplicate content detected',
        existingId: duplicate.id,
        capturedAt: duplicate.capturedAt,
      });
    }

    const record = await ContentRecordService.createContentRecord(req.body);

    return res.status(201).json(record);
  } catch (err) {
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

export async function listContentRecords(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = parseContentRecordFilters(req.query as Record<string, unknown>);
    const result  = await ContentRecordService.listContentRecords(filters);
    return res.status(200).json(result);
  } catch (err) {
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

export async function listCertifiedRecords(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const records = await ContentRecordService.getCertifiedRecords();
    return res.status(200).json(records);
  } catch (err) {
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

export async function listAuditEvents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page     = Math.max(1,   parseInt(req.query.page     as string) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize as string) || 50));
    const category = req.query.category as string | undefined;

    const result = await ContentRecordService.listAuditEvents({ page, pageSize, category });
    return res.status(200).json(result);
  } catch (err) {
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

export async function listRemediationRecords(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const records = await ContentRecordService.getRemediationRecords();
    return res.status(200).json(records);
  } catch (err) {
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

export async function listSlaBreachedRecords(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const records = await ContentRecordService.getSlaBreachedRecords();
    return res.status(200).json({ count: records.length, records });
  } catch (err) {
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

export async function listDisclosureLog(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ambassadorId = req.query.ambassadorId as string | undefined;
    const outcome      = req.query.outcome      as string | undefined;
    const records = await ContentRecordService.listDisclosureLog({ ambassadorId, outcome });
    return res.status(200).json({ count: records.length, records });
  } catch (err) {
    next(err);
  }
}

export async function listDisclosureFlags(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const archiveStatus = req.query.status      as string | undefined;
    const ambassadorId  = req.query.ambassadorId as string | undefined;
    const flags = await ContentRecordService.listDisclosureFlags({ archiveStatus, ambassadorId });
    return res.status(200).json({ count: flags.length, flags });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// GET /content-records/:id
//
// Retrieve a single content record by ID.
// ─────────────────────────────────────────

export async function getContentRecord(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const record = await ContentRecordService.getContentRecordById(req.params.id);

    if (!record) {
      return res.status(404).json({ error: 'Content record not found', id: req.params.id });
    }

    return res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// GET /content-records/:id/events
//
// Retrieve the full immutable audit event log
// for a content record, ordered chronologically.
// ─────────────────────────────────────────

export async function getContentRecordEvents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const events = await ContentRecordService.getEventLog(req.params.id);
    return res.status(200).json({ contentRecordId: req.params.id, events });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// GET /content-records/:id/assets
//
// Retrieve all media assets attached to a
// content record.
// ─────────────────────────────────────────

export async function getContentRecordAssets(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const assets = await ContentRecordService.getMediaAssets(req.params.id);
    return res.status(200).json({ contentRecordId: req.params.id, assets });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// POST /content-records/:id/assets
//
// Attach a media asset to a content record.
// ─────────────────────────────────────────

export async function attachAsset(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { valid, errors } = validateCreateMediaAsset(req.body);
    if (!valid) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const asset = await ContentRecordService.attachMediaAsset(req.params.id, req.body);
    return res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// PATCH /content-records/:id/status
//
// Update the archive status of a content record.
// Appends STATUS_CHANGED to the event log.
// ─────────────────────────────────────────

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { archiveStatus, note } = req.body as UpdateArchiveStatusInput;

    if (!archiveStatus) {
      return res.status(400).json({ error: 'archiveStatus is required' });
    }

    // actorId would come from auth middleware in production
    const actorId = (req as any).user?.id;

    const updated = await ContentRecordService.updateArchiveStatus(req.params.id, {
      archiveStatus,
      note,
      actorId,
    });

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────
// POST /content-records/:id/events
//
// Manually append a note or event to the audit log.
// Used by compliance operators to annotate records.
// ─────────────────────────────────────────

export async function appendEvent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { eventType, eventNote } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const actorId = (req as any).user?.id;

    const event = await ContentRecordService.appendEvent({
      contentRecordId: req.params.id,
      eventType:       eventType as ArchiveEventType,
      eventNote,
      actorId,
    });

    return res.status(201).json(event);
  } catch (err) {
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

export async function recordAction(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { action, note } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }

    if (!VALID_COMPLIANCE_ACTIONS.includes(action)) {
      return res.status(400).json({
        error:        'Invalid action',
        validActions: VALID_COMPLIANCE_ACTIONS,
      });
    }

    const actorId = (req as any).user?.id;

    const record = await ContentRecordService.recordComplianceAction(
      req.params.id,
      { action, note, actorId }
    );

    return res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}
