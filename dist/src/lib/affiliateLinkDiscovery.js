"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Affiliate Link Auto-Discovery
//
// Scans content body text for URLs that look like affiliate or
// referral links based on common patterns. Unknown links get
// created as PENDING_REVIEW AffiliateLink records so the CCO
// can confirm or dismiss them.
//
// Patterns detected:
//   - URL query params: ?ref=, ?aff=, ?referral=, ?promo=,
//     ?partner=, ?campaign=, ?utm_source=influencer
//   - URL path segments: /ref/, /referral/, /affiliate/,
//     /partner/, /invite/
//   - Known link-in-bio services: linktr.ee, beacons.ai,
//     stan.store, bio.link, linkin.bio
//   - Known fintech referral domains: share.robinhood.com,
//     j.moomoo.com, webull.com/introduce
//
// Does NOT fire on URLs that already match stored affiliate links
// (those are handled by the existing URL matcher).
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverAffiliateLinks = discoverAffiliateLinks;
const AFFILIATE_QUERY_PARAMS = new Set([
    'ref', 'aff', 'referral', 'promo', 'partner', 'affiliate',
    'invite', 'referral_code', 'promo_code', 'ref_code',
]);
const AFFILIATE_PATH_PATTERNS = [
    /\/ref\//i,
    /\/referral\//i,
    /\/affiliate\//i,
    /\/partner\//i,
    /\/invite\//i,
    /\/share\//i,
    /\/introduce\//i,
];
const LINK_IN_BIO_DOMAINS = new Set([
    'linktr.ee', 'beacons.ai', 'stan.store', 'bio.link',
    'linkin.bio', 'campsite.bio', 'hoo.be', 'tap.bio',
    'lnk.bio', 'snipfeed.co',
]);
const FINTECH_REFERRAL_DOMAINS = new Set([
    'share.robinhood.com', 'j.moomoo.com', 'webull.com',
    'public.com', 'etoro.com', 'sofi.com', 'acorns.com',
    'stash.com', 'm1.com', 'plus500.com', 'tastytrade.com',
]);
/**
 * Scan extracted URLs for affiliate/referral patterns.
 * Returns only URLs that look like affiliate links and are NOT
 * in the provided set of already-known URLs.
 */
function discoverAffiliateLinks(urls, knownUrls) {
    const discovered = [];
    const seen = new Set();
    for (const rawUrl of urls) {
        const lower = rawUrl.toLowerCase().replace(/\?.*$/, '').replace(/\/+$/, '');
        if (knownUrls.has(lower))
            continue;
        if (seen.has(lower))
            continue;
        let reason = null;
        try {
            const parsed = new URL(rawUrl);
            const host = parsed.hostname.toLowerCase();
            // Check query params
            for (const [key] of parsed.searchParams) {
                if (AFFILIATE_QUERY_PARAMS.has(key.toLowerCase())) {
                    reason = 'Affiliate query parameter: ?' + key;
                    break;
                }
            }
            // Check utm_source=influencer pattern
            if (!reason) {
                const utmSource = (parsed.searchParams.get('utm_source') || '').toLowerCase();
                if (['influencer', 'promoter', 'affiliate', 'partner', 'creator'].includes(utmSource)) {
                    reason = 'UTM source indicates influencer/affiliate: utm_source=' + utmSource;
                }
            }
            // Check path patterns
            if (!reason) {
                for (const pat of AFFILIATE_PATH_PATTERNS) {
                    if (pat.test(parsed.pathname)) {
                        reason = 'Affiliate path pattern: ' + parsed.pathname;
                        break;
                    }
                }
            }
            // Check link-in-bio domains
            if (!reason && LINK_IN_BIO_DOMAINS.has(host)) {
                reason = 'Link-in-bio service: ' + host;
            }
            // Check fintech referral domains
            if (!reason) {
                for (const domain of FINTECH_REFERRAL_DOMAINS) {
                    if (host === domain || host.endsWith('.' + domain)) {
                        reason = 'Known fintech referral domain: ' + host;
                        break;
                    }
                }
            }
        }
        catch {
            // Invalid URL — skip
            continue;
        }
        if (reason) {
            seen.add(lower);
            discovered.push({ url: rawUrl, reason });
        }
    }
    return discovered;
}
//# sourceMappingURL=affiliateLinkDiscovery.js.map