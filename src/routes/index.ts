// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Router — mounts all InfluWatch Phase 1 routes
//
// Mount this router in the main app:
//   app.use('/api/influwatch', influWatchRouter)
// ============================================================

import { Router } from 'express';
import * as ContentRoutes from './contentRecords.routes';

const router = Router();

// ─────────────────────────────────────────
// Content Records
// ─────────────────────────────────────────

// Create + list
router.post('/',      ContentRoutes.createContentRecord);
router.get('/',       ContentRoutes.listContentRecords);

// Global audit event log (must be before /:id)
router.get('/events',      ContentRoutes.listAuditEvents);

// Certified records (must be before /:id)
router.get('/certified',   ContentRoutes.listCertifiedRecords);

// Remediation records (must be before /:id)
router.get('/remediation', ContentRoutes.listRemediationRecords);

// SLA breached records (must be before /:id)
router.get('/sla-breached', ContentRoutes.listSlaBreachedRecords);

// Disclosure flags — DISC- rule hits (must be before /:id)
router.get('/disclosure-flags', ContentRoutes.listDisclosureFlags);

// Disclosure log — per-record grouped view (must be before /:id)
router.get('/disclosure-log', ContentRoutes.listDisclosureLog);

// Single record
router.get('/:id',    ContentRoutes.getContentRecord);

// Status update
router.patch('/:id/status', ContentRoutes.updateStatus);

// Event log
router.get('/:id/events',   ContentRoutes.getContentRecordEvents);
router.post('/:id/events',  ContentRoutes.appendEvent);

// Compliance actions
router.post('/:id/actions', ContentRoutes.recordAction);

// Media assets
router.get('/:id/assets',   ContentRoutes.getContentRecordAssets);
router.post('/:id/assets',  ContentRoutes.attachAsset);

export default router;
