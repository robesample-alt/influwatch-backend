import fs from 'fs';
import path from 'path';
import { buildPromoterEvidencePackage } from '../src/services/evidenceExport.service';
import { generateEvidencePdf } from '../src/lib/pdfGenerator';

(async () => {
  const tenantId     = 'DEFAULT_TENANT';
  const ambassadorId = 'AMB-DEMO-01'; // Marcus Venn
  const dateFrom     = new Date('2026-01-01');
  const dateTo       = new Date('2026-12-31');

  console.log('Building evidence package for', ambassadorId);
  const pkg = await buildPromoterEvidencePackage(tenantId, ambassadorId, dateFrom, dateTo);
  console.log('Records:', pkg.records.length);
  console.log('Attestations:', pkg.attestations.length);

  const outPath = path.join('C:\\Users\\robes\\Downloads', 'InfluWatch_Marcus_Venn_Evidence.pdf');
  const out = fs.createWriteStream(outPath);
  await generateEvidencePdf(pkg, out);
  console.log('PDF written:', outPath);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
