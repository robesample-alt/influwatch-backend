// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — TenantConfig
//
// getConfig()    — returns TC-001, creates with defaults if absent
// updateConfig() — updates TC-001 with provided fields
// ============================================================

import prisma from '../utils/prisma';

const TENANT_ID = 'TC-001';

const DEFAULT_CONFIG = {
  firmName:                'Meridian Capital Partners',
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
 * Return the single tenant config row (TC-001).
 * If it doesn't exist, creates it with defaults so the
 * app always has a valid config to read.
 */
export async function getConfig() {
  return prisma.tenantConfig.upsert({
    where:  { id: TENANT_ID },
    create: { id: TENANT_ID, ...DEFAULT_CONFIG },
    update: {},
  });
}

// ─────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────

export interface UpdateConfigInput {
  firmName?:                string;
  crdNumber?:               string | null;
  secRegistration?:         string | null;
  primaryContact?:          string | null;
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
 * Update TC-001 with the provided fields.
 * Only supplied fields are changed — all others are preserved.
 * Returns the full updated config record.
 */
export async function updateConfig(input: UpdateConfigInput) {
  return prisma.tenantConfig.update({
    where: { id: TENANT_ID },
    data:  input,
  });
}
