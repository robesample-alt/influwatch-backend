"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Router — mounts all InfluWatch Phase 1 routes
//
// Mount this router in the main app:
//   app.use('/api/influwatch', influWatchRouter)
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
const express_1 = require("express");
const ContentRoutes = __importStar(require("./contentRecords.routes"));
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// Content Records
// ─────────────────────────────────────────
// Create + list
router.post('/', ContentRoutes.createContentRecord);
router.get('/', ContentRoutes.listContentRecords);
// Global audit event log (must be before /:id)
router.get('/events', ContentRoutes.listAuditEvents);
// Certified records (must be before /:id)
router.get('/certified', ContentRoutes.listCertifiedRecords);
// Remediation records (must be before /:id)
router.get('/remediation', ContentRoutes.listRemediationRecords);
// SLA breached records (must be before /:id)
router.get('/sla-breached', ContentRoutes.listSlaBreachedRecords);
// Disclosure flags — DISC- rule hits (must be before /:id)
router.get('/disclosure-flags', ContentRoutes.listDisclosureFlags);
// Disclosure log — per-record grouped view (must be before /:id)
router.get('/disclosure-log', ContentRoutes.listDisclosureLog);
// Single record
router.get('/:id', ContentRoutes.getContentRecord);
// Status update
router.patch('/:id/status', ContentRoutes.updateStatus);
// Event log
router.get('/:id/events', ContentRoutes.getContentRecordEvents);
router.post('/:id/events', ContentRoutes.appendEvent);
// Compliance actions
router.post('/:id/actions', ContentRoutes.recordAction);
// Media assets
router.get('/:id/assets', ContentRoutes.getContentRecordAssets);
router.post('/:id/assets', ContentRoutes.attachAsset);
exports.default = router;
//# sourceMappingURL=index.js.map