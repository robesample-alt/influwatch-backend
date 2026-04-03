"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Utils — checksum
//
// SHA-256 checksum of (sourceUrl + bodyText).
// Used for deduplication at ingestion and
// tamper-detection during audit review.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeChecksum = computeChecksum;
exports.verifyChecksum = verifyChecksum;
const crypto_1 = require("crypto");
/**
 * Produce a stable SHA-256 hex digest for a content record.
 * Inputs are trimmed and lowercased for URL normalization.
 */
function computeChecksum(sourceUrl, bodyText) {
    const normalized = `${sourceUrl.trim().toLowerCase()}::${bodyText.trim()}`;
    return (0, crypto_1.createHash)('sha256').update(normalized, 'utf8').digest('hex');
}
/**
 * Verify that a stored checksum still matches the record's content.
 * Returns false if content has been altered since archival.
 */
function verifyChecksum(sourceUrl, bodyText, storedChecksum) {
    return computeChecksum(sourceUrl, bodyText) === storedChecksum;
}
//# sourceMappingURL=checksum.js.map