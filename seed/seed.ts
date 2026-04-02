// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Seed — example data
//
// Mirrors the platform's existing ambassador roster
// and campaign objects from the Fundurex system map.
//
// Run: npx ts-node seed/seed.ts
// ============================================================

import { PrismaClient, ArchiveStatus, ArchiveEventType, InternalActorRole, InternalActorStatus, PromoterRiskTier } from '@prisma/client';
import { computeChecksum } from '../src/utils/checksum';
import { detectRuleHits } from '../src/lib/ruleRegistry';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding InfluWatch Phase 1...');

  // ─── Internal Actors ──────────────────────────────────────
  // Must be seeded before ambassadors — ambassadors FK into internal_actors.

  const internalActors = await Promise.all([
    prisma.internalActor.upsert({
      where:  { id: 'IA-001' },
      update: { displayName: 'James Harlow', role: InternalActorRole.REGISTERED_PRINCIPAL, status: InternalActorStatus.ACTIVE, seriesLicense: 'Series 24', mfaEnabled: true, lastLoginAt: new Date('2026-03-17T08:30:00Z') },
      create: {
        id:            'IA-001',
        displayName:   'James Harlow',
        email:         'j.harlow@fundurex.com',
        role:          InternalActorRole.REGISTERED_PRINCIPAL,
        status:        InternalActorStatus.ACTIVE,
        seriesLicense: 'Series 24',
        mfaEnabled:    true,
        lastLoginAt:   new Date('2026-03-17T08:30:00Z'),
      },
    }),
    prisma.internalActor.upsert({
      where:  { id: 'IA-002' },
      update: { displayName: 'Sandra Okafor', role: InternalActorRole.DESIGNATED_SUPERVISOR, status: InternalActorStatus.ACTIVE, seriesLicense: 'Series 24', mfaEnabled: true, lastLoginAt: new Date('2026-03-17T09:14:00Z') },
      create: {
        id:            'IA-002',
        displayName:   'Sandra Okafor',
        email:         's.okafor@fundurex.com',
        role:          InternalActorRole.DESIGNATED_SUPERVISOR,
        status:        InternalActorStatus.ACTIVE,
        seriesLicense: 'Series 24',
        mfaEnabled:    true,
        lastLoginAt:   new Date('2026-03-17T09:14:00Z'),
      },
    }),
    prisma.internalActor.upsert({
      where:  { id: 'IA-003' },
      update: { displayName: 'Sofia Reyes', role: InternalActorRole.REVIEWER, status: InternalActorStatus.ACTIVE, seriesLicense: 'Series 65', mfaEnabled: true, lastLoginAt: new Date('2026-03-17T10:02:00Z') },
      create: {
        id:            'IA-003',
        displayName:   'Sofia Reyes',
        email:         's.reyes@fundurex.com',
        role:          InternalActorRole.REVIEWER,
        status:        InternalActorStatus.ACTIVE,
        seriesLicense: 'Series 65',
        mfaEnabled:    true,
        lastLoginAt:   new Date('2026-03-17T10:02:00Z'),
      },
    }),
    prisma.internalActor.upsert({
      where:  { id: 'IA-004' },
      update: { displayName: 'Remy Delacroix', role: InternalActorRole.REVIEWER, status: InternalActorStatus.ACTIVE, seriesLicense: 'Series 65', mfaEnabled: false, lastLoginAt: new Date('2026-03-16T15:45:00Z') },
      create: {
        id:            'IA-004',
        displayName:   'Remy Delacroix',
        email:         'r.delacroix@fundurex.com',
        role:          InternalActorRole.REVIEWER,
        status:        InternalActorStatus.ACTIVE,
        seriesLicense: 'Series 65',
        mfaEnabled:    false,
        lastLoginAt:   new Date('2026-03-16T15:45:00Z'),
      },
    }),
    prisma.internalActor.upsert({
      where:  { id: 'IA-005' },
      update: { displayName: 'Marcus Chen', role: InternalActorRole.COMPLIANCE_OFFICER, status: InternalActorStatus.ACTIVE, seriesLicense: 'Series 24', mfaEnabled: true, lastLoginAt: new Date('2026-03-15T11:20:00Z') },
      create: {
        id:            'IA-005',
        displayName:   'Marcus Chen',
        email:         'm.chen@fundurex.com',
        role:          InternalActorRole.COMPLIANCE_OFFICER,
        status:        InternalActorStatus.ACTIVE,
        seriesLicense: 'Series 24',
        mfaEnabled:    true,
        lastLoginAt:   new Date('2026-03-15T11:20:00Z'),
      },
    }),
    prisma.internalActor.upsert({
      where:  { id: 'IA-006' },
      update: { displayName: 'Kevin Williams', role: InternalActorRole.TENANT_ADMIN, status: InternalActorStatus.ACTIVE, seriesLicense: null, mfaEnabled: true, lastLoginAt: new Date('2026-03-10T09:00:00Z') },
      create: {
        id:            'IA-006',
        displayName:   'Kevin Williams',
        email:         'k.williams@fundurex.com',
        role:          InternalActorRole.TENANT_ADMIN,
        status:        InternalActorStatus.ACTIVE,
        seriesLicense: null,
        mfaEnabled:    true,
        lastLoginAt:   new Date('2026-03-10T09:00:00Z'),
      },
    }),
  ]);

  console.log(`✓ ${internalActors.length} internal actors seeded`);

  // ─── Password hashes ──────────────────────────────────────
  // Set bcrypt hash for any actor whose passwordHash is still null.
  // Safe to re-run: only updates rows that have no hash yet.
  const passwordHash = await bcrypt.hash('influwatch2026', 12);
  const { count: hashCount } = await prisma.internalActor.updateMany({
    where: { passwordHash: null },
    data:  { passwordHash },
  });
  if (hashCount > 0) console.log(`✓ password hashes set for ${hashCount} actors`);
  else               console.log('· password hashes already set — skipped');

  // ─── Ambassadors ─────────────────────────────────────────
  const ambassadors = await Promise.all([
    prisma.ambassadorProfile.upsert({
      where:  { id: 'AMB-001' },
      update: { assignedSupervisorId: 'IA-001', riskTier: PromoterRiskTier.HIGH },
      create: {
        id:                  'AMB-001',
        displayName:         'Sasha Moreno',
        handle:              '@sasha.moreno',
        primaryPlatform:     'INSTAGRAM',
        status:              'ACTIVE',
        riskTier:            PromoterRiskTier.HIGH,
        assignedSupervisorId: 'IA-001',  // J. Harlow (Registered Principal)
      },
    }),
    prisma.ambassadorProfile.upsert({
      where:  { id: 'AMB-002' },
      update: { assignedSupervisorId: 'IA-002', riskTier: PromoterRiskTier.LOW },
      create: {
        id:                  'AMB-002',
        displayName:         'Elena Park',
        handle:              '@elenapark',
        primaryPlatform:     'YOUTUBE',
        status:              'ACTIVE',
        riskTier:            PromoterRiskTier.LOW,
        assignedSupervisorId: 'IA-002',  // S. Okafor (Designated Supervisor)
      },
    }),
    prisma.ambassadorProfile.upsert({
      where:  { id: 'AMB-003' },
      update: { assignedSupervisorId: 'IA-002', riskTier: PromoterRiskTier.MEDIUM },
      create: {
        id:                  'AMB-003',
        displayName:         'Alex Tran',
        handle:              '@alextran_finance',
        primaryPlatform:     'TWITTER_X',
        status:              'ACTIVE',
        riskTier:            PromoterRiskTier.MEDIUM,
        assignedSupervisorId: 'IA-002',  // S. Okafor (Designated Supervisor)
      },
    }),
    prisma.ambassadorProfile.upsert({
      where:  { id: 'AMB-004' },
      update: { assignedSupervisorId: 'IA-003', riskTier: PromoterRiskTier.HIGH },
      create: {
        id:                  'AMB-004',
        displayName:         'Dani Reyes',
        handle:              '@danireyes',
        primaryPlatform:     'TWITTER_X',
        status:              'PENDING_REVIEW',
        riskTier:            PromoterRiskTier.HIGH,
        assignedSupervisorId: 'IA-003',  // S. Reyes (Reviewer)
      },
    }),
    prisma.ambassadorProfile.upsert({
      where:  { id: 'AMB-005' },
      update: { assignedSupervisorId: 'IA-001', riskTier: PromoterRiskTier.LOW },
      create: {
        id:                  'AMB-005',
        displayName:         'Mia Forbes',
        handle:              '@mia.forbes',
        primaryPlatform:     'YOUTUBE',
        status:              'ACTIVE',
        riskTier:            PromoterRiskTier.LOW,
        assignedSupervisorId: 'IA-001',  // J. Harlow (Registered Principal)
      },
    }),
  ]);

  console.log(`✓ ${ambassadors.length} ambassadors seeded`);

  // ─── Campaigns ───────────────────────────────────────────
  const campaigns = await Promise.all([
    prisma.campaign.upsert({
      where:  { id: 'CAMP-AGI' },
      update: {},
      create: {
        id:           'CAMP-AGI',
        campaignName: 'Apex Growth I',
        campaignType: 'INVESTMENT',
        status:       'LIVE',
      },
    }),
    prisma.campaign.upsert({
      where:  { id: 'CAMP-MTL' },
      update: {},
      create: {
        id:           'CAMP-MTL',
        campaignName: 'Meridian Tech L/S',
        campaignType: 'INVESTMENT',
        status:       'DSS_EVALUATION',
      },
    }),
    prisma.campaign.upsert({
      where:  { id: 'CAMP-HCD' },
      update: {},
      create: {
        id:           'CAMP-HCD',
        campaignName: 'Horizon Capital Distribution',
        campaignType: 'FINTECH',
        status:       'LIVE',
      },
    }),
  ]);

  console.log(`✓ ${campaigns.length} campaigns seeded`);

  // ─── Content Records ─────────────────────────────────────

  const records = [
    {
      id:                'CR-001',
      ambassadorId:      'AMB-001',
      campaignId:        'CAMP-AGI',
      sourcePlatform:    'INSTAGRAM' as const,
      contentType:       'IMAGE_POST' as const,
      sourceUrl:         'https://instagram.com/p/example-001',
      externalContentId: 'IG-POST-001',
      title:             null,
      bodyText:          'Excited to be part of something special with Apex Growth I. These opportunities don\'t come around often — this is a unique moment for accredited investors. Not financial advice.',
      transcriptText:    null,
      postedAt:          new Date('2025-03-05T14:22:00Z'),
      archiveStatus:     'ESCALATED' as const,
    },
    {
      id:                'CR-002',
      ambassadorId:      'AMB-003',
      campaignId:        'CAMP-MTL',
      sourcePlatform:    'TWITTER_X' as const,
      contentType:       'THREAD' as const,
      sourceUrl:         'https://twitter.com/alextran_finance/status/example-002',
      externalContentId: 'TWEET-002',
      title:             null,
      bodyText:          '1/ I\'ve been watching Meridian Tech L/S for a while. Here\'s my breakdown of why I think this is worth serious attention [thread]. For accredited investors only. This is not financial advice.',
      transcriptText:    null,
      postedAt:          new Date('2025-03-04T09:10:00Z'),
      archiveStatus:     'PENDING_REVIEW' as const,
    },
    {
      id:                'CR-003',
      ambassadorId:      'AMB-005',
      campaignId:        'CAMP-HCD',
      sourcePlatform:    'YOUTUBE' as const,
      contentType:       'VIDEO' as const,
      sourceUrl:         'https://youtube.com/watch?v=example-003',
      externalContentId: 'YT-003',
      title:             'Why I\'m watching Horizon Capital Distribution | Not financial advice',
      bodyText:          'In today\'s video I\'m walking through Horizon Capital Distribution, what it is, and why I think the structure is interesting. Full details in description. Not financial advice.',
      transcriptText:    'Hey everyone welcome back to the channel. Today I want to talk about something I\'ve been researching for the past few weeks...',
      postedAt:          new Date('2025-02-28T18:00:00Z'),
      archiveStatus:     'PENDING_REVIEW' as const,
    },
    {
      id:                'CR-004',
      ambassadorId:      'AMB-003',
      campaignId:        'CAMP-MTL',
      sourcePlatform:    'FACEBOOK' as const,
      contentType:       'LONG_FORM_POST' as const,
      sourceUrl:         'https://facebook.com/alextran_finance/posts/example-004',
      externalContentId: 'FB-004',
      title:             null,
      bodyText:          'Had a great conversation about Meridian Tech\'s long-short approach. "High conviction opportunity" for those paying attention. Full disclosure always — not financial advice.',
      transcriptText:    null,
      postedAt:          new Date('2025-02-20T10:30:00Z'),
      archiveStatus:     'REVIEWED' as const,
    },
    {
      id:                'CR-005',
      ambassadorId:      'AMB-001',
      campaignId:        'CAMP-AGI',
      sourcePlatform:    'TWITTER_X' as const,
      contentType:       'TWEET' as const,
      sourceUrl:         'https://twitter.com/sasha.moreno/status/example-005',
      externalContentId: 'TWEET-005',
      title:             null,
      bodyText:          'Big week coming for Apex Growth I. If you\'re an accredited investor and haven\'t looked at this yet, now\'s the time. Link in bio.',
      transcriptText:    null,
      postedAt:          new Date('2025-02-18T02:14:00Z'),
      archiveStatus:     'CLOSED' as const,
    },
    {
      // Multi-hit record — designed to exercise the detection engine across
      // three rules and four phrases. Used to verify multi-hit rendering in
      // Flag Review (RULES HIT field, detection section, severity badge).
      id:                'CR-006',
      ambassadorId:      'AMB-002',
      campaignId:        'CAMP-HCD',
      sourcePlatform:    'YOUTUBE' as const,
      contentType:       'VIDEO' as const,
      sourceUrl:         'https://youtube.com/watch?v=example-006',
      externalContentId: 'YT-006',
      title:             'Horizon Capital Distribution — Why This Is a Ground Floor Opportunity',
      bodyText:          'I\'ve done the research so you don\'t have to. Horizon Capital Distribution offers guaranteed returns that outperform anything else on the market right now. This is a once in a lifetime ground floor opportunity — and if you\'re serious about passive income, you cannot afford to miss it. Not financial advice.',
      transcriptText:    null,
      postedAt:          new Date('2026-03-10T15:30:00Z'),
      archiveStatus:     'PENDING_REVIEW' as const,
    },
  ];

  for (const rec of records) {
    const checksum = computeChecksum(rec.sourceUrl, rec.bodyText);

    await prisma.contentRecord.upsert({
      where:  { id: rec.id },
      update: {},
      create: { ...rec, checksum },
    });

    // Seed the creation event
    const existingEvent = await prisma.archiveEventLog.findFirst({
      where: { contentRecordId: rec.id, eventType: 'RECORD_CREATED' },
    });

    if (!existingEvent) {
      await prisma.archiveEventLog.create({
        data: {
          contentRecordId: rec.id,
          eventType:       ArchiveEventType.RECORD_CREATED,
          eventNote:       `Content captured from ${rec.sourcePlatform} — ${rec.sourceUrl}`,
          actorId:         'SYSTEM',
        },
      });
    }
  }

  console.log(`✓ ${records.length} content records seeded`);

  // ─── Detection Records — backfill for seeded content ─────
  //
  // Runs detectRuleHits() against each seeded record's bodyText
  // and upserts detection rows. Only records whose text actually
  // matches a phrase in the rule registry will get rows — records
  // whose archiveStatus was set manually in the seed (e.g. CR-002,
  // CR-004) will have zero detection rows, which is correct.
  //
  // Expected hits from current seed data:
  //   CR-001: "unique moment" → IW-BD-007 HIGH
  //   CR-002 through CR-005: no phrase matches

  let detectionCount = 0;
  for (const rec of records) {
    const hits = detectRuleHits(rec.bodyText);
    if (!hits.length) continue;

    for (const hit of hits) {
      // Use a deterministic synthetic ID so re-running seed is idempotent
      const detId = `DET-${rec.id}-${hit.ruleCode}-${hit.matchedPhrase.replace(/\s+/g, '_')}`;
      await prisma.detectionRecord.upsert({
        where:  { id: detId },
        update: {},
        create: {
          id:              detId,
          contentRecordId: rec.id,
          ruleCode:        hit.ruleCode,
          ruleName:        hit.ruleName,
          matchedPhrase:   hit.matchedPhrase,
          severity:        hit.severity,
          detectionMethod: hit.detectionMethod,
        },
      });
      detectionCount++;
    }
  }

  console.log(`✓ ${detectionCount} detection record${detectionCount !== 1 ? 's' : ''} backfilled for seeded content`);

  // ─── Media Assets ─────────────────────────────────────────

  const assets = [
    {
      id:              'MA-001',
      contentRecordId: 'CR-003',
      assetType:       'THUMBNAIL' as const,
      assetUrl:        'https://storage.fundurex.com/iw/CR-003/thumbnail.jpg',
      mimeType:        'image/jpeg',
      durationSeconds: null,
    },
    {
      id:              'MA-002',
      contentRecordId: 'CR-003',
      assetType:       'VIDEO_FILE' as const,
      assetUrl:        'https://storage.fundurex.com/iw/CR-003/video.mp4',
      mimeType:        'video/mp4',
      durationSeconds: 847,
    },
    {
      id:              'MA-003',
      contentRecordId: 'CR-001',
      assetType:       'SCREENSHOT' as const,
      assetUrl:        'https://storage.fundurex.com/iw/CR-001/screenshot.png',
      mimeType:        'image/png',
      durationSeconds: null,
    },
  ];

  for (const asset of assets) {
    await prisma.contentMediaAsset.upsert({
      where:  { id: asset.id },
      update: {},
      create: asset,
    });
  }

  console.log(`✓ ${assets.length} media assets seeded`);

  // ─── Additional Event Log Entries ─────────────────────────

  const extraEvents = [
    {
      id:              'SEED-EVT-001',
      contentRecordId: 'CR-001',
      eventType:       ArchiveEventType.STATUS_CHANGED,
      eventNote:       'Status changed: CAPTURED → ESCALATED — Unauthorized performance claim detected',
      actorId:         'COMPLIANCE-01',
    },
    {
      id:              'SEED-EVT-002',
      contentRecordId: 'CR-001',
      eventType:       ArchiveEventType.ESCALATION_RAISED,
      eventNote:       'Escalated to legal review — post reached 84K impressions before flagged',
      actorId:         'COMPLIANCE-01',
    },
    {
      id:              'SEED-EVT-003',
      contentRecordId: 'CR-002',
      eventType:       ArchiveEventType.STATUS_CHANGED,
      eventNote:       'Status changed: CAPTURED → PENDING_REVIEW — Off-platform communication flagged',
      actorId:         'SYSTEM',
    },
    {
      id:              'SEED-EVT-004',
      contentRecordId: 'CR-004',
      eventType:       ArchiveEventType.REVIEW_STARTED,
      eventNote:       'Human review started — minor wording deviation',
      actorId:         'COMPLIANCE-02',
    },
    {
      id:              'SEED-EVT-005',
      contentRecordId: 'CR-004',
      eventType:       ArchiveEventType.REVIEW_COMPLETED,
      eventNote:       'Review complete. "High conviction opportunity" flagged as minor deviation. Ambassador correction confirmed.',
      actorId:         'COMPLIANCE-02',
    },
    {
      id:              'SEED-EVT-006',
      contentRecordId: 'CR-005',
      eventType:       ArchiveEventType.REVIEW_COMPLETED,
      eventNote:       'Post outside approved window (2:14am). Timing policy reminder sent. No material violation.',
      actorId:         'COMPLIANCE-01',
    },
  ];

  for (const event of extraEvents) {
    await prisma.archiveEventLog.upsert({
      where:  { id: event.id },
      update: {},
      create: event,
    });
  }

  console.log(`✓ ${extraEvents.length} audit events seeded`);

  // ─── Legal Holds ──────────────────────────────────────────
  const legalHolds = [
    {
      id:             'LH-001',
      holdName:       'SEC Examination Hold — Q1 2026',
      holdType:       'Regulatory Inquiry',
      scope:          'All promotional content records for ambassadors AMB-001 (Marcus Venn) and AMB-003 (Derek Tao) published between 2025-01-01 and 2026-03-18.',
      recordsFrozen:  47,
      placedBy:       'IA-001',
      legalAuthority: 'SEC Rule 17a-4 / FINRA Rule 4511',
      datePlaced:     new Date('2026-03-10T09:00:00Z'),
      basis:          'SEC staff examination request received 2026-03-10 covering potential undisclosed compensation arrangements and promotional content compliance.',
      status:         'ACTIVE',
    },
    {
      id:             'LH-002',
      holdName:       'FINRA Rule 8210 Request — 2025 Audit',
      holdType:       'Subpoena',
      scope:          'All content records, event logs, and contract documents for the 2025 calendar year across all registered promoters.',
      recordsFrozen:  183,
      placedBy:       'IA-002',
      legalAuthority: 'FINRA Rule 8210',
      datePlaced:     new Date('2025-11-15T14:30:00Z'),
      basis:          'FINRA annual examination document request requiring preservation of all promotional supervision records for 2025.',
      status:         'RELEASED',
      releasedBy:     'IA-001',
      releasedAt:     new Date('2026-02-28T17:00:00Z'),
      releaseReason:  'FINRA examination concluded. All requested documents delivered. No adverse findings. Hold released per compliance officer authorization.',
    },
  ];

  for (const hold of legalHolds) {
    await prisma.legalHold.upsert({
      where:  { id: hold.id },
      update: {},
      create: hold as any,
    });
  }

  console.log(`✓ ${legalHolds.length} legal holds seeded`);

  // ─── Tail Periods ─────────────────────────────────────────
  const tailPeriods = [
    {
      id:               'TP-001',
      ambassadorId:     'AMB-004',
      contractEndDate:  new Date('2026-01-31T00:00:00Z'),
      tailDays:         90,
      tailStartDate:    new Date('2026-02-01T00:00:00Z'),
      tailEndDate:      new Date('2026-05-01T00:00:00Z'),
      reason:           'High-risk promoter — elevated post-contract monitoring required per supervisory plan.',
      riskTier:         'HIGH',
      tailType:         'EXTENDED',
      status:           'ACTIVE',
      postContractFlags: 3,
    },
    {
      id:               'TP-002',
      ambassadorId:     'AMB-005',
      contractEndDate:  new Date('2025-10-31T00:00:00Z'),
      tailDays:         60,
      tailStartDate:    new Date('2025-11-01T00:00:00Z'),
      tailEndDate:      new Date('2025-12-31T00:00:00Z'),
      reason:           'Standard post-contract tail per firm policy.',
      riskTier:         'LOW',
      tailType:         'STANDARD',
      status:           'CLOSED',
      postContractFlags: 0,
      closedAt:         new Date('2026-01-03T10:00:00Z'),
      closedBy:         'IA-001',
      closedReason:     'Tail period completed. No post-contract violations detected. Monitoring obligation satisfied.',
    },
  ];

  for (const tp of tailPeriods) {
    await prisma.tailPeriod.upsert({
      where:  { id: tp.id },
      update: {},
      create: tp as any,
    });
  }

  console.log(`✓ ${tailPeriods.length} tail periods seeded`);

  // ─── Pre-Approval Requests ────────────────────────────────
  const preApprovals = [
    {
      id:             'PAR-001',
      ambassadorId:   'AMB-001',
      submittedBy:    'AMB-001',
      contentType:    'Social Post',
      platform:       'INSTAGRAM',
      contentPreview: "Excited to share something I've been watching closely — Apex Growth I. If you're an accredited investor looking for diversified exposure, this is worth a serious look. Full disclosure: I'm a paid promoter for this campaign. Not financial advice.",
      requiredBy:     new Date('2026-03-25T17:00:00Z'),
      assignedPrincipalId: 'IA-001',
      status:         'PENDING',
      slaHours:       48,
    },
    {
      id:             'PAR-002',
      ambassadorId:   'AMB-003',
      submittedBy:    'AMB-003',
      contentType:    'Video',
      platform:       'TWITTER_X',
      contentPreview: "Thread: Why I've been watching Meridian Tech L/S. 1/ The long-short structure gives downside protection most retail products don't. 2/ Management has a clear track record. 3/ I am a paid promoter — see pinned disclosure. Not financial advice. Full thread below.",
      requiredBy:     new Date('2026-03-24T12:00:00Z'),
      assignedPrincipalId: 'IA-002',
      status:         'PENDING',
      slaHours:       24,
    },
    {
      id:             'PAR-003',
      ambassadorId:   'AMB-002',
      submittedBy:    'AMB-002',
      contentType:    'Blog',
      platform:       'YOUTUBE',
      contentPreview: 'Video description: In this video I walk through the Horizon Capital Distribution strategy, why I think the fee structure is competitive, and what accredited investors should know before considering it. I am compensated by Fundurex for this content. This is not investment advice.',
      status:         'APPROVED',
      slaHours:       48,
      decision:       'Content is compliant. Disclosure language is prominent and accurate. Compensation acknowledgment meets FINRA 2210 requirements. Approved for publication.',
      decidedBy:      'IA-001',
      decidedAt:      new Date('2026-03-15T14:30:00Z'),
    },
  ];

  for (const par of preApprovals) {
    await prisma.preApprovalRequest.upsert({
      where:  { id: par.id },
      update: {},
      create: par as any,
    });
  }

  console.log(`✓ ${preApprovals.length} pre-approval requests seeded`);

  console.log('\n✅ InfluWatch Phase 1 seed complete.\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
