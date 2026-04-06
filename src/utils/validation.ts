// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Utils — validation
//
// Input guards for route handlers.
// Keeps validation logic out of service layer.
// ============================================================

import {
  ArchiveStatus,
  SourcePlatform,
  ContentType,
  AssetType,
  PromoterRiskTier,
  Severity,
} from '@prisma/client';

import type {
  CreateContentRecordInput,
  CreateAmbassadorInput,
  CreateMediaAssetInput,
  ContentRecordFilters,
} from '../models/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ── Helpers ───────────────────────────────

function isEnumValue<T extends object>(enumObj: T, value: unknown): value is T[keyof T] {
  return Object.values(enumObj).includes(value);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isValidISODate(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

// ── Validators ────────────────────────────

export function validateCreateContentRecord(
  input: unknown
): ValidationResult {
  const errors: string[] = [];
  const body = input as Partial<CreateContentRecordInput>;

  if (!isNonEmptyString(body.ambassadorId)) errors.push('ambassadorId is required');
  if (!isNonEmptyString(body.sourceUrl))   errors.push('sourceUrl is required');
  if (!isNonEmptyString(body.bodyText))    errors.push('bodyText is required');

  if (!isEnumValue(SourcePlatform, body.sourcePlatform))
    errors.push(`sourcePlatform must be one of: ${Object.values(SourcePlatform).join(', ')}`);

  if (!isEnumValue(ContentType, body.contentType))
    errors.push(`contentType must be one of: ${Object.values(ContentType).join(', ')}`);

  if (body.postedAt !== undefined && !isValidISODate(body.postedAt))
    errors.push('postedAt must be a valid ISO 8601 date string');

  return { valid: errors.length === 0, errors };
}

export function validateCreateAmbassador(
  input: unknown
): ValidationResult {
  const errors: string[] = [];
  const body = input as Partial<CreateAmbassadorInput>;

  if (!isNonEmptyString(body.displayName)) errors.push('displayName is required');
  if (!isNonEmptyString(body.handle))      errors.push('handle is required');

  if (!isEnumValue(SourcePlatform, body.primaryPlatform))
    errors.push(`primaryPlatform must be one of: ${Object.values(SourcePlatform).join(', ')}`);

  if (body.riskTier != null && !isEnumValue(PromoterRiskTier, body.riskTier))
    errors.push(`riskTier must be one of: ${Object.values(PromoterRiskTier).join(', ')}`);

  return { valid: errors.length === 0, errors };
}

export function validateCreateMediaAsset(
  input: unknown
): ValidationResult {
  const errors: string[] = [];
  const body = input as Partial<CreateMediaAssetInput>;

  if (!isEnumValue(AssetType, body.assetType))
    errors.push(`assetType must be one of: ${Object.values(AssetType).join(', ')}`);

  if (!isNonEmptyString(body.assetUrl))
    errors.push('assetUrl is required');

  if (
    body.durationSeconds !== undefined &&
    (typeof body.durationSeconds !== 'number' || body.durationSeconds < 0)
  )
    errors.push('durationSeconds must be a non-negative number');

  return { valid: errors.length === 0, errors };
}

export function parseContentRecordFilters(
  query: Record<string, unknown>
): ContentRecordFilters {
  const filters: ContentRecordFilters = {};

  if (isNonEmptyString(query.ambassadorId))  filters.ambassadorId  = query.ambassadorId;
  if (isNonEmptyString(query.campaignId))    filters.campaignId    = query.campaignId;

  if (isEnumValue(SourcePlatform, query.sourcePlatform))
    filters.sourcePlatform = query.sourcePlatform;

  if (isEnumValue(ArchiveStatus, query.archiveStatus))
    filters.archiveStatus = query.archiveStatus;

  if (isEnumValue(Severity, query.severity))
    filters.severity = query.severity;

  if (isNonEmptyString(query.capturedFrom)) filters.capturedFrom = query.capturedFrom;
  if (isNonEmptyString(query.capturedTo))   filters.capturedTo   = query.capturedTo;

  // Phase 3 — exposure-based principal filter
  if (query.requiresPrincipalReview === 'true')  filters.requiresPrincipalReview = true;
  if (query.requiresPrincipalReview === 'false') filters.requiresPrincipalReview = false;

  // Phase 5 — exposure level + campaign mismatch filters
  if (isNonEmptyString(query.exposureLevel)) filters.exposureLevel = query.exposureLevel;
  if (query.compensationMismatchWithCampaign === 'true')  filters.compensationMismatchWithCampaign = true;
  if (query.compensationMismatchWithCampaign === 'false') filters.compensationMismatchWithCampaign = false;

  const page     = parseInt(String(query.page), 10);
  const pageSize = parseInt(String(query.pageSize), 10);

  filters.page     = !isNaN(page)     && page > 0     ? page     : 1;
  filters.pageSize = !isNaN(pageSize) && pageSize > 0 && pageSize <= 100
    ? pageSize
    : 25;

  return filters;
}
