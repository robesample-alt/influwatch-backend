// ============================================================
// FUNDUREX — INFLUWATCH
// Routes — Phyllo Integration
//
// POST /api/influwatch/phyllo/connect    — get SDK token for Connect widget (authenticated)
// POST /api/influwatch/phyllo/account    — store connected account ID (authenticated)
// POST /api/influwatch/phyllo/webhook    — receive Phyllo events (public, no JWT)
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import * as PhylloService from '../services/phyllo.service';
import { mapPhylloContent } from '../lib/phylloMapper';
import { createContentRecord, attachMediaAsset, appendEvent } from '../services/contentRecord.service';
import logger from '../utils/logger';

const router = Router();

// ─────────────────────────────────────────
// POST /phyllo/connect
//
// Returns an SDK token for the Phyllo Connect widget.
// The frontend uses this to let the promoter connect
// their social account.
//
// Body: { ambassadorId: string }
// ─────────────────────────────────────────

router.post('/connect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const { ambassadorId } = req.body;

    if (!ambassadorId) {
      return res.status(400).json({ error: 'ambassadorId is required' });
    }

    const result = await PhylloService.createSdkToken(tenantId, ambassadorId);

    return res.status(200).json({
      sdkToken:     result.token,
      phylloUserId: result.phylloUserId,
      environment:  process.env.PHYLLO_ENVIRONMENT || 'staging',
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /phyllo/account
//
// Called by the frontend after the Connect widget
// fires the accountConnected callback.
// Stores the Phyllo account ID on the ambassador.
//
// Body: { ambassadorId: string, phylloAccountId: string }
// ─────────────────────────────────────────

router.post('/account', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const { ambassadorId, phylloAccountId } = req.body;

    if (!ambassadorId || !phylloAccountId) {
      return res.status(400).json({ error: 'ambassadorId and phylloAccountId are required' });
    }

    await PhylloService.linkPhylloAccount(tenantId, ambassadorId, phylloAccountId);

    return res.status(200).json({ ok: true, ambassadorId, phylloAccountId });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /phyllo/webhook
//
// Receives Phyllo webhook events.
// Public endpoint — no JWT required.
// Handles CONTENTS.ADDED events by fetching content
// and creating ContentRecords via the existing pipeline.
// ─────────────────────────────────────────

export async function phylloWebhookHandler(req: Request, res: Response) {
  try {
    const event = req.body;

    logger.info({ event: event.event, accountId: event.account_id }, 'Phyllo webhook received');

    // Only process content events
    if (!event.event || !event.event.startsWith('CONTENTS.')) {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const phylloAccountId = event.account_id;
    if (!phylloAccountId) {
      logger.warn('Phyllo webhook missing account_id');
      return res.status(200).json({ ok: true, skipped: true });
    }

    // Find the ambassador linked to this Phyllo account
    const ambassador = await PhylloService.findAmbassadorByPhylloAccount(phylloAccountId);
    if (!ambassador) {
      logger.warn({ phylloAccountId }, 'Phyllo webhook — no ambassador found for account');
      return res.status(200).json({ ok: true, skipped: true });
    }

    // Fetch the actual content from Phyllo
    const contents = await PhylloService.fetchPhylloContent(phylloAccountId);

    let ingested = 0;
    for (const phylloItem of contents) {
      const { record, assets } = mapPhylloContent(phylloItem, ambassador.id);

      try {
        // Create content record via existing pipeline (detection, severity, audit)
        const created = await createContentRecord(ambassador.tenantId, record);

        // Attach media assets
        for (const asset of assets) {
          await attachMediaAsset(ambassador.tenantId, created.id, asset);
        }

        // Log ingestion event
        await appendEvent(ambassador.tenantId, {
          contentRecordId: created.id,
          eventType: 'RECORD_CREATED',
          eventNote: `Auto-ingested via Phyllo from ${record.sourcePlatform} — ${record.sourceUrl}`,
          actorId: 'PHYLLO',
        });

        ingested++;
      } catch (err: any) {
        // Skip duplicates (checksum match) silently
        if (err.message?.includes('checksum')) {
          logger.debug({ externalId: phylloItem.external_id }, 'Phyllo content skipped — duplicate');
        } else {
          logger.error({ err, externalId: phylloItem.external_id }, 'Failed to ingest Phyllo content');
        }
      }
    }

    logger.info({ phylloAccountId, ingested, total: contents.length }, 'Phyllo webhook processed');
    return res.status(200).json({ ok: true, ingested });
  } catch (err) {
    logger.error({ err }, 'Phyllo webhook handler error');
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export default router;
