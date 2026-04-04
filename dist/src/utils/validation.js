"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Utils — validation
//
// Input guards for route handlers.
// Keeps validation logic out of service layer.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateContentRecord = validateCreateContentRecord;
exports.validateCreateAmbassador = validateCreateAmbassador;
exports.validateCreateMediaAsset = validateCreateMediaAsset;
exports.parseContentRecordFilters = parseContentRecordFilters;
const client_1 = require("@prisma/client");
// ── Helpers ───────────────────────────────
function isEnumValue(enumObj, value) {
    return Object.values(enumObj).includes(value);
}
function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
}
function isValidISODate(v) {
    if (typeof v !== 'string')
        return false;
    const d = new Date(v);
    return !isNaN(d.getTime());
}
// ── Validators ────────────────────────────
function validateCreateContentRecord(input) {
    const errors = [];
    const body = input;
    if (!isNonEmptyString(body.ambassadorId))
        errors.push('ambassadorId is required');
    if (!isNonEmptyString(body.sourceUrl))
        errors.push('sourceUrl is required');
    if (!isNonEmptyString(body.bodyText))
        errors.push('bodyText is required');
    if (!isEnumValue(client_1.SourcePlatform, body.sourcePlatform))
        errors.push(`sourcePlatform must be one of: ${Object.values(client_1.SourcePlatform).join(', ')}`);
    if (!isEnumValue(client_1.ContentType, body.contentType))
        errors.push(`contentType must be one of: ${Object.values(client_1.ContentType).join(', ')}`);
    if (body.postedAt !== undefined && !isValidISODate(body.postedAt))
        errors.push('postedAt must be a valid ISO 8601 date string');
    return { valid: errors.length === 0, errors };
}
function validateCreateAmbassador(input) {
    const errors = [];
    const body = input;
    if (!isNonEmptyString(body.displayName))
        errors.push('displayName is required');
    if (!isNonEmptyString(body.handle))
        errors.push('handle is required');
    if (!isEnumValue(client_1.SourcePlatform, body.primaryPlatform))
        errors.push(`primaryPlatform must be one of: ${Object.values(client_1.SourcePlatform).join(', ')}`);
    if (body.riskTier != null && !isEnumValue(client_1.PromoterRiskTier, body.riskTier))
        errors.push(`riskTier must be one of: ${Object.values(client_1.PromoterRiskTier).join(', ')}`);
    return { valid: errors.length === 0, errors };
}
function validateCreateMediaAsset(input) {
    const errors = [];
    const body = input;
    if (!isEnumValue(client_1.AssetType, body.assetType))
        errors.push(`assetType must be one of: ${Object.values(client_1.AssetType).join(', ')}`);
    if (!isNonEmptyString(body.assetUrl))
        errors.push('assetUrl is required');
    if (body.durationSeconds !== undefined &&
        (typeof body.durationSeconds !== 'number' || body.durationSeconds < 0))
        errors.push('durationSeconds must be a non-negative number');
    return { valid: errors.length === 0, errors };
}
function parseContentRecordFilters(query) {
    const filters = {};
    if (isNonEmptyString(query.ambassadorId))
        filters.ambassadorId = query.ambassadorId;
    if (isNonEmptyString(query.campaignId))
        filters.campaignId = query.campaignId;
    if (isEnumValue(client_1.SourcePlatform, query.sourcePlatform))
        filters.sourcePlatform = query.sourcePlatform;
    if (isEnumValue(client_1.ArchiveStatus, query.archiveStatus))
        filters.archiveStatus = query.archiveStatus;
    if (isEnumValue(client_1.Severity, query.severity))
        filters.severity = query.severity;
    const page = parseInt(String(query.page), 10);
    const pageSize = parseInt(String(query.pageSize), 10);
    filters.page = !isNaN(page) && page > 0 ? page : 1;
    filters.pageSize = !isNaN(pageSize) && pageSize > 0 && pageSize <= 100
        ? pageSize
        : 25;
    return filters;
}
//# sourceMappingURL=validation.js.map