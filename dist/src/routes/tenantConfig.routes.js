"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Tenant Configuration
//
// GET  /api/influwatch/config — return current tenant config
// PATCH /api/influwatch/config — update tenant config fields
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
const client_1 = require("@prisma/client");
const TenantConfigService = __importStar(require("../services/tenantConfig.service"));
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /config
//
// Returns the tenant config record for the current tenant.
// Creates it with defaults if it doesn't exist.
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        const config = await TenantConfigService.getConfig(tenantId);
        return res.status(200).json(config);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// PATCH /config
//
// Update one or more config fields.
// Only fields present in the request body are changed.
// Returns the full updated config record.
// ─────────────────────────────────────────
router.patch('/', (0, requireRole_1.requireRole)(client_1.InternalActorRole.TENANT_ADMIN), async (req, res, next) => {
    try {
        const { firmName, crdNumber, secRegistration, primaryContact, pollIntervalMinutes, historicalBackfillDays, authErrorAlertThreshold, gapReportThreshold, postContractTailDays, slaThresholdCritical, slaThresholdHigh, slaThresholdMedium, slaThresholdLow, retentionYears, objectLockMode, } = req.body;
        const tenantId = req.user.tenantId;
        // Reject empty PATCH
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'Request body must contain at least one field to update' });
        }
        // Validate numeric fields if provided
        const numericFields = [
            ['pollIntervalMinutes', pollIntervalMinutes],
            ['historicalBackfillDays', historicalBackfillDays],
            ['authErrorAlertThreshold', authErrorAlertThreshold],
            ['gapReportThreshold', gapReportThreshold],
            ['postContractTailDays', postContractTailDays],
            ['slaThresholdCritical', slaThresholdCritical],
            ['slaThresholdHigh', slaThresholdHigh],
            ['slaThresholdMedium', slaThresholdMedium],
            ['slaThresholdLow', slaThresholdLow],
            ['retentionYears', retentionYears],
        ];
        for (const [field, val] of numericFields) {
            if (val !== undefined && (typeof val !== 'number' || !Number.isInteger(val) || val < 1)) {
                return res.status(400).json({ error: `${field} must be a positive integer` });
            }
        }
        // Build update payload from only the supplied fields
        const input = {
            ...(firmName !== undefined ? { firmName } : {}),
            ...(crdNumber !== undefined ? { crdNumber } : {}),
            ...(secRegistration !== undefined ? { secRegistration } : {}),
            ...(primaryContact !== undefined ? { primaryContact } : {}),
            ...(pollIntervalMinutes !== undefined ? { pollIntervalMinutes } : {}),
            ...(historicalBackfillDays !== undefined ? { historicalBackfillDays } : {}),
            ...(authErrorAlertThreshold !== undefined ? { authErrorAlertThreshold } : {}),
            ...(gapReportThreshold !== undefined ? { gapReportThreshold } : {}),
            ...(postContractTailDays !== undefined ? { postContractTailDays } : {}),
            ...(slaThresholdCritical !== undefined ? { slaThresholdCritical } : {}),
            ...(slaThresholdHigh !== undefined ? { slaThresholdHigh } : {}),
            ...(slaThresholdMedium !== undefined ? { slaThresholdMedium } : {}),
            ...(slaThresholdLow !== undefined ? { slaThresholdLow } : {}),
            ...(retentionYears !== undefined ? { retentionYears } : {}),
            ...(objectLockMode !== undefined ? { objectLockMode } : {}),
        };
        const updated = await TenantConfigService.updateConfig(tenantId, input);
        return res.status(200).json(updated);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=tenantConfig.routes.js.map