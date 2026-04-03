// ============================================================
// FUNDUREX — INFLUWATCH
// Seed — Compensation Structures
//
// Creates CompensationStructure records for existing promoters
// so that compensationPosture is populated on new content ingests.
//
// Run: npx ts-node --transpile-only prisma/seed-compensation.ts
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding compensation structures...\n');

  // ── AMB-001: Sasha Moreno ──────────────────────────────────
  // Revenue Share, payment trigger: Investment Decision Completed
  // Supervision posture: HEIGHTENED
  // Characteristics: transaction-based, security-linked, variable comp
  const amb001 = await prisma.compensationStructure.upsert({
    where: { id: 'CS-AMB-001' },
    update: {},
    create: {
      id:                       'CS-AMB-001',
      promoterId:               'AMB-001',
      compensationForm:         'REVENUE_SHARE',
      compensationTrigger:      'INVESTMENT',
      productType:              'FUND',
      isTransactionBased:       true,
      isSecurityLinked:         true,
      isCompensationVariable:   true,
      requiresDisclosure:       true,
      requiresPrincipalReview:  true,
      supervisionPosture:       'HEIGHTENED',
      writtenAgreementRequired: true,
      agreementReference:       'AGR-AMB-001-2026',
      notes:                    'Revenue share tied to investment conversion. Heightened posture — all content requires pre-review.',
    },
  });
  console.log(`AMB-001 (Sasha Moreno): ${amb001.id} — ${amb001.compensationForm} / ${amb001.supervisionPosture}`);

  // ── AMB-003: Alex Tran ────────────────────────────────────
  // Flat Fee Per Post, payment trigger: Content Published
  // Supervision posture: STANDARD
  // Characteristics: not transaction-based, not security-linked, fixed comp
  const amb003 = await prisma.compensationStructure.upsert({
    where: { id: 'CS-AMB-003' },
    update: {},
    create: {
      id:                       'CS-AMB-003',
      promoterId:               'AMB-003',
      compensationForm:         'FLAT_FEE',
      compensationTrigger:      'REVENUE_GENERATED',
      productType:              'FINTECH',
      isTransactionBased:       false,
      isSecurityLinked:         false,
      isCompensationVariable:   false,
      requiresDisclosure:       true,
      requiresPrincipalReview:  false,
      supervisionPosture:       'STANDARD',
      writtenAgreementRequired: true,
      agreementReference:       'AGR-AMB-003-2026',
      notes:                    'Flat fee per post on content publication. Standard posture — disclosure required on all posts.',
    },
  });
  console.log(`AMB-003 (Alex Tran):   ${amb003.id} — ${amb003.compensationForm} / ${amb003.supervisionPosture}`);

  console.log('\nDone.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
