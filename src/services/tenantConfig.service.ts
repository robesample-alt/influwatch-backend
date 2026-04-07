// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — TenantConfig
//
// getConfig(tenantId)          — returns config, creates with defaults if absent
// updateConfig(tenantId, input) — updates config with provided fields
// ============================================================

import { withTenantContext } from '../utils/tenantContext';

const DEFAULT_CONFIG = {
  pollIntervalMinutes:     60,
  historicalBackfillDays:  30,
  authErrorAlertThreshold: 3,
  gapReportThreshold:      2,
  postContractTailDays:    60,
  slaThresholdCritical:    24,
  slaThresholdHigh:        48,
  slaThresholdMedium:      120,
  slaThresholdLow:         240,
  retentionYears:          7,
  objectLockMode:          'COMPLIANCE',
} as const;

// ─────────────────────────────────────────
// GET
// ─────────────────────────────────────────

/**
 * Return the tenant config row for the given tenantId.
 * If it doesn't exist, creates it with defaults so the
 * app always has a valid config to read.
 */
export async function getConfig(tenantId: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    const config = await tx.tenantConfig.upsert({
      where:  { tenantId },
      create: { tenantId, ...DEFAULT_CONFIG },
      update: {},
    });
    // Include tenant-level fields (tenantType) alongside config
    const tenant = await tx.tenant.findFirst({
      where: { id: tenantId },
      select: { firmName: true, crdNumber: true, secRegistration: true, tenantType: true },
    });
    return {
      ...config,
      firmName:        tenant?.firmName ?? null,
      crdNumber:       tenant?.crdNumber ?? null,
      secRegistration: tenant?.secRegistration ?? null,
      tenantType:      tenant?.tenantType ?? 'BD',
    };
  });
}

// ─────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────

export interface UpdateConfigInput {
  pollIntervalMinutes?:     number;
  historicalBackfillDays?:  number;
  authErrorAlertThreshold?: number;
  gapReportThreshold?:      number;
  postContractTailDays?:    number;
  slaThresholdCritical?:    number;
  slaThresholdHigh?:        number;
  slaThresholdMedium?:      number;
  slaThresholdLow?:         number;
  retentionYears?:          number;
  objectLockMode?:          string;
}

/**
 * Update the tenant config with the provided fields.
 * Only supplied fields are changed — all others are preserved.
 * Returns the full updated config record.
 */
export async function updateConfig(tenantId: string, input: UpdateConfigInput) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.tenantConfig.update({
      where: { tenantId },
      data:  input,
    });
  });
}

// ─────────────────────────────────────────
// TENANT TYPE
// ─────────────────────────────────────────

export const VALID_TENANT_TYPES = new Set(['BD', 'ISSUER', 'REG_CF', 'FINTECH', 'RIA']);

export async function updateTenantType(tenantId: string, tenantType: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.tenant.update({
      where: { id: tenantId },
      data:  { tenantType },
      select: { id: true, firmName: true, tenantType: true },
    });
  });
}
