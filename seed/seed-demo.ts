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

import { PrismaClient, ArchiveStatus, ArchiveEventType, InternalActorRole, PromoterRiskTier, Severity } from '@prisma/client';
import { computeChecksum } from '../src/utils/checksum';
import { detectRuleHits } from '../src/lib/ruleRegistry';

const prisma = new PrismaClient();
const T = 'DEFAULT_TENANT';

async function main() {
  console.log('🌱 Seeding InfluWatch demo dataset...\n');

  // Set RLS tenant context so upserts pass row-level security policies
  await prisma.$executeRawUnsafe(`SET app.tenant_id = '${T}'`);

  // ─── Additional Promoters ──────────────────────────────────

  const promoters = [
    // Per-conversion (highest risk)
    { id: 'AMB-DEMO-01', displayName: 'Marcus Venn', handle: '@marcusvenn', email: 'info+marcus@influwatch.com', platform: 'YOUTUBE' as const, risk: PromoterRiskTier.CRITICAL, supervisor: 'IA-001', status: 'ACTIVE' as const },
    { id: 'AMB-DEMO-02', displayName: 'Jordan Blake', handle: '@jordanblake_fx', email: 'info+jordan@influwatch.com', platform: 'INSTAGRAM' as const, risk: PromoterRiskTier.CRITICAL, supervisor: 'IA-001', status: 'ACTIVE' as const },
    // Flat-fee
    { id: 'AMB-DEMO-03', displayName: 'Nina Castillo', handle: '@nina.castillo', email: 'info+nina@influwatch.com', platform: 'TIKTOK' as const, risk: PromoterRiskTier.MEDIUM, supervisor: 'IA-002', status: 'ACTIVE' as const },
    { id: 'AMB-DEMO-04', displayName: 'Derek Tao', handle: '@derektao', email: 'info+derek@influwatch.com', platform: 'TWITTER_X' as const, risk: PromoterRiskTier.LOW, supervisor: 'IA-002', status: 'ACTIVE' as const },
    // Revenue share
    { id: 'AMB-DEMO-05', displayName: 'Priya Sharma', handle: '@priya.invests', email: 'info+priya@influwatch.com', platform: 'YOUTUBE' as const, risk: PromoterRiskTier.HIGH, supervisor: 'IA-001', status: 'ACTIVE' as const },
    // Uncompensated (contrast)
    { id: 'AMB-DEMO-06', displayName: 'Ryan Michaels', handle: '@ryanmichaels', email: 'info+ryan@influwatch.com', platform: 'TWITTER_X' as const, risk: PromoterRiskTier.LOW, supervisor: 'IA-003', status: 'ACTIVE' as const },
    // Terminated — tail period
    { id: 'AMB-DEMO-07', displayName: 'Leah Foster', handle: '@leah.foster', email: 'info+leah@influwatch.com', platform: 'INSTAGRAM' as const, risk: PromoterRiskTier.HIGH, supervisor: 'IA-001', status: 'INACTIVE' as const },
  ];

  for (const p of promoters) {
    await prisma.ambassadorProfile.upsert({
      where: { id: p.id },
      update: { riskTier: p.risk, status: p.status, email: p.email },
      create: {
        id: p.id, tenantId: T, displayName: p.displayName, handle: p.handle, email: p.email,
        primaryPlatform: p.platform, riskTier: p.risk, status: p.status,
        assignedSupervisorId: p.supervisor,
      },
    });
  }
  console.log(`✓ ${promoters.length} demo promoters seeded`);

  // ─── Content Records — REMOVED ────────────────────────────
  // Static content records used to be seeded here directly via
  // prisma.contentRecord.create(), bypassing the createContentRecord
  // pipeline. That meant they had no exposure level, no compensation
  // type stamping, and no LLM detection — empty shells.
  //
  // All content now comes through the Demo Simulator which routes
  // every record through createContentRecord() and gets the full
  // detection / exposure / compensation pipeline.
  //
  // To populate content records: click "Run Demo Simulator" in the
  // UI after seeding, or POST to /api/influwatch/debug/simulate-ingest

  // Clean up legacy CR-DEMO-* records, their detections, and events
  // so the demo always starts from a known clean state.
  await prisma.archiveEventLog.deleteMany({
    where: { contentRecordId: { startsWith: 'CR-DEMO-' }, tenantId: T },
  });
  await prisma.detectionRecord.deleteMany({
    where: { contentRecordId: { startsWith: 'CR-DEMO-' }, tenantId: T },
  });
  await prisma.contentRecord.deleteMany({
    where: { id: { startsWith: 'CR-DEMO-' }, tenantId: T },
  });
  console.log('✓ Legacy CR-DEMO-* records cleared (use Demo Simulator to populate)');

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
        notes: (cs as any).notes || null,
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
        notes: (c as any).notes || null,
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
