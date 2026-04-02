// ============================================================
// FUNDUREX — INFLUWATCH
// One-time migration: rename legacy rule codes to unified scheme
//
// Old code    → New code   New ruleName
// IW-BD-002   → RISK-001   False or Misleading Statements
// IW-BD-007   → RISK-002   Unbalanced Risk Disclosure
// IW-RIA-003  → RISK-003   Performance Claims Without Required Disclosures
//
// Run once after deploying ruleRegistry.ts rename.
// Safe to re-run — rows already on new codes will match 0 rows.
//
// Usage:
//   npx ts-node scripts/migrate-rule-codes.ts
// ============================================================

import prisma from '../src/utils/prisma';

const MIGRATIONS = [
  {
    oldCode:     'IW-BD-002',
    newCode:     'RISK-001',
    newRuleName: 'False or Misleading Statements',
  },
  {
    oldCode:     'IW-BD-007',
    newCode:     'RISK-002',
    newRuleName: 'Unbalanced Risk Disclosure',
  },
  {
    oldCode:     'IW-RIA-003',
    newCode:     'RISK-003',
    newRuleName: 'Performance Claims Without Required Disclosures',
  },
] as const;

async function main() {
  console.log('Starting rule code migration...\n');

  for (const m of MIGRATIONS) {
    const result = await prisma.detectionRecord.updateMany({
      where: { ruleCode: m.oldCode },
      data:  { ruleCode: m.newCode, ruleName: m.newRuleName },
    });

    console.log(
      `${m.oldCode} → ${m.newCode}  |  ${result.count} row${result.count !== 1 ? 's' : ''} updated`
    );
  }

  console.log('\nMigration complete.');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
