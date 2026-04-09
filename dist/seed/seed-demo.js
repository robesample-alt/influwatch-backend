"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Demo Seed — comprehensive dataset for CCO demo
//
// 7 promoters, 35 content records, supervisory attestations,
// escalation cases, remediation workflow.
//
// Idempotent — safe to run multiple times (uses upsert).
// Run: DATABASE_URL_ADMIN=... npx ts-node --transpile-only seed/seed-demo.ts
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const checksum_1 = require("../src/utils/checksum");
const ruleRegistry_1 = require("../src/lib/ruleRegistry");
const prisma = new client_1.PrismaClient();
const T = 'DEFAULT_TENANT';
async function main() {
    console.log('🌱 Seeding InfluWatch demo dataset...\n');
    // Set RLS tenant context so upserts pass row-level security policies
    await prisma.$executeRawUnsafe(`SET app.tenant_id = '${T}'`);
    // ─── Additional Promoters ──────────────────────────────────
    const promoters = [
        // Per-conversion (highest risk)
        { id: 'AMB-DEMO-01', displayName: 'Marcus Venn', handle: '@marcusvenn', platform: 'YOUTUBE', risk: client_1.PromoterRiskTier.CRITICAL, supervisor: 'IA-001', status: 'ACTIVE' },
        { id: 'AMB-DEMO-02', displayName: 'Jordan Blake', handle: '@jordanblake_fx', platform: 'INSTAGRAM', risk: client_1.PromoterRiskTier.CRITICAL, supervisor: 'IA-001', status: 'ACTIVE' },
        // Flat-fee
        { id: 'AMB-DEMO-03', displayName: 'Nina Castillo', handle: '@nina.castillo', platform: 'TIKTOK', risk: client_1.PromoterRiskTier.MEDIUM, supervisor: 'IA-002', status: 'ACTIVE' },
        { id: 'AMB-DEMO-04', displayName: 'Derek Tao', handle: '@derektao', platform: 'TWITTER_X', risk: client_1.PromoterRiskTier.LOW, supervisor: 'IA-002', status: 'ACTIVE' },
        // Revenue share
        { id: 'AMB-DEMO-05', displayName: 'Priya Sharma', handle: '@priya.invests', platform: 'YOUTUBE', risk: client_1.PromoterRiskTier.HIGH, supervisor: 'IA-001', status: 'ACTIVE' },
        // Uncompensated (contrast)
        { id: 'AMB-DEMO-06', displayName: 'Ryan Michaels', handle: '@ryanmichaels', platform: 'TWITTER_X', risk: client_1.PromoterRiskTier.LOW, supervisor: 'IA-003', status: 'ACTIVE' },
        // Terminated — tail period
        { id: 'AMB-DEMO-07', displayName: 'Leah Foster', handle: '@leah.foster', platform: 'INSTAGRAM', risk: client_1.PromoterRiskTier.HIGH, supervisor: 'IA-001', status: 'INACTIVE' },
    ];
    for (const p of promoters) {
        await prisma.ambassadorProfile.upsert({
            where: { id: p.id },
            update: { riskTier: p.risk, status: p.status },
            create: {
                id: p.id, tenantId: T, displayName: p.displayName, handle: p.handle,
                primaryPlatform: p.platform, riskTier: p.risk, status: p.status,
                assignedSupervisorId: p.supervisor,
            },
        });
    }
    console.log(`✓ ${promoters.length} demo promoters seeded`);
    // ─── Content Records ──────────────────────────────────────
    // Designed to trigger specific detection rules with realistic captions.
    // Per-promoter posture lookup — mirrors compStructures below.
    // Every ContentRecord gets its promoter's posture stamped on it so
    // the severity floor rule and PDF posture column work correctly.
    const promoterPosture = {
        'AMB-DEMO-01': 'CRITICAL',
        'AMB-DEMO-02': 'CRITICAL',
        'AMB-DEMO-03': 'MEDIUM',
        'AMB-DEMO-04': 'LOW',
        'AMB-DEMO-05': 'HIGH',
        'AMB-DEMO-06': 'LOW',
        'AMB-DEMO-07': 'HIGH',
        'AMB-001': 'HIGH',
        'AMB-002': 'HIGH',
        'AMB-003': 'MEDIUM',
    };
    const records = [
        // ── Marcus Venn (per-conversion, CRITICAL risk) — YouTube ──
        { id: 'CR-DEMO-01', amb: 'AMB-DEMO-01', camp: 'CAMP-AGI', plat: 'YOUTUBE', type: 'VIDEO', status: 'ESCALATED',
            url: 'https://youtube.com/watch?v=mv-apex-01', extId: 'YT-MV-01', posted: '2026-03-15T14:00:00Z',
            body: 'BREAKING: Apex Growth I just crossed $50M in AUM. This fund has delivered guaranteed returns of 18% annually — and they\'re only accepting 200 more accredited investors. If you\'re serious about financial freedom, this is the one. Link in description.' },
        { id: 'CR-DEMO-02', amb: 'AMB-DEMO-01', camp: 'CAMP-AGI', plat: 'YOUTUBE', type: 'VIDEO', status: 'PENDING_REVIEW',
            url: 'https://youtube.com/watch?v=mv-apex-02', extId: 'YT-MV-02', posted: '2026-03-20T10:30:00Z',
            body: 'I\'ve been tracking Apex Growth I for six months and the returns are insane. This is a once in a lifetime opportunity for accredited investors. My full breakdown of why I think this will outperform everything else in 2026. Not financial advice.' },
        { id: 'CR-DEMO-03', amb: 'AMB-DEMO-01', camp: 'CAMP-AGI', plat: 'YOUTUBE', type: 'VIDEO', status: 'CLOSED',
            url: 'https://youtube.com/watch?v=mv-apex-03', extId: 'YT-MV-03', posted: '2026-02-28T16:00:00Z',
            body: 'Apex Growth I Q4 performance review. The fund is positioned to deliver strong returns again this quarter. Full disclosure: I am a paid promoter for this campaign. This is not financial advice. Past performance is not indicative of future results.' },
        { id: 'CR-DEMO-04', amb: 'AMB-DEMO-01', camp: null, plat: 'YOUTUBE', type: 'SHORT_FORM_VIDEO', status: 'CAPTURED',
            url: 'https://youtube.com/shorts/mv-short-01', extId: 'YT-MV-S01', posted: '2026-03-25T08:00:00Z',
            body: 'POV: you just realized you can still get into Apex Growth I before they close the round. Invest now before it\'s too late. #investing #accredited' },
        { id: 'CR-DEMO-05', amb: 'AMB-DEMO-01', camp: 'CAMP-AGI', plat: 'YOUTUBE', type: 'VIDEO', status: 'REVIEWED',
            url: 'https://youtube.com/watch?v=mv-apex-05', extId: 'YT-MV-05', posted: '2026-03-10T12:00:00Z',
            body: 'Apex Growth I — understanding the fund structure, fees, and investor eligibility. Educational overview for accredited investors. I am compensated by the fund sponsor. Not financial advice.' },
        // ── Jordan Blake (per-conversion, CRITICAL risk) — Instagram ──
        { id: 'CR-DEMO-06', amb: 'AMB-DEMO-02', camp: 'CAMP-HCD', plat: 'INSTAGRAM', type: 'REEL', status: 'ESCALATED',
            url: 'https://instagram.com/reel/jb-hcd-01', extId: 'IG-JB-01', posted: '2026-03-18T20:00:00Z',
            body: 'This is not a drill. Horizon Capital Distribution is offering risk free investment returns that will change your life. I quit my job because of opportunities like this. You cannot lose with this structure. DM me for the link. 🚀🚀🚀' },
        { id: 'CR-DEMO-07', amb: 'AMB-DEMO-02', camp: 'CAMP-HCD', plat: 'INSTAGRAM', type: 'IMAGE_POST', status: 'PENDING_REVIEW',
            url: 'https://instagram.com/p/jb-hcd-02', extId: 'IG-JB-02', posted: '2026-03-22T15:30:00Z',
            body: 'Just checked my Horizon Capital Distribution dashboard. The passive income from this has been incredible. If you want to get rich without lifting a finger, this is how. Link in bio. #paidpartner' },
        { id: 'CR-DEMO-08', amb: 'AMB-DEMO-02', camp: 'CAMP-HCD', plat: 'INSTAGRAM', type: 'STORY', status: 'CAPTURED',
            url: 'https://instagram.com/stories/jb-hcd-03', extId: 'IG-JB-03', posted: '2026-03-24T09:00:00Z',
            body: 'Swipe up for the biggest opportunity in fintech right now. Horizon Capital is set to grow 300% this year. Don\'t sleep on this.' },
        { id: 'CR-DEMO-09', amb: 'AMB-DEMO-02', camp: 'CAMP-HCD', plat: 'INSTAGRAM', type: 'CAROUSEL', status: 'REVIEWED',
            url: 'https://instagram.com/p/jb-hcd-04', extId: 'IG-JB-04', posted: '2026-03-01T11:00:00Z',
            body: 'Horizon Capital Distribution — 5 things you need to know before investing. Slide 1: What is HCD? Slide 2: Fee structure... I am a paid promoter. This is not financial advice. All investments carry risk.' },
        // ── Nina Castillo (flat-fee, MEDIUM risk) — TikTok ──
        { id: 'CR-DEMO-10', amb: 'AMB-DEMO-03', camp: 'CAMP-MTL', plat: 'TIKTOK', type: 'SHORT_FORM_VIDEO', status: 'PENDING_REVIEW',
            url: 'https://tiktok.com/@nina.castillo/video/mtl-01', extId: 'TT-NC-01', posted: '2026-03-19T17:00:00Z',
            body: 'Meridian Tech L/S just launched and honestly the projected growth numbers are wild. This could be huge for early investors. Not financial advice but like... look at these numbers 📈 #investing #meridiantech' },
        { id: 'CR-DEMO-11', amb: 'AMB-DEMO-03', camp: 'CAMP-MTL', plat: 'TIKTOK', type: 'SHORT_FORM_VIDEO', status: 'REVIEWED',
            url: 'https://tiktok.com/@nina.castillo/video/mtl-02', extId: 'TT-NC-02', posted: '2026-03-12T14:00:00Z',
            body: 'Explaining Meridian Tech L/S in 60 seconds. Long-short strategy, accredited investors only, minimum $25K. I\'m paid to create this content. Not financial advice. #paidpartner #investing' },
        { id: 'CR-DEMO-12', amb: 'AMB-DEMO-03', camp: 'CAMP-MTL', plat: 'TIKTOK', type: 'SHORT_FORM_VIDEO', status: 'CAPTURED',
            url: 'https://tiktok.com/@nina.castillo/video/mtl-03', extId: 'TT-NC-03', posted: '2026-03-26T10:00:00Z',
            body: 'POV: you\'re about to discover the fund that will deliver massive gains in 2026. Meridian Tech L/S is positioned to beat the market and I\'m here for it. #stocktok #investing' },
        { id: 'CR-DEMO-13', amb: 'AMB-DEMO-03', camp: null, plat: 'TIKTOK', type: 'SHORT_FORM_VIDEO', status: 'REVIEWED',
            url: 'https://tiktok.com/@nina.castillo/video/gen-01', extId: 'TT-NC-04', posted: '2026-02-15T09:00:00Z',
            body: 'My morning routine as a content creator in the finance space. Coffee, market check, record, edit, post. Nothing promotional here, just vibes. #dayinmylife' },
        // ── Derek Tao (flat-fee, LOW risk) — Twitter/X ──
        { id: 'CR-DEMO-14', amb: 'AMB-DEMO-04', camp: 'CAMP-AGI', plat: 'TWITTER_X', type: 'TWEET', status: 'REVIEWED',
            url: 'https://x.com/derektao/status/dt-01', extId: 'TW-DT-01', posted: '2026-03-14T08:30:00Z',
            body: 'Apex Growth I is accepting new investors. Interesting fund structure for accredited investors looking for alternatives. I\'m paid to post about this — full disclosure. Not financial advice.' },
        { id: 'CR-DEMO-15', amb: 'AMB-DEMO-04', camp: 'CAMP-AGI', plat: 'TWITTER_X', type: 'THREAD', status: 'REVIEWED',
            url: 'https://x.com/derektao/status/dt-02', extId: 'TW-DT-02', posted: '2026-03-08T11:00:00Z',
            body: '1/ Thread on Apex Growth I — what it is, who it\'s for, and why I think the structure is worth understanding. Disclaimer: I am compensated for this content. Not financial advice. All investments carry risk. 🧵' },
        { id: 'CR-DEMO-16', amb: 'AMB-DEMO-04', camp: 'CAMP-AGI', plat: 'TWITTER_X', type: 'TWEET', status: 'CAPTURED',
            url: 'https://x.com/derektao/status/dt-03', extId: 'TW-DT-03', posted: '2026-03-28T16:00:00Z',
            body: 'Hot take: Apex Growth I is going to outperform most hedge funds this year. The management team knows what they\'re doing. Mark my words.' },
        { id: 'CR-DEMO-17', amb: 'AMB-DEMO-04', camp: null, plat: 'TWITTER_X', type: 'TWEET', status: 'REVIEWED',
            url: 'https://x.com/derektao/status/dt-04', extId: 'TW-DT-04', posted: '2026-02-20T13:00:00Z',
            body: 'Great panel discussion at the Alt Invest Conference today. Lots of smart people thinking about fund distribution in 2026. No specific recs — just learning.' },
        // ── Priya Sharma (revenue share, HIGH risk) — YouTube ──
        { id: 'CR-DEMO-18', amb: 'AMB-DEMO-05', camp: 'CAMP-HCD', plat: 'YOUTUBE', type: 'VIDEO', status: 'ESCALATED',
            url: 'https://youtube.com/watch?v=ps-hcd-01', extId: 'YT-PS-01', posted: '2026-03-16T15:00:00Z',
            body: 'Horizon Capital Distribution deep dive. I have a financial interest in this fund and I believe it will generate above market returns for the next 3-5 years. This is a ground floor opportunity that serious investors should not ignore. Revenue share disclosure in description.' },
        { id: 'CR-DEMO-19', amb: 'AMB-DEMO-05', camp: 'CAMP-HCD', plat: 'YOUTUBE', type: 'VIDEO', status: 'PENDING_REVIEW',
            url: 'https://youtube.com/watch?v=ps-hcd-02', extId: 'YT-PS-02', posted: '2026-03-23T10:00:00Z',
            body: 'Why I\'m putting my own money into Horizon Capital Distribution. The high yield structure is unlike anything I\'ve seen in the alternatives space. Full disclosure: I earn a revenue share. This is not financial advice.' },
        { id: 'CR-DEMO-20', amb: 'AMB-DEMO-05', camp: 'CAMP-HCD', plat: 'YOUTUBE', type: 'VIDEO', status: 'REVIEWED',
            url: 'https://youtube.com/watch?v=ps-hcd-03', extId: 'YT-PS-03', posted: '2026-02-25T18:00:00Z',
            body: 'Horizon Capital Distribution — investor FAQ. Answering your top 10 questions about fees, minimums, and eligibility. I receive compensation for this content. Not financial advice. Past performance does not guarantee future results.' },
        { id: 'CR-DEMO-21', amb: 'AMB-DEMO-05', camp: null, plat: 'YOUTUBE', type: 'VIDEO', status: 'CAPTURED',
            url: 'https://youtube.com/watch?v=ps-gen-01', extId: 'YT-PS-04', posted: '2026-03-27T12:00:00Z',
            body: 'Portfolio update March 2026. Sharing my personal allocations — alternatives, ETFs, and why I expect to see significant upside in the second half of the year. Educational only.' },
        // ── Ryan Michaels (uncompensated, LOW risk) — Twitter/X ──
        { id: 'CR-DEMO-22', amb: 'AMB-DEMO-06', camp: null, plat: 'TWITTER_X', type: 'TWEET', status: 'REVIEWED',
            url: 'https://x.com/ryanmichaels/status/rm-01', extId: 'TW-RM-01', posted: '2026-03-17T09:00:00Z',
            body: 'Looked into Apex Growth I after seeing it mentioned online. Interesting structure but do your own due diligence. I have no financial relationship with them. Just sharing thoughts.' },
        { id: 'CR-DEMO-23', amb: 'AMB-DEMO-06', camp: null, plat: 'TWITTER_X', type: 'TWEET', status: 'REVIEWED',
            url: 'https://x.com/ryanmichaels/status/rm-02', extId: 'TW-RM-02', posted: '2026-03-05T14:00:00Z',
            body: 'General market observations for March. Nothing here is investment advice. I don\'t promote any specific funds or products. Just my personal analysis of macro trends.' },
        { id: 'CR-DEMO-24', amb: 'AMB-DEMO-06', camp: null, plat: 'TWITTER_X', type: 'THREAD', status: 'CAPTURED',
            url: 'https://x.com/ryanmichaels/status/rm-03', extId: 'TW-RM-03', posted: '2026-03-29T11:00:00Z',
            body: '1/ Thread: Why I think alternatives are going to see huge opportunity in the next 12 months. The macro setup is perfect. Here\'s my thesis... #fintwit' },
        // ── Leah Foster (terminated, tail period) — Instagram ──
        { id: 'CR-DEMO-25', amb: 'AMB-DEMO-07', camp: 'CAMP-AGI', plat: 'INSTAGRAM', type: 'IMAGE_POST', status: 'ESCALATED',
            url: 'https://instagram.com/p/lf-apex-01', extId: 'IG-LF-01', posted: '2026-03-20T19:00:00Z',
            body: 'Still getting messages about Apex Growth I. Yes, the fund is still accepting investors. No, I\'m no longer officially promoting it — but I still think it will double your money. Just my opinion.' },
        { id: 'CR-DEMO-26', amb: 'AMB-DEMO-07', camp: null, plat: 'INSTAGRAM', type: 'REEL', status: 'PENDING_REVIEW',
            url: 'https://instagram.com/reel/lf-gen-01', extId: 'IG-LF-02', posted: '2026-03-25T21:00:00Z',
            body: 'Finance girlies, listen up. I know I said I stopped doing sponsored posts but honestly some of these investment opportunities are too good to ignore. Can\'t miss this one. Link in bio (not sponsored, just sharing).' },
        // ── More records for existing seeded promoters ──
        // Sasha Moreno (AMB-001)
        { id: 'CR-DEMO-27', amb: 'AMB-001', camp: 'CAMP-AGI', plat: 'INSTAGRAM', type: 'REEL', status: 'PENDING_REVIEW',
            url: 'https://instagram.com/reel/sm-apex-new', extId: 'IG-SM-N01', posted: '2026-03-21T16:00:00Z',
            body: 'Apex Growth I just hit a major milestone and I had to share. This is the kind of high yield opportunity that comes around maybe once a decade. Accredited investors only. #ad #investing' },
        // Elena Park (AMB-002)
        { id: 'CR-DEMO-28', amb: 'AMB-002', camp: 'CAMP-HCD', plat: 'YOUTUBE', type: 'VIDEO', status: 'CAPTURED',
            url: 'https://youtube.com/watch?v=ep-hcd-new', extId: 'YT-EP-N01', posted: '2026-03-24T13:00:00Z',
            body: 'Horizon Capital Distribution update — Q1 2026. The strong returns continue. I\'m a paid creator for HCD. Not financial advice. Always consult a financial advisor before investing.' },
        // Alex Tran (AMB-003)
        { id: 'CR-DEMO-29', amb: 'AMB-003', camp: 'CAMP-MTL', plat: 'TWITTER_X', type: 'TWEET', status: 'CAPTURED',
            url: 'https://x.com/alextran_finance/status/at-new-01', extId: 'TW-AT-N01', posted: '2026-03-26T07:00:00Z',
            body: 'Meridian Tech L/S is poised to deliver massive gains this quarter. The long-short structure is genius. If you\'re not looking at this you\'re sleeping. Not financial advice.' },
    ];
    let recordCount = 0;
    let detectionCount = 0;
    // Inline posture floor — mirrors applySeverityFloor(). Kept inline so the
    // seed script has no import-time dependency on src/lib/severityEngine.
    const SEV_RANK = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
    const maxSev = (a, b) => (SEV_RANK[a] >= SEV_RANK[b] ? a : b);
    const postureFloorSeverity = (posture) => {
        // CRITICAL posture → MEDIUM floor (even with no detections, these records
        // demand supervisor attention because the compensation structure itself
        // is high-risk). HIGH posture → LOW floor (no lift). Others → LOW floor.
        if (posture === 'CRITICAL')
            return 'MEDIUM';
        return 'LOW';
    };
    for (const rec of records) {
        const checksum = (0, checksum_1.computeChecksum)(rec.url, rec.body);
        const hits = (0, ruleRegistry_1.detectRuleHits)(rec.body);
        const detectionSev = hits.length > 0
            ? (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].find(s => hits.some(h => h.severity === s)) || 'LOW')
            : 'LOW';
        const posture = promoterPosture[rec.amb] || 'LOW';
        const floorSev = postureFloorSeverity(posture);
        const finalSev = maxSev(detectionSev, floorSev);
        await prisma.contentRecord.upsert({
            where: { id: rec.id },
            update: { archiveStatus: rec.status, severity: finalSev, compensationPosture: posture },
            create: {
                id: rec.id, tenantId: T, ambassadorId: rec.amb,
                campaignId: rec.camp, sourcePlatform: rec.plat, contentType: rec.type,
                sourceUrl: rec.url, externalContentId: rec.extId,
                bodyText: rec.body, archiveStatus: rec.status, severity: finalSev,
                compensationPosture: posture,
                postedAt: new Date(rec.posted), checksum,
            },
        });
        recordCount++;
        // Detection records
        for (const hit of hits) {
            const detId = `DET-${rec.id}-${hit.ruleCode}-${hit.matchedPhrase.replace(/\s+/g, '_').slice(0, 30)}`;
            await prisma.detectionRecord.upsert({
                where: { id: detId },
                update: {},
                create: {
                    id: detId, tenantId: T, contentRecordId: rec.id,
                    ruleCode: hit.ruleCode, ruleName: hit.ruleName,
                    matchedPhrase: hit.matchedPhrase, severity: hit.severity,
                    detectionMethod: hit.detectionMethod,
                },
            });
            detectionCount++;
        }
        // Creation event
        const evtId = `EVT-${rec.id}-CREATED`;
        await prisma.archiveEventLog.upsert({
            where: { id: evtId },
            update: {},
            create: {
                id: evtId, tenantId: T, contentRecordId: rec.id,
                eventType: client_1.ArchiveEventType.RECORD_CREATED,
                eventNote: `Content captured from ${rec.plat} — ${rec.url}`,
                actorId: 'SYSTEM',
            },
        });
    }
    console.log(`✓ ${recordCount} content records seeded`);
    console.log(`✓ ${detectionCount} detection records created`);
    // ─── Escalation Events ──────────────────────────────────────
    const escalations = [
        // Marcus Venn — guaranteed returns claim
        { id: 'EVT-DEMO-ESC-01', record: 'CR-DEMO-01', type: client_1.ArchiveEventType.ESCALATION_RAISED,
            note: 'CRITICAL: Guaranteed returns language detected. "guaranteed returns of 18%" violates SEC Rule 10b-5 and FINRA Rule 2010. Escalated to Registered Principal for immediate review.', actor: 'IA-003' },
        { id: 'EVT-DEMO-ESC-02', record: 'CR-DEMO-01', type: client_1.ArchiveEventType.COMPLIANCE_ESCALATED,
            note: 'Principal review: Content contains false or misleading performance guarantees. Requesting immediate takedown and promoter notice. Ambassador contract under review.', actor: 'IA-001' },
        // Jordan Blake — risk-free + quit your job
        { id: 'EVT-DEMO-ESC-03', record: 'CR-DEMO-06', type: client_1.ArchiveEventType.ESCALATION_RAISED,
            note: 'CRITICAL: Multiple violations in single post. "risk free investment", "cannot lose", "quit my job" — violates FINRA 2210(d) and SEC 10b-5. Immediate escalation.', actor: 'IA-003' },
        { id: 'EVT-DEMO-ESC-04', record: 'CR-DEMO-06', type: client_1.ArchiveEventType.COMPLIANCE_PROMOTER_SUSPENDED,
            note: 'Promoter suspended pending investigation. Content removed from circulation. Full case review initiated by CCO.', actor: 'IA-005' },
        // Priya Sharma — ground floor + above market returns
        { id: 'EVT-DEMO-ESC-05', record: 'CR-DEMO-18', type: client_1.ArchiveEventType.ESCALATION_RAISED,
            note: 'HIGH: "ground floor opportunity" and "above market returns" language detected. Revenue share compensation structure increases supervisory concern. Escalated for principal review.', actor: 'IA-002' },
        // Leah Foster — post-contract "will double"
        { id: 'EVT-DEMO-ESC-06', record: 'CR-DEMO-25', type: client_1.ArchiveEventType.ESCALATION_RAISED,
            note: 'CRITICAL: Post-contract promotional activity detected. Promoter contract terminated but still making performance claims ("will double your money"). Tail period monitoring alert. Escalated to compliance officer.', actor: 'IA-002' },
    ];
    for (const evt of escalations) {
        await prisma.archiveEventLog.upsert({
            where: { id: evt.id },
            update: {},
            create: {
                id: evt.id, tenantId: T, contentRecordId: evt.record,
                eventType: evt.type, eventNote: evt.note, actorId: evt.actor,
            },
        });
    }
    console.log(`✓ ${escalations.length} escalation events seeded`);
    // ─── Remediation Case ──────────────────────────────────────
    // Marcus Venn CR-DEMO-03 — approved after proper disclosure
    const remediationEvents = [
        { id: 'EVT-DEMO-REM-01', record: 'CR-DEMO-03', type: client_1.ArchiveEventType.REVIEW_STARTED,
            note: 'Review initiated — content flagged for performance language but contains required disclaimers.', actor: 'IA-003' },
        { id: 'EVT-DEMO-REM-02', record: 'CR-DEMO-03', type: client_1.ArchiveEventType.REVIEW_COMPLETED,
            note: 'Content includes paid promoter disclosure, "not financial advice" disclaimer, and "past performance" safe harbour. Language within acceptable bounds. Cleared.', actor: 'IA-003' },
        { id: 'EVT-DEMO-REM-03', record: 'CR-DEMO-03', type: client_1.ArchiveEventType.COMPLIANCE_APPROVED,
            note: 'Supervisory sign-off: Content compliant under FINRA 2210(d). Disclosures adequate. No further action required.', actor: 'IA-001' },
        { id: 'EVT-DEMO-REM-04', record: 'CR-DEMO-03', type: client_1.ArchiveEventType.COMPLIANCE_CERTIFIED,
            note: 'Case certified and closed. Principal attestation recorded per FINRA Rule 3110.', actor: 'IA-001' },
        // Jordan Blake CR-DEMO-09 — edit requested then approved
        { id: 'EVT-DEMO-REM-05', record: 'CR-DEMO-09', type: client_1.ArchiveEventType.REVIEW_STARTED,
            note: 'Review initiated — educational content with proper disclosures.', actor: 'IA-002' },
        { id: 'EVT-DEMO-REM-06', record: 'CR-DEMO-09', type: client_1.ArchiveEventType.COMPLIANCE_APPROVED,
            note: 'Content reviewed and approved. Disclosures present, no violative language. Cleared for archive.', actor: 'IA-002' },
    ];
    for (const evt of remediationEvents) {
        await prisma.archiveEventLog.upsert({
            where: { id: evt.id },
            update: {},
            create: {
                id: evt.id, tenantId: T, contentRecordId: evt.record,
                eventType: evt.type, eventNote: evt.note, actorId: evt.actor,
            },
        });
    }
    console.log(`✓ ${remediationEvents.length} remediation events seeded`);
    // ─── Supervisory Attestations ──────────────────────────────
    const attestations = [
        { id: 'ATT-DEMO-01', principal: 'IA-001', period: 'Q4 2025', start: '2025-10-01', end: '2025-12-31', scope: 12,
            note: 'Quarterly supervisory review complete. 12 promoters in scope. 47 content records reviewed. 3 escalations resolved. All post-contract tail periods monitored. No outstanding compliance issues. WSPs followed per FINRA Rule 3110.' },
        { id: 'ATT-DEMO-02', principal: 'IA-001', period: 'Q1 2026', start: '2026-01-01', end: '2026-03-31', scope: 14,
            note: 'Q1 2026 supervisory attestation. 14 promoters supervised across 3 active campaigns. 89 content records reviewed. 6 escalations — 4 resolved, 2 pending principal action. Elevated concern re: per-conversion promoters (Venn, Blake). Remediation in progress. Attestation conditional on Blake resolution.' },
        { id: 'ATT-DEMO-03', principal: 'IA-002', period: 'Q1 2026', start: '2026-01-01', end: '2026-03-31', scope: 8,
            note: 'Designated supervisor attestation Q1 2026. 8 promoters under direct supervision. 52 content records reviewed. Disclosure compliance rate: 78%. Flat-fee promoters (Castillo, Tao) performing within guidelines. Revenue-share promoter (Sharma) requires elevated monitoring due to compensation structure. No critical violations under my supervision.' },
    ];
    for (const att of attestations) {
        await prisma.supervisoryAttestation.upsert({
            where: { id: att.id },
            update: {},
            create: {
                id: att.id, tenantId: T, principalId: att.principal,
                periodLabel: att.period, periodStart: new Date(att.start), periodEnd: new Date(att.end),
                promotersInScope: att.scope, supervisoryNote: att.note,
            },
        });
    }
    console.log(`✓ ${attestations.length} supervisory attestations seeded`);
    // ─── Tail Period for Leah Foster ──────────────────────────
    await prisma.tailPeriod.upsert({
        where: { id: 'TP-DEMO-01' },
        update: {},
        create: {
            id: 'TP-DEMO-01', tenantId: T, ambassadorId: 'AMB-DEMO-07',
            contractEndDate: new Date('2026-02-28'), tailDays: 90,
            tailStartDate: new Date('2026-03-01'), tailEndDate: new Date('2026-05-31'),
            reason: 'High-risk promoter — per-conversion compensation with securities-linked affiliate links. Extended tail period per supervisory plan and FINRA Rule 2210 post-termination monitoring requirements.',
            riskTier: 'HIGH', tailType: 'EXTENDED', status: 'ACTIVE', postContractFlags: 2,
        },
    });
    console.log('✓ 1 tail period seeded (Leah Foster)');
    // ─── Compensation Structures ──────────────────────────────
    const compStructures = [
        { id: 'CS-DEMO-01', promoterId: 'AMB-DEMO-01', form: 'PER_CONVERSION', trigger: 'CONVERSION', product: 'REG_D', txn: true, sec: true, variable: true, disc: true, principal: true, posture: 'CRITICAL' },
        { id: 'CS-DEMO-02', promoterId: 'AMB-DEMO-02', form: 'PER_CONTENT', trigger: 'FUNDED_ACCOUNT', product: 'FINTECH', txn: true, sec: false, variable: true, disc: true, principal: true, posture: 'CRITICAL' },
        { id: 'CS-DEMO-03', promoterId: 'AMB-DEMO-03', form: 'FLAT_FEE', trigger: 'LEAD', product: 'REG_D', txn: false, sec: false, variable: false, disc: true, principal: false, posture: 'MEDIUM' },
        { id: 'CS-DEMO-04', promoterId: 'AMB-DEMO-04', form: 'FLAT_FEE', trigger: 'LEAD', product: 'REG_D', txn: false, sec: false, variable: false, disc: true, principal: false, posture: 'LOW' },
        { id: 'CS-DEMO-05', promoterId: 'AMB-DEMO-05', form: 'REVENUE_SHARE', trigger: 'CAPITAL_RAISED', product: 'FUND', txn: true, sec: true, variable: true, disc: true, principal: true, posture: 'HIGH' },
        { id: 'CS-DEMO-06', promoterId: 'AMB-DEMO-06', form: 'NONE', trigger: 'NONE', product: 'OTHER', txn: false, sec: false, variable: false, disc: false, principal: false, posture: 'LOW', notes: 'Uncompensated content creator. Monitoring for regulatory purposes only.' },
        { id: 'CS-DEMO-07', promoterId: 'AMB-DEMO-07', form: 'PER_CONTENT', trigger: 'SIGNUP', product: 'REG_D', txn: true, sec: true, variable: true, disc: true, principal: true, posture: 'HIGH', notes: 'Contract terminated 2026-02-28. Tail period monitoring active.' },
    ];
    for (const cs of compStructures) {
        await prisma.compensationStructure.upsert({
            where: { id: cs.id },
            update: {},
            create: {
                id: cs.id, tenantId: T, promoterId: cs.promoterId,
                compensationForm: cs.form, compensationTrigger: cs.trigger, productType: cs.product,
                isTransactionBased: cs.txn, isSecurityLinked: cs.sec, isCompensationVariable: cs.variable,
                requiresDisclosure: cs.disc, requiresPrincipalReview: cs.principal,
                supervisionPosture: cs.posture, writtenAgreementRequired: true,
                notes: cs.notes || null,
            },
        });
    }
    console.log(`✓ ${compStructures.length} compensation structures seeded`);
    // ─── Promoter Contracts ───────────────────────────────────
    const contracts = [
        {
            id: 'CTR-DEMO-01', ambassadorId: 'AMB-DEMO-01', contractId: 'AGR-2025-0019',
            agreementType: 'Promoter Agreement', compensationType: 'Revenue share', compensationRate: '0.5% AUM yr1',
            compensationCap: 50000, signedDate: '2025-04-15', effectiveDate: '2025-04-15', expiryDate: '2026-04-15',
            monitoringConsent: true, disclosureAck: true, status: 'ACTIVE',
        },
        {
            id: 'CTR-DEMO-02', ambassadorId: 'AMB-DEMO-02', contractId: 'AGR-2025-0021',
            agreementType: 'Promoter Agreement', compensationType: 'Per-acquisition + Fixed', compensationRate: '$25/signup + $500/mo',
            compensationCap: 75000, signedDate: '2025-03-01', effectiveDate: '2025-03-01', expiryDate: '2027-03-01',
            monitoringConsent: true, disclosureAck: true, status: 'ACTIVE',
        },
        {
            id: 'CTR-DEMO-03', ambassadorId: 'AMB-DEMO-03', contractId: 'AGR-2025-0028',
            agreementType: 'Promoter Agreement', compensationType: 'Flat fee', compensationRate: '$500/mo',
            compensationCap: 6000, signedDate: '2025-06-01', effectiveDate: '2025-06-01', expiryDate: '2026-06-01',
            monitoringConsent: true, disclosureAck: true, status: 'ACTIVE',
        },
        {
            id: 'CTR-DEMO-04', ambassadorId: 'AMB-DEMO-04', contractId: 'AGR-2026-0003',
            agreementType: 'Promoter Agreement', compensationType: 'Flat fee', compensationRate: '$500/mo',
            compensationCap: null, signedDate: null, effectiveDate: null, expiryDate: null,
            monitoringConsent: false, disclosureAck: false, status: 'PENDING',
        },
        {
            id: 'CTR-DEMO-05', ambassadorId: 'AMB-DEMO-05', contractId: 'AGR-2025-0031',
            agreementType: 'Promoter Agreement', compensationType: 'Revenue share', compensationRate: '1.2% capital raised',
            compensationCap: 120000, signedDate: '2025-05-01', effectiveDate: '2025-05-01', expiryDate: '2027-05-01',
            monitoringConsent: true, disclosureAck: true, status: 'ACTIVE',
        },
        {
            id: 'CTR-DEMO-06', ambassadorId: 'AMB-DEMO-06', contractId: 'AGR-2026-0005',
            agreementType: 'Content Creator Agreement', compensationType: 'Free stock', compensationRate: '1 share/signup',
            compensationCap: null, signedDate: null, effectiveDate: null, expiryDate: null,
            monitoringConsent: false, disclosureAck: false, status: 'PENDING',
        },
        {
            id: 'CTR-DEMO-07', ambassadorId: 'AMB-DEMO-07', contractId: 'AGR-2025-0024',
            agreementType: 'Promoter Agreement', compensationType: 'Per-acquisition', compensationRate: '$50/signup',
            compensationCap: 30000, signedDate: '2025-06-01', effectiveDate: '2025-06-01', expiryDate: '2027-06-01',
            monitoringConsent: true, disclosureAck: true, status: 'TERMINATED',
            notes: 'Contract terminated 2026-02-28. Tail period monitoring active.',
        },
    ];
    for (const c of contracts) {
        await prisma.promoterContract.upsert({
            where: { id: c.id },
            update: {},
            create: {
                id: c.id, tenantId: T,
                ambassadorId: c.ambassadorId,
                contractId: c.contractId,
                agreementType: c.agreementType,
                compensationType: c.compensationType,
                compensationRate: c.compensationRate,
                compensationCap: c.compensationCap,
                signedDate: c.signedDate ? new Date(c.signedDate) : new Date(),
                effectiveDate: c.effectiveDate ? new Date(c.effectiveDate) : new Date(),
                expiryDate: c.expiryDate ? new Date(c.expiryDate) : null,
                monitoringConsent: c.monitoringConsent,
                disclosureAck: c.disclosureAck,
                status: c.status,
                notes: c.notes || null,
            },
        });
    }
    console.log(`✓ ${contracts.length} promoter contracts seeded`);
    // ─── Campaign Promoter Assignments ────────────────────────
    // Assigns demo promoters to their respective campaigns with
    // compensation structures and principal assignments.
    const campaignPromoters = [
        // CAMP-AGI — Apex Growth I (LIVE): Marcus Venn + Priya Sharma
        { id: 'CP-DEMO-01', campaignId: 'CAMP-AGI', promoterId: 'AMB-DEMO-01', compStructureId: 'CS-DEMO-01', principalId: 'IA-001', agreementRef: 'AGR-2025-0019' },
        { id: 'CP-DEMO-02', campaignId: 'CAMP-AGI', promoterId: 'AMB-DEMO-05', compStructureId: 'CS-DEMO-05', principalId: 'IA-001', agreementRef: 'AGR-2025-0031' },
        // CAMP-HCD — Horizon Capital Distribution (LIVE): Jordan Blake + Nina Castillo
        { id: 'CP-DEMO-03', campaignId: 'CAMP-HCD', promoterId: 'AMB-DEMO-02', compStructureId: 'CS-DEMO-02', principalId: 'IA-001', agreementRef: 'AGR-2025-0021' },
        { id: 'CP-DEMO-04', campaignId: 'CAMP-HCD', promoterId: 'AMB-DEMO-03', compStructureId: 'CS-DEMO-03', principalId: 'IA-002', agreementRef: 'AGR-2025-0028' },
        // CAMP-MTL — Meridian Tech L/S (DSS_EVALUATION): Derek Tao
        { id: 'CP-DEMO-05', campaignId: 'CAMP-MTL', promoterId: 'AMB-DEMO-04', compStructureId: 'CS-DEMO-04', principalId: null, agreementRef: null },
    ];
    for (const cp of campaignPromoters) {
        await prisma.campaignPromoter.upsert({
            where: { id: cp.id },
            update: {},
            create: {
                id: cp.id, tenantId: T,
                campaignId: cp.campaignId,
                promoterId: cp.promoterId,
                compensationStructureId: cp.compStructureId,
                assignedPrincipalId: cp.principalId,
                agreementReference: cp.agreementRef,
                status: 'ACTIVE',
                updatedAt: new Date(),
            },
        });
    }
    console.log(`✓ ${campaignPromoters.length} campaign promoter assignments seeded`);
    // ─── Campaign Policies ────────────────────────────────────
    // Defines allowed compensation types and activation state per campaign.
    const campaignPolicies = [
        {
            id: 'CPOL-DEMO-01', campaignId: 'CAMP-AGI',
            allowedTypes: ['PER_CONVERSION', 'REVENUE_SHARE_SECURITIES', 'PER_LEAD_CONVERTED_TO_INVESTOR'],
            tolerance: 'STRICT',
            requiresPrincipal: true,
            activatedAt: new Date('2026-01-15T10:00:00Z'),
            activatedBy: 'IA-001',
            activationNote: 'Apex Growth I campaign reviewed and approved. All promoter compensation structures verified. Principal supervision framework in place.',
        },
        {
            id: 'CPOL-DEMO-02', campaignId: 'CAMP-HCD',
            allowedTypes: ['PER_ACCOUNT_OPENED_AND_FUNDED', 'FLAT_FEE_PER_POST', 'PER_LEAD'],
            tolerance: 'ALLOW_ALL',
            requiresPrincipal: false,
            activatedAt: new Date('2026-02-01T14:00:00Z'),
            activatedBy: 'IA-001',
            activationNote: 'Horizon Capital fintech campaign activated. Flat-fee and funded-account comp structures approved.',
        },
        {
            id: 'CPOL-DEMO-03', campaignId: 'CAMP-MTL',
            allowedTypes: ['FLAT_FEE_PER_POST', 'PER_LEAD'],
            tolerance: 'STRICT',
            requiresPrincipal: true,
            activatedAt: null,
            activatedBy: null,
            activationNote: null,
        },
    ];
    for (const pol of campaignPolicies) {
        await prisma.campaignPolicy.upsert({
            where: { campaignId: pol.campaignId },
            update: {},
            create: {
                id: pol.id, tenantId: T,
                campaignId: pol.campaignId,
                allowedCompensationTypes: JSON.stringify(pol.allowedTypes),
                transactionalityTolerance: pol.tolerance,
                requiresPrincipalForAll: pol.requiresPrincipal,
                activatedAt: pol.activatedAt,
                activatedByPrincipalId: pol.activatedBy,
                activationNote: pol.activationNote,
                updatedAt: new Date(),
            },
        });
    }
    console.log(`✓ ${campaignPolicies.length} campaign policies seeded`);
    console.log('\n✅ Demo seed complete.\n');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-demo.js.map