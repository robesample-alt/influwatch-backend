// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Utils — checksum
//
// SHA-256 checksum of (sourceUrl + bodyText).
// Used for deduplication at ingestion and
// tamper-detection during audit review.
// ============================================================

import { createHash } from 'crypto';

/**
 * Produce a stable SHA-256 hex digest for a content record.
 * Inputs are trimmed and lowercased for URL normalization.
 */
export function computeChecksum(sourceUrl: string, bodyText: string): string {
  const normalized = `${sourceUrl.trim().toLowerCase()}::${bodyText.trim()}`;
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Verify that a stored checksum still matches the record's content.
 * Returns false if content has been altered since archival.
 */
export function verifyChecksum(
  sourceUrl: string,
  bodyText: string,
  storedChecksum: string
): boolean {
  return computeChecksum(sourceUrl, bodyText) === storedChecksum;
}
