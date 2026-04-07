// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Tenant Configuration
//
// GET  /api/influwatch/config — return current tenant config
// PATCH /api/influwatch/config — update tenant config fields
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { InternalActorRole } from '@prisma/client';
import * as TenantConfigService from '../services/tenantConfig.service';
import { withTenantContext } from '../utils/tenantContext';
import { VALID_TENANT_TYPES } from '../services/tenantConfig.service';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// ─────────────────────────────────────────
// GET /config
//
// Returns the tenant config record for the current tenant.
// Creates it with defaults if it doesn't exist.
// ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const config = await TenantConfigService.getConfig(tenantId);
    return res.status(200).json(config);
  } catch (err) {
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

router.patch('/', requireRole(InternalActorRole.TENANT_ADMIN, InternalActorRole.REGISTERED_PRINCIPAL), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      firmName,
      crdNumber,
      secRegistration,
      primaryContact,
      pollIntervalMinutes,
      historicalBackfillDays,
      authErrorAlertThreshold,
      gapReportThreshold,
      postContractTailDays,
      slaThresholdCritical,
      slaThresholdHigh,
      slaThresholdMedium,
      slaThresholdLow,
      retentionYears,
      objectLockMode,
    } = req.body;

    const tenantId = req.user!.tenantId;

    // Reject empty PATCH
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body must contain at least one field to update' });
    }

    // Validate numeric fields if provided
    const numericFields: [string, unknown][] = [
      ['pollIntervalMinutes',     pollIntervalMinutes],
      ['historicalBackfillDays',  historicalBackfillDays],
      ['authErrorAlertThreshold', authErrorAlertThreshold],
      ['gapReportThreshold',      gapReportThreshold],
      ['postContractTailDays',    postContractTailDays],
      ['slaThresholdCritical',    slaThresholdCritical],
      ['slaThresholdHigh',        slaThresholdHigh],
      ['slaThresholdMedium',      slaThresholdMedium],
      ['slaThresholdLow',         slaThresholdLow],
      ['retentionYears',          retentionYears],
    ];
    for (const [field, val] of numericFields) {
      if (val !== undefined && (typeof val !== 'number' || !Number.isInteger(val) || val < 1)) {
        return res.status(400).json({ error: `${field} must be a positive integer` });
      }
    }

    // Handle Tenant-level fields (firmName, crdNumber, secRegistration)
    // These live on the Tenant model, not TenantConfig.
    const tenantFields: Record<string, string> = {};
    if (firmName        !== undefined) tenantFields.firmName        = firmName;
    if (crdNumber       !== undefined) tenantFields.crdNumber       = crdNumber;
    if (secRegistration !== undefined) tenantFields.secRegistration = secRegistration;
    if (Object.keys(tenantFields).length > 0) {
      await withTenantContext({ tenantId }, async (tx) => {
        await tx.tenant.update({ where: { id: tenantId }, data: tenantFields });
      });
    }

    // Build update payload from only the TenantConfig fields
    const input: TenantConfigService.UpdateConfigInput = {
      ...(primaryContact          !== undefined ? { primaryContact }          : {}),
      ...(pollIntervalMinutes     !== undefined ? { pollIntervalMinutes }     : {}),
      ...(historicalBackfillDays  !== undefined ? { historicalBackfillDays }  : {}),
      ...(authErrorAlertThreshold !== undefined ? { authErrorAlertThreshold } : {}),
      ...(gapReportThreshold      !== undefined ? { gapReportThreshold }      : {}),
      ...(postContractTailDays    !== undefined ? { postContractTailDays }    : {}),
      ...(slaThresholdCritical    !== undefined ? { slaThresholdCritical }    : {}),
      ...(slaThresholdHigh        !== undefined ? { slaThresholdHigh }        : {}),
      ...(slaThresholdMedium      !== undefined ? { slaThresholdMedium }      : {}),
      ...(slaThresholdLow         !== undefined ? { slaThresholdLow }         : {}),
      ...(retentionYears          !== undefined ? { retentionYears }          : {}),
      ...(objectLockMode          !== undefined ? { objectLockMode }          : {}),
    };

    // Handle tenantType separately — lives on Tenant, not TenantConfig
    const { tenantType } = req.body;
    if (tenantType !== undefined) {
      if (!VALID_TENANT_TYPES.has(tenantType)) {
        return res.status(400).json({
          error: 'Invalid tenantType. Must be one of: BD, ISSUER, REG_CF, FINTECH, RIA',
          received: tenantType,
        });
      }
      await TenantConfigService.updateTenantType(tenantId, tenantType);
    }

    // Update TenantConfig fields (if any non-tenantType fields were provided)
    if (Object.keys(input).length > 0) {
      await TenantConfigService.updateConfig(tenantId, input);
    }

    // Return the full config (includes tenantType)
    const fullConfig = await TenantConfigService.getConfig(tenantId);
    return res.status(200).json(fullConfig);
  } catch (err) {
    next(err);
  }
});

export default router;
