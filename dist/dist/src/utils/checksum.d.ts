/**
 * Produce a stable SHA-256 hex digest for a content record.
 * Inputs are trimmed and lowercased for URL normalization.
 */
export declare function computeChecksum(sourceUrl: string, bodyText: string): string;
/**
 * Verify that a stored checksum still matches the record's content.
 * Returns false if content has been altered since archival.
 */
export declare function verifyChecksum(sourceUrl: string, bodyText: string, storedChecksum: string): boolean;
//# sourceMappingURL=checksum.d.ts.map