// ============================================================
// Phase 1 — Backfill compensationType, compensationBasis,
//           and transactionalityClass on existing rows.
//
// Safe: only updates rows where the new fields are NULL.
// Conservative: uses the same deriveCompensationPrecision()
// function that new rows will use going forward.
//
// Run: DATABASE_URL=... npx ts-node --transpile-only scripts/backfill-compensation-precision.ts
// ============================================================

import { PrismaClient } from '@prisma/client';
import { deriveCompensationPrecision } from '../src/lib/compensationPrecision';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_ADMIN
        || process.env.DATABASE_URL
        || 'postgresql://postgres:postgres@localhost:5432/influwatch',
    },
  },
});

async function main() {
  const rows = await prisma.compensationStructure.findMany({
    where: { compensationType: null },
    select: {
      id: true,
      promoterId: true,
      compensationForm: true,
      compensationTrigger: true,
      productType: true,
    },
  });

  console.log(`Found ${rows.length} rows to backfill.\n`);

  for (const row of rows) {
    const precision = deriveCompensationPrecision({
      compensationForm:    row.compensationForm,
      compensationTrigger: row.compensationTrigger,
      productType:         row.productType,
    });

    await prisma.compensationStructure.update({
      where: { id: row.id },
      data: {
        compensationType:      precision.compensationType,
        compensationBasis:     precision.compensationBasis,
        transactionalityClass: precision.transactionalityClass,
      },
    });

    console.log(
      `${row.id.padEnd(18)} | ${row.compensationForm.padEnd(16)} + ${row.compensationTrigger.padEnd(18)} → ` +
      `${precision.compensationType.padEnd(35)} | ${precision.compensationBasis.padEnd(20)} | ${precision.transactionalityClass}`,
    );
  }

  console.log(`\n✅ Backfill complete — ${rows.length} rows updated.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
