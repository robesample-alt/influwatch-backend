// ============================================================
// FUNDUREX — INFLUWATCH
// Phyllo → InfluWatch Content Mapper
//
// Maps Phyllo content objects to CreateContentRecordInput
// for the existing ingestion pipeline.
// ============================================================

import { SourcePlatform, ContentType } from '@prisma/client';
import { CreateContentRecordInput, CreateMediaAssetInput } from '../models/types';

// Phyllo content type → InfluWatch ContentType enum
const CONTENT_TYPE_MAP: Record<string, ContentType> = {
  'VIDEO':        'VIDEO',
  'IMAGE':        'IMAGE_POST',
  'REEL':         'REEL',
  'STORY':        'STORY',
  'SHORT':        'SHORT_FORM_VIDEO',
  'TWEET':        'TWEET',
  'THREAD':       'THREAD',
  'POST':         'LONG_FORM_POST',
  'CAROUSEL':     'CAROUSEL',
  'LIVE':         'LIVE_STREAM',
  'PODCAST':      'PODCAST_EPISODE',
};

// Phyllo platform → InfluWatch SourcePlatform enum
const PLATFORM_MAP: Record<string, SourcePlatform> = {
  'instagram':    'INSTAGRAM',
  'youtube':      'YOUTUBE',
  'tiktok':       'TIKTOK',
  'twitter':      'TWITTER_X',
  'facebook':     'FACEBOOK',
  'linkedin':     'LINKEDIN',
  'telegram':     'TELEGRAM',
};

export interface PhylloContent {
  id:            string;
  external_id?:  string;
  title?:        string;
  description?:  string;
  type?:         string;
  url?:          string;
  media_url?:    string;
  thumbnail_url?: string;
  published_at?: string;
  platform?:     { name?: string };
  engagement?:   {
    like_count?:    number;
    comment_count?: number;
    share_count?:   number;
    view_count?:    number;
  };
}

export function mapPhylloContent(
  phylloContent: PhylloContent,
  ambassadorId: string,
): { record: CreateContentRecordInput; assets: CreateMediaAssetInput[] } {
  const platformName = (phylloContent.platform?.name || '').toLowerCase();
  const sourcePlatform = PLATFORM_MAP[platformName] || SourcePlatform.OTHER;

  const rawType = (phylloContent.type || '').toUpperCase();
  const contentType = CONTENT_TYPE_MAP[rawType] || ContentType.OTHER;

  const record: CreateContentRecordInput = {
    ambassadorId,
    sourcePlatform,
    contentType,
    sourceUrl:         phylloContent.url || '',
    externalContentId: phylloContent.external_id || phylloContent.id,
    title:             phylloContent.title,
    bodyText:          phylloContent.description || phylloContent.title || '[No caption]',
    transcriptText:    undefined,
    postedAt:          phylloContent.published_at || undefined,
  };

  const assets: CreateMediaAssetInput[] = [];

  if (phylloContent.thumbnail_url) {
    assets.push({
      assetType: 'THUMBNAIL' as any,
      assetUrl:  phylloContent.thumbnail_url,
      mimeType:  'image/jpeg',
    });
  }

  if (phylloContent.media_url) {
    const isVideo = contentType === ContentType.VIDEO || contentType === ContentType.REEL || contentType === ContentType.SHORT_FORM_VIDEO || contentType === ContentType.LIVE_STREAM;
    assets.push({
      assetType: (isVideo ? 'VIDEO_FILE' : 'SCREENSHOT') as any,
      assetUrl:  phylloContent.media_url,
      mimeType:  isVideo ? 'video/mp4' : 'image/jpeg',
    });
  }

  return { record, assets };
}
