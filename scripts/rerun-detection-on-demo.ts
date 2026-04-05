// ============================================================
// Re-run the REAL detection engine against all AMB-DEMO records
// and replace their hand-crafted severity/detections with genuine
// engine output. Enforces the SEVERITY FLOOR RULE: a record's
// severity is never lowered below the max severity of its
// detections.
// ============================================================

import { PrismaClient, Severity } from '@prisma/client';
import { detectRuleHits, computeSeverityFromHits, CompensationContext } from '../src/lib/ruleRegistry';
import { applySeverityFloor } from '../src/lib/severityEngine';

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.contentRecord.findMany({
    where: {
      OR: [
        { ambassadorId: { startsWith: 'AMB-DEMO-' } },
        { id: { startsWith: 'CR-SC1-' } },
        { id: { startsWith: 'CR-DEMO-' } },
      ],
    },
    select: {
      id: true,
      ambassadorId: true,
      bodyText: true,
      transcriptText: true,
      compensationPosture: true,
      hasAffiliateLink: true,
      tenantId: true,
      severity: true,
    },
    orderBy: { id: 'asc' },
  });

  // Cache promoter comp structures for the engine's compensation context
  const compCache: Record<string, CompensationContext> = {};
  for (const r of records) {
    if (compCache[r.ambassadorId]) continue;
    const cs = await prisma.compensationStructure.findFirst({
      where: { promoterId: r.ambassadorId },
      orderBy: { createdAt: 'desc' },
    });
    if (cs) {
      compCache[r.ambassadorId] = {
        isTransactionBased: cs.isTransactionBased,
        isSecurityLinked:   cs.isSecurityLinked,
        supervisionPosture: cs.supervisionPosture,
        compensationForm:   cs.compensationForm,
        hasAffiliateLink:   r.hasAffiliateLink || false,
      };
    }
  }

  const report: Array<{ id: string; oldSev: string; engineSev: Severity; finalSev: Severity; hits: number; rules: string }> = [];

  for (const rec of records) {
    const bodyText = (rec.bodyText || '') + ' ' + (rec.transcriptText || '');
    const ctx = compCache[rec.ambassadorId];
    const hits = detectRuleHits(bodyText, ctx);

    // Engine baseline severity from phrase hits (LOW if no hits)
    const engineSeverity: Severity = hits.length > 0 ? computeSeverityFromHits(hits) : 'LOW';

    // Apply the system-wide severity floor: record severity must be
    // >= max(detection severities, posture floor).
    const detectionSeverities = hits.map(h => h.severity);
    const posture = ctx?.supervisionPosture || rec.compensationPosture;
    const finalSeverity = applySeverityFloor(engineSeverity, detectionSeverities, posture);

    // Delete existing hand-crafted detection records
    await prisma.detectionRecord.deleteMany({ where: { contentRecordId: rec.id } });

    // Insert real detection records
    for (let i = 0; i < hits.length; i++) {
      const h = hits[i];
      await prisma.detectionRecord.create({
        data: {
          id: `DET-${rec.id}-${i}-${h.ruleCode}`,
          tenantId: rec.tenantId,
          contentRecordId: rec.id,
          ruleCode: h.ruleCode,
          ruleName: h.ruleName,
          matchedPhrase: h.matchedPhrase,
          severity: h.severity,
          detectionMethod: h.detectionMethod,
        },
      });
    }

    // Update the record's severity (floor-enforced)
    await prisma.contentRecord.update({
      where: { id: rec.id },
      data: { severity: finalSeverity },
    });

    report.push({
      id: rec.id,
      oldSev: rec.severity ?? '(null)',
      engineSev: engineSeverity,
      finalSev: finalSeverity,
      hits: hits.length,
      rules: hits.map(h => h.ruleCode + '(' + h.severity + ')').join(', ') || '—',
    });
  }

  console.log('\n=== Detection Engine Results (with floor rule) ===');
  console.log('Total records processed:', report.length);
  console.log();
  console.log('ID'.padEnd(22), '| old →  final    | hits | rules');
  console.log('-'.repeat(110));
  for (const r of report) {
    const arrow = r.oldSev !== r.finalSev ? ' ⬆ ' : ' = ';
    console.log(
      r.id.padEnd(22),
      '|', r.oldSev.padEnd(8), arrow, r.finalSev.padEnd(8),
      '|', String(r.hits).padStart(3),
      '|', r.rules,
    );
  }

  const withHits = report.filter(r => r.hits > 0).length;
  const noHits   = report.filter(r => r.hits === 0).length;
  const raised   = report.filter(r => r.oldSev !== r.finalSev).length;
  console.log('\n---');
  console.log('Records with real detections:', withHits);
  console.log('Records with no violations:  ', noHits);
  console.log('Severity changed:            ', raised);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
