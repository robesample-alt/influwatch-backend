"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Phyllo → InfluWatch Content Mapper
//
// Maps Phyllo content objects to CreateContentRecordInput
// for the existing ingestion pipeline.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPhylloContent = mapPhylloContent;
const client_1 = require("@prisma/client");
// Phyllo content type → InfluWatch ContentType enum
const CONTENT_TYPE_MAP = {
    'VIDEO': 'VIDEO',
    'IMAGE': 'IMAGE_POST',
    'REEL': 'REEL',
    'STORY': 'STORY',
    'SHORT': 'SHORT_FORM_VIDEO',
    'TWEET': 'TWEET',
    'THREAD': 'THREAD',
    'POST': 'LONG_FORM_POST',
    'CAROUSEL': 'CAROUSEL',
    'LIVE': 'LIVE_STREAM',
    'PODCAST': 'PODCAST_EPISODE',
};
// Phyllo platform → InfluWatch SourcePlatform enum
const PLATFORM_MAP = {
    'instagram': 'INSTAGRAM',
    'youtube': 'YOUTUBE',
    'tiktok': 'TIKTOK',
    'twitter': 'TWITTER_X',
    'facebook': 'FACEBOOK',
    'linkedin': 'LINKEDIN',
    'telegram': 'TELEGRAM',
};
function mapPhylloContent(phylloContent, ambassadorId) {
    const platformName = (phylloContent.platform?.name || '').toLowerCase();
    const sourcePlatform = PLATFORM_MAP[platformName] || client_1.SourcePlatform.OTHER;
    const rawType = (phylloContent.type || '').toUpperCase();
    const contentType = CONTENT_TYPE_MAP[rawType] || client_1.ContentType.OTHER;
    const record = {
        ambassadorId,
        sourcePlatform,
        contentType,
        sourceUrl: phylloContent.url || '',
        externalContentId: phylloContent.external_id || phylloContent.id,
        title: phylloContent.title,
        bodyText: phylloContent.description || phylloContent.title || '[No caption]',
        transcriptText: undefined,
        postedAt: phylloContent.published_at || undefined,
    };
    const assets = [];
    if (phylloContent.thumbnail_url) {
        assets.push({
            assetType: 'THUMBNAIL',
            assetUrl: phylloContent.thumbnail_url,
            mimeType: 'image/jpeg',
        });
    }
    if (phylloContent.media_url) {
        const isVideo = contentType === client_1.ContentType.VIDEO || contentType === client_1.ContentType.REEL || contentType === client_1.ContentType.SHORT_FORM_VIDEO || contentType === client_1.ContentType.LIVE_STREAM;
        assets.push({
            assetType: (isVideo ? 'VIDEO_FILE' : 'SCREENSHOT'),
            assetUrl: phylloContent.media_url,
            mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
        });
    }
    return { record, assets };
}
//# sourceMappingURL=phylloMapper.js.map