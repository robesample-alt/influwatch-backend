export interface DiscoveredLink {
    url: string;
    reason: string;
}
/**
 * Scan extracted URLs for affiliate/referral patterns.
 * Returns only URLs that look like affiliate links and are NOT
 * in the provided set of already-known URLs.
 */
export declare function discoverAffiliateLinks(urls: string[], knownUrls: Set<string>): DiscoveredLink[];
//# sourceMappingURL=affiliateLinkDiscovery.d.ts.map