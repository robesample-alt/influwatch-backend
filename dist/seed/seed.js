"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH (Multi-Tenant)
// Seed — example data
//
// Creates a default tenant and seeds data scoped to it.
//
// Run: npx ts-node seed/seed.ts
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const checksum_1 = require("../src/utils/checksum");
const ruleRegistry_1 = require("../src/lib/ruleRegistry");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const TENANT_ID = 'DEFAULT_TENANT';
async function main() {
    console.log('🌱 Seeding InfluWatch (multi-tenant)...');
    // ─── Default Tenant ──────────────────────────────────────
    await prisma.tenant.upsert({
        where: { id: TENANT_ID },
        update: { firmName: 'Meridian Capital Partners' },
        create: {
            id: TENANT_ID,
            firmName: 'Meridian Capital Partners',
            slug: 'default',
            crdNumber: null,
            secRegistration: null,
            status: 'ACTIVE',
        },
    });
    console.log('✓ default tenant seeded');
    // ─── Internal Actors ──────────────────────────────────────
    const internalActors = await Promise.all([
        prisma.internalActor.upsert({
            where: { id: 'IA-001' },
            update: { displayName: 'James Harlow', role: client_1.InternalActorRole.REGISTERED_PRINCIPAL, status: client_1.InternalActorStatus.ACTIVE, seriesLicense: 'Series 24', mfaEnabled: true, lastLoginAt: new Date('2026-03-17T08:30:00Z') },
            create: {
                id: 'IA-001',
                tenantId: TENANT_ID,
                displayName: 'James Harlow',
                email: 'j.harlow@fundurex.com',
                role: client_1.InternalActorRole.REGISTERED_PRINCIPAL,
                status: client_1.InternalActorStatus.ACTIVE,
                seriesLicense: 'Series 24',
                mfaEnabled: true,
                lastLoginAt: new Date('2026-03-17T08:30:00Z'),
            },
        }),
        prisma.internalActor.upsert({
            where: { id: 'IA-002' },
            update: { displayName: 'Sandra Okafor', role: client_1.InternalActorRole.DESIGNATED_SUPERVISOR, status: client_1.InternalActorStatus.ACTIVE, seriesLicense: 'Series 24', mfaEnabled: true, lastLoginAt: new Date('2026-03-17T09:14:00Z') },
            create: {
                id: 'IA-002',
                tenantId: TENANT_ID,
                displayName: 'Sandra Okafor',
                email: 's.okafor@fundurex.com',
                role: client_1.InternalActorRole.DESIGNATED_SUPERVISOR,
                status: client_1.InternalActorStatus.ACTIVE,
                seriesLicense: 'Series 24',
                mfaEnabled: true,
                lastLoginAt: new Date('2026-03-17T09:14:00Z'),
            },
        }),
        prisma.internalActor.upsert({
            where: { id: 'IA-003' },
            update: { displayName: 'Sofia Reyes', role: client_1.InternalActorRole.REVIEWER, status: client_1.InternalActorStatus.ACTIVE, seriesLicense: 'Series 65', mfaEnabled: true, lastLoginAt: new Date('2026-03-17T10:02:00Z') },
            create: {
                id: 'IA-003',
                tenantId: TENANT_ID,
                displayName: 'Sofia Reyes',
                email: 's.reyes@fundurex.com',
                role: client_1.InternalActorRole.REVIEWER,
                status: client_1.InternalActorStatus.ACTIVE,
                seriesLicense: 'Series 65',
                mfaEnabled: true,
                lastLoginAt: new Date('2026-03-17T10:02:00Z'),
            },
        }),
        prisma.internalActor.upsert({
            where: { id: 'IA-004' },
            update: { displayName: 'Remy Delacroix', role: client_1.InternalActorRole.REVIEWER, status: client_1.InternalActorStatus.ACTIVE, seriesLicense: 'Series 65', mfaEnabled: false, lastLoginAt: new Date('2026-03-16T15:45:00Z') },
            create: {
                id: 'IA-004',
                tenantId: TENANT_ID,
                displayName: 'Remy Delacroix',
                email: 'r.delacroix@fundurex.com',
                role: client_1.InternalActorRole.REVIEWER,
                status: client_1.InternalActorStatus.ACTIVE,
                seriesLicense: 'Series 65',
                mfaEnabled: false,
                lastLoginAt: new Date('2026-03-16T15:45:00Z'),
            },
        }),
        prisma.internalActor.upsert({
            where: { id: 'IA-005' },
            update: { displayName: 'Marcus Chen', role: client_1.InternalActorRole.COMPLIANCE_OFFICER, status: client_1.InternalActorStatus.ACTIVE, seriesLicense: 'Series 24', mfaEnabled: true, lastLoginAt: new Date('2026-03-15T11:20:00Z') },
            create: {
                id: 'IA-005',
                tenantId: TENANT_ID,
                displayName: 'Marcus Chen',
                email: 'm.chen@fundurex.com',
                role: client_1.InternalActorRole.COMPLIANCE_OFFICER,
                status: client_1.InternalActorStatus.ACTIVE,
                seriesLicense: 'Series 24',
                mfaEnabled: true,
                lastLoginAt: new Date('2026-03-15T11:20:00Z'),
            },
        }),
        prisma.internalActor.upsert({
            where: { id: 'IA-006' },
            update: { displayName: 'Kevin Williams', role: client_1.InternalActorRole.TENANT_ADMIN, status: client_1.InternalActorStatus.ACTIVE, seriesLicense: null, mfaEnabled: true, lastLoginAt: new Date('2026-03-10T09:00:00Z') },
            create: {
                id: 'IA-006',
                tenantId: TENANT_ID,
                displayName: 'Kevin Williams',
                email: 'k.williams@fundurex.com',
                role: client_1.InternalActorRole.TENANT_ADMIN,
                status: client_1.InternalActorStatus.ACTIVE,
                seriesLicense: null,
                mfaEnabled: true,
                lastLoginAt: new Date('2026-03-10T09:00:00Z'),
            },
        }),
    ]);
    console.log(`✓ ${internalActors.length} internal actors seeded`);
    // ─── Password hashes ──────────────────────────────────────
    const passwordHash = await bcrypt_1.default.hash('influwatch2026', 12);
    const { count: hashCount } = await prisma.internalActor.updateMany({
        where: { passwordHash: null },
        data: { passwordHash },
    });
    if (hashCount > 0)
        console.log(`✓ password hashes set for ${hashCount} actors`);
    else
        console.log('· password hashes already set — skipped');
    // ─── Ambassadors ─────────────────────────────────────────
    const ambassadors = await Promise.all([
        prisma.ambassadorProfile.upsert({
            where: { id: 'AMB-001' },
            update: { assignedSupervisorId: 'IA-001', riskTier: client_1.PromoterRiskTier.HIGH },
            create: {
                id: 'AMB-001',
                tenantId: TENANT_ID,
                displayName: 'Sasha Moreno',
                handle: '@sasha.moreno',
                primaryPlatform: 'INSTAGRAM',
                status: 'ACTIVE',
                riskTier: client_1.PromoterRiskTier.HIGH,
                assignedSupervisorId: 'IA-001',
            },
        }),
        prisma.ambassadorProfile.upsert({
            where: { id: 'AMB-002' },
            update: { assignedSupervisorId: 'IA-002', riskTier: client_1.PromoterRiskTier.LOW },
            create: {
                id: 'AMB-002',
                tenantId: TENANT_ID,
                displayName: 'Elena Park',
                handle: '@elenapark',
                primaryPlatform: 'YOUTUBE',
                status: 'ACTIVE',
                riskTier: client_1.PromoterRiskTier.LOW,
                assignedSupervisorId: 'IA-002',
            },
        }),
        prisma.ambassadorProfile.upsert({
            where: { id: 'AMB-003' },
            update: { assignedSupervisorId: 'IA-002', riskTier: client_1.PromoterRiskTier.MEDIUM },
            create: {
                id: 'AMB-003',
                tenantId: TENANT_ID,
                displayName: 'Alex Tran',
                handle: '@alextran_finance',
                primaryPlatform: 'TWITTER_X',
                status: 'ACTIVE',
                riskTier: client_1.PromoterRiskTier.MEDIUM,
                assignedSupervisorId: 'IA-002',
            },
        }),
        prisma.ambassadorProfile.upsert({
            where: { id: 'AMB-004' },
            update: { assignedSupervisorId: 'IA-003', riskTier: client_1.PromoterRiskTier.HIGH },
            create: {
                id: 'AMB-004',
                tenantId: TENANT_ID,
                displayName: 'Dani Reyes',
                handle: '@danireyes',
                primaryPlatform: 'TWITTER_X',
                status: 'PENDING_REVIEW',
                riskTier: client_1.PromoterRiskTier.HIGH,
                assignedSupervisorId: 'IA-003',
            },
        }),
        prisma.ambassadorProfile.upsert({
            where: { id: 'AMB-005' },
            update: { assignedSupervisorId: 'IA-001', riskTier: client_1.PromoterRiskTier.LOW },
            create: {
                id: 'AMB-005',
                tenantId: TENANT_ID,
                displayName: 'Mia Forbes',
                handle: '@mia.forbes',
                primaryPlatform: 'YOUTUBE',
                status: 'ACTIVE',
                riskTier: client_1.PromoterRiskTier.LOW,
                assignedSupervisorId: 'IA-001',
            },
        }),
    ]);
    console.log(`✓ ${ambassadors.length} ambassadors seeded`);
    // ─── Campaigns ───────────────────────────────────────────
    const campaigns = await Promise.all([
        prisma.campaign.upsert({
            where: { id: 'CAMP-AGI' },
            update: {},
            create: {
                id: 'CAMP-AGI',
                tenantId: TENANT_ID,
                campaignName: 'Apex Growth I',
                campaignType: 'INVESTMENT',
                status: 'LIVE',
            },
        }),
        prisma.campaign.upsert({
            where: { id: 'CAMP-MTL' },
            update: {},
            create: {
                id: 'CAMP-MTL',
                tenantId: TENANT_ID,
                campaignName: 'Meridian Tech L/S',
                campaignType: 'INVESTMENT',
                status: 'DSS_EVALUATION',
            },
        }),
        prisma.campaign.upsert({
            where: { id: 'CAMP-HCD' },
            update: {},
            create: {
                id: 'CAMP-HCD',
                tenantId: TENANT_ID,
                campaignName: 'Horizon Capital Distribution',
                campaignType: 'FINTECH',
                status: 'LIVE',
            },
        }),
    ]);
    console.log(`✓ ${campaigns.length} campaigns seeded`);
    // ─── Content Records ─────────────────────────────────────
    const records = [
        {
            id: 'CR-001',
            tenantId: TENANT_ID,
            ambassadorId: 'AMB-001',
            campaignId: 'CAMP-AGI',
            sourcePlatform: 'INSTAGRAM',
            contentType: 'IMAGE_POST',
            sourceUrl: 'https://instagram.com/p/example-001',
            externalContentId: 'IG-POST-001',
            title: null,
            bodyText: 'Excited to be part of something special with Apex Growth I. These opportunities don\'t come around often — this is a unique moment for accredited investors. Not financial advice.',
            transcriptText: null,
            postedAt: new Date('2025-03-05T14:22:00Z'),
            archiveStatus: 'ESCALATED',
        },
        {
            id: 'CR-002',
            tenantId: TENANT_ID,
            ambassadorId: 'AMB-003',
            campaignId: 'CAMP-MTL',
            sourcePlatform: 'TWITTER_X',
            contentType: 'THREAD',
            sourceUrl: 'https://twitter.com/alextran_finance/status/example-002',
            externalContentId: 'TWEET-002',
            title: null,
            bodyText: '1/ I\'ve been watching Meridian Tech L/S for a while. Here\'s my breakdown of why I think this is worth serious attention [thread]. For accredited investors only. This is not financial advice.',
            transcriptText: null,
            postedAt: new Date('2025-03-04T09:10:00Z'),
            archiveStatus: 'PENDING_REVIEW',
        },
        {
            id: 'CR-003',
            tenantId: TENANT_ID,
            ambassadorId: 'AMB-005',
            campaignId: 'CAMP-HCD',
            sourcePlatform: 'YOUTUBE',
            contentType: 'VIDEO',
            sourceUrl: 'https://youtube.com/watch?v=example-003',
            externalContentId: 'YT-003',
            title: 'Why I\'m watching Horizon Capital Distribution | Not financial advice',
            bodyText: 'In today\'s video I\'m walking through Horizon Capital Distribution, what it is, and why I think the structure is interesting. Full details in description. Not financial advice.',
            transcriptText: 'Hey everyone welcome back to the channel. Today I want to talk about something I\'ve been researching for the past few weeks...',
            postedAt: new Date('2025-02-28T18:00:00Z'),
            archiveStatus: 'PENDING_REVIEW',
        },
        {
            id: 'CR-004',
            tenantId: TENANT_ID,
            ambassadorId: 'AMB-003',
            campaignId: 'CAMP-MTL',
            sourcePlatform: 'FACEBOOK',
            contentType: 'LONG_FORM_POST',
            sourceUrl: 'https://facebook.com/alextran_finance/posts/example-004',
            externalContentId: 'FB-004',
            title: null,
            bodyText: 'Had a great conversation about Meridian Tech\'s long-short approach. "High conviction opportunity" for those paying attention. Full disclosure always — not financial advice.',
            transcriptText: null,
            postedAt: new Date('2025-02-20T10:30:00Z'),
            archiveStatus: 'REVIEWED',
        },
        {
            id: 'CR-005',
            tenantId: TENANT_ID,
            ambassadorId: 'AMB-001',
            campaignId: 'CAMP-AGI',
            sourcePlatform: 'TWITTER_X',
            contentType: 'TWEET',
            sourceUrl: 'https://twitter.com/sasha.moreno/status/example-005',
            externalContentId: 'TWEET-005',
            title: null,
            bodyText: 'Big week coming for Apex Growth I. If you\'re an accredited investor and haven\'t looked at this yet, now\'s the time. Link in bio.',
            transcriptText: null,
            postedAt: new Date('2025-02-18T02:14:00Z'),
            archiveStatus: 'CLOSED',
        },
        {
            id: 'CR-006',
            tenantId: TENANT_ID,
            ambassadorId: 'AMB-002',
            campaignId: 'CAMP-HCD',
            sourcePlatform: 'YOUTUBE',
            contentType: 'VIDEO',
            sourceUrl: 'https://youtube.com/watch?v=example-006',
            externalContentId: 'YT-006',
            title: 'Horizon Capital Distribution — Why This Is a Ground Floor Opportunity',
            bodyText: 'I\'ve done the research so you don\'t have to. Horizon Capital Distribution offers guaranteed returns that outperform anything else on the market right now. This is a once in a lifetime ground floor opportunity — and if you\'re serious about passive income, you cannot afford to miss it. Not financial advice.',
            transcriptText: null,
            postedAt: new Date('2026-03-10T15:30:00Z'),
            archiveStatus: 'PENDING_REVIEW',
        },
    ];
    for (const rec of records) {
        const checksum = (0, checksum_1.computeChecksum)(rec.sourceUrl, rec.bodyText);
        await prisma.contentRecord.upsert({
            where: { id: rec.id },
            update: {},
            create: { ...rec, checksum },
        });
        const existingEvent = await prisma.archiveEventLog.findFirst({
            where: { contentRecordId: rec.id, eventType: 'RECORD_CREATED' },
        });
        if (!existingEvent) {
            await prisma.archiveEventLog.create({
                data: {
                    tenantId: TENANT_ID,
                    contentRecordId: rec.id,
                    eventType: client_1.ArchiveEventType.RECORD_CREATED,
                    eventNote: `Content captured from ${rec.sourcePlatform} — ${rec.sourceUrl}`,
                    actorId: 'SYSTEM',
                },
            });
        }
    }
    console.log(`✓ ${records.length} content records seeded`);
    // ─── Detection Records ─────────────────────────────────────
    let detectionCount = 0;
    for (const rec of records) {
        const hits = (0, ruleRegistry_1.detectRuleHits)(rec.bodyText);
        if (!hits.length)
            continue;
        for (const hit of hits) {
            const detId = `DET-${rec.id}-${hit.ruleCode}-${hit.matchedPhrase.replace(/\s+/g, '_')}`;
            await prisma.detectionRecord.upsert({
                where: { id: detId },
                update: {},
                create: {
                    id: detId,
                    tenantId: TENANT_ID,
                    contentRecordId: rec.id,
                    ruleCode: hit.ruleCode,
                    ruleName: hit.ruleName,
                    matchedPhrase: hit.matchedPhrase,
                    severity: hit.severity,
                    detectionMethod: hit.detectionMethod,
                },
            });
            detectionCount++;
        }
    }
    console.log(`✓ ${detectionCount} detection record${detectionCount !== 1 ? 's' : ''} backfilled for seeded content`);
    // ─── Media Assets ─────────────────────────────────────────
    const assets = [
        { id: 'MA-001', tenantId: TENANT_ID, contentRecordId: 'CR-003', assetType: 'THUMBNAIL', assetUrl: 'https://storage.fundurex.com/iw/CR-003/thumbnail.jpg', mimeType: 'image/jpeg', durationSeconds: null },
        { id: 'MA-002', tenantId: TENANT_ID, contentRecordId: 'CR-003', assetType: 'VIDEO_FILE', assetUrl: 'https://storage.fundurex.com/iw/CR-003/video.mp4', mimeType: 'video/mp4', durationSeconds: 847 },
        { id: 'MA-003', tenantId: TENANT_ID, contentRecordId: 'CR-001', assetType: 'SCREENSHOT', assetUrl: 'https://storage.fundurex.com/iw/CR-001/screenshot.png', mimeType: 'image/png', durationSeconds: null },
    ];
    for (const asset of assets) {
        await prisma.contentMediaAsset.upsert({
            where: { id: asset.id },
            update: {},
            create: asset,
        });
    }
    console.log(`✓ ${assets.length} media assets seeded`);
    // ─── Additional Event Log Entries ─────────────────────────
    const extraEvents = [
        { id: 'SEED-EVT-001', tenantId: TENANT_ID, contentRecordId: 'CR-001', eventType: client_1.ArchiveEventType.STATUS_CHANGED, eventNote: 'Status changed: CAPTURED → ESCALATED — Unauthorized performance claim detected', actorId: 'COMPLIANCE-01' },
        { id: 'SEED-EVT-002', tenantId: TENANT_ID, contentRecordId: 'CR-001', eventType: client_1.ArchiveEventType.ESCALATION_RAISED, eventNote: 'Escalated to legal review — post reached 84K impressions before flagged', actorId: 'COMPLIANCE-01' },
        { id: 'SEED-EVT-003', tenantId: TENANT_ID, contentRecordId: 'CR-002', eventType: client_1.ArchiveEventType.STATUS_CHANGED, eventNote: 'Status changed: CAPTURED → PENDING_REVIEW — Off-platform communication flagged', actorId: 'SYSTEM' },
        { id: 'SEED-EVT-004', tenantId: TENANT_ID, contentRecordId: 'CR-004', eventType: client_1.ArchiveEventType.REVIEW_STARTED, eventNote: 'Human review started — minor wording deviation', actorId: 'COMPLIANCE-02' },
        { id: 'SEED-EVT-005', tenantId: TENANT_ID, contentRecordId: 'CR-004', eventType: client_1.ArchiveEventType.REVIEW_COMPLETED, eventNote: 'Review complete. "High conviction opportunity" flagged as minor deviation. Ambassador correction confirmed.', actorId: 'COMPLIANCE-02' },
        { id: 'SEED-EVT-006', tenantId: TENANT_ID, contentRecordId: 'CR-005', eventType: client_1.ArchiveEventType.REVIEW_COMPLETED, eventNote: 'Post outside approved window (2:14am). Timing policy reminder sent. No material violation.', actorId: 'COMPLIANCE-01' },
    ];
    for (const event of extraEvents) {
        await prisma.archiveEventLog.upsert({
            where: { id: event.id },
            update: {},
            create: event,
        });
    }
    console.log(`✓ ${extraEvents.length} audit events seeded`);
    // ─── Legal Holds ──────────────────────────────────────────
    const legalHolds = [
        { id: 'LH-001', tenantId: TENANT_ID, holdName: 'SEC Examination Hold — Q1 2026', holdType: 'Regulatory Inquiry', scope: 'All promotional content records for ambassadors AMB-001 and AMB-003 published between 2025-01-01 and 2026-03-18.', recordsFrozen: 47, placedBy: 'IA-001', legalAuthority: 'SEC Rule 17a-4 / FINRA Rule 4511', datePlaced: new Date('2026-03-10T09:00:00Z'), basis: 'SEC staff examination request received 2026-03-10.', status: 'ACTIVE' },
        { id: 'LH-002', tenantId: TENANT_ID, holdName: 'FINRA Rule 8210 Request — 2025 Audit', holdType: 'Subpoena', scope: 'All content records, event logs, and contract documents for the 2025 calendar year.', recordsFrozen: 183, placedBy: 'IA-002', legalAuthority: 'FINRA Rule 8210', datePlaced: new Date('2025-11-15T14:30:00Z'), basis: 'FINRA annual examination document request.', status: 'RELEASED', releasedBy: 'IA-001', releasedAt: new Date('2026-02-28T17:00:00Z'), releaseReason: 'FINRA examination concluded. No adverse findings.' },
    ];
    for (const hold of legalHolds) {
        await prisma.legalHold.upsert({
            where: { id: hold.id },
            update: {},
            create: hold,
        });
    }
    console.log(`✓ ${legalHolds.length} legal holds seeded`);
    // ─── Tail Periods ─────────────────────────────────────────
    const tailPeriods = [
        { id: 'TP-001', tenantId: TENANT_ID, ambassadorId: 'AMB-004', contractEndDate: new Date('2026-01-31'), tailDays: 90, tailStartDate: new Date('2026-02-01'), tailEndDate: new Date('2026-05-01'), reason: 'High-risk promoter — elevated monitoring required.', riskTier: 'HIGH', tailType: 'EXTENDED', status: 'ACTIVE', postContractFlags: 3 },
        { id: 'TP-002', tenantId: TENANT_ID, ambassadorId: 'AMB-005', contractEndDate: new Date('2025-10-31'), tailDays: 60, tailStartDate: new Date('2025-11-01'), tailEndDate: new Date('2025-12-31'), reason: 'Standard post-contract tail.', riskTier: 'LOW', tailType: 'STANDARD', status: 'CLOSED', postContractFlags: 0, closedAt: new Date('2026-01-03T10:00:00Z'), closedBy: 'IA-001', closedReason: 'Tail period completed. No violations detected.' },
    ];
    for (const tp of tailPeriods) {
        await prisma.tailPeriod.upsert({
            where: { id: tp.id },
            update: {},
            create: tp,
        });
    }
    console.log(`✓ ${tailPeriods.length} tail periods seeded`);
    // ─── Pre-Approval Requests ────────────────────────────────
    const preApprovals = [
        { id: 'PAR-001', tenantId: TENANT_ID, ambassadorId: 'AMB-001', submittedBy: 'AMB-001', contentType: 'Social Post', platform: 'INSTAGRAM', contentPreview: "Excited to share something I've been watching closely — Apex Growth I.", requiredBy: new Date('2026-03-25T17:00:00Z'), assignedPrincipalId: 'IA-001', status: 'PENDING', slaHours: 48 },
        { id: 'PAR-002', tenantId: TENANT_ID, ambassadorId: 'AMB-003', submittedBy: 'AMB-003', contentType: 'Video', platform: 'TWITTER_X', contentPreview: "Thread: Why I've been watching Meridian Tech L/S.", requiredBy: new Date('2026-03-24T12:00:00Z'), assignedPrincipalId: 'IA-002', status: 'PENDING', slaHours: 24 },
        { id: 'PAR-003', tenantId: TENANT_ID, ambassadorId: 'AMB-002', submittedBy: 'AMB-002', contentType: 'Blog', platform: 'YOUTUBE', contentPreview: 'Video description: Horizon Capital Distribution strategy walkthrough.', status: 'APPROVED', slaHours: 48, decision: 'Content is compliant. Approved for publication.', decidedBy: 'IA-001', decidedAt: new Date('2026-03-15T14:30:00Z') },
    ];
    for (const par of preApprovals) {
        await prisma.preApprovalRequest.upsert({
            where: { id: par.id },
            update: {},
            create: par,
        });
    }
    console.log(`✓ ${preApprovals.length} pre-approval requests seeded`);
    console.log('\n✅ InfluWatch seed complete (multi-tenant).\n');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map