import { CreateContentRecordInput, CreateMediaAssetInput } from '../models/types';
export interface PhylloContent {
    id: string;
    external_id?: string;
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    media_url?: string;
    thumbnail_url?: string;
    published_at?: string;
    platform?: {
        name?: string;
    };
    engagement?: {
        like_count?: number;
        comment_count?: number;
        share_count?: number;
        view_count?: number;
    };
}
export declare function mapPhylloContent(phylloContent: PhylloContent, ambassadorId: string): {
    record: CreateContentRecordInput;
    assets: CreateMediaAssetInput[];
};
//# sourceMappingURL=phylloMapper.d.ts.map