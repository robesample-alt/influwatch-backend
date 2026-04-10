"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// PDF Evidence Package Generator
//
// Produces a FINRA-examination-ready PDF bundle for a single
// promoter over a specified date range. Streams output so the
// caller can pipe directly to an HTTP response.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEvidencePdf = generateEvidencePdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const findingCopy_1 = require("../constants/findingCopy");
// ── Brand colours ─────────────────────────────────────────────
const C = {
    bgDark: '#09090f',
    amber: '#f59e0b',
    amberBg: '#3b2a05',
    text: '#e8edf4',
    textMid: '#8896a8',
    textSoft: '#4a5568',
    border: '#1f2937',
    red: '#ef4444',
    orange: '#f97316',
    green: '#4ade80',
};
// ── Helpers ───────────────────────────────────────────────────
function fmtDate(d) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function fmtDateTime(d) {
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
}
function routingLabel(posture, severity) {
    const p = (posture || '').toUpperCase();
    const s = (severity || '').toUpperCase();
    if (p === 'CRITICAL' || s === 'CRITICAL')
        return 'PRINCIPAL ONLY — AUTO-ESCALATED';
    if (p === 'HIGH' || s === 'HIGH')
        return 'PRINCIPAL REVIEW REQUIRED';
    if (p === 'MEDIUM' || s === 'MEDIUM')
        return 'REVIEWER ACTION REQUIRED';
    return 'LOGGED — AUDIT TRAIL';
}
function severityColor(s) {
    const sv = (s || '').toUpperCase();
    if (sv === 'CRITICAL')
        return C.red;
    if (sv === 'HIGH')
        return C.orange;
    if (sv === 'MEDIUM')
        return C.amber;
    return C.green;
}
// ── Page header/footer painter ────────────────────────────────
function drawHeader(doc, pageLabel) {
    const pageWidth = doc.page.width;
    // Dark bar at top
    doc.save();
    doc.rect(0, 0, pageWidth, 32).fill(C.bgDark);
    // Amber accent line
    doc.rect(0, 32, pageWidth, 2).fill(C.amber);
    // Wordmark
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text('INFLU', 40, 10, { continued: true });
    doc.fillColor(C.amber).text('WATCH', { continued: false });
    // Page label right-aligned
    doc.fillColor(C.textMid).font('Helvetica').fontSize(8).text(pageLabel, pageWidth - 240, 12, { width: 200, align: 'right' });
    doc.restore();
}
function drawFooter(doc, pageNum, totalPages) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const y = pageHeight - 32;
    // Critical: temporarily zero the bottom margin so text at the page
    // bottom doesn't trigger pdfkit's auto page-break logic. Without this,
    // each footer draw call adds a new blank page.
    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.save();
    doc.moveTo(40, y).lineTo(pageWidth - 40, y).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.fillColor(C.textSoft).font('Helvetica').fontSize(7)
        .text('InfluWatch · a Fundurex company · Confidential Supervisory Evidence', 40, y + 8, {
        width: pageWidth - 200,
        align: 'left',
        lineBreak: false,
    });
    doc.text('Page ' + pageNum + ' of ' + totalPages, pageWidth - 120, y + 8, {
        width: 80,
        align: 'right',
        lineBreak: false,
    });
    doc.restore();
    doc.page.margins.bottom = originalBottomMargin;
}
// ── Main generator ────────────────────────────────────────────
function generateEvidencePdf(input, output) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({
            size: 'LETTER',
            margins: { top: 60, bottom: 60, left: 50, right: 50 },
            bufferPages: true,
            info: {
                Title: `InfluWatch Evidence Package — ${input.promoter.displayName}`,
                Author: `InfluWatch (${input.tenant.firmName})`,
                Subject: 'Supervisory Evidence for FINRA Examination',
                Creator: 'InfluWatch — a Fundurex company',
                Producer: 'InfluWatch PDF Generator',
            },
        });
        doc.pipe(output);
        output.on('finish', () => resolve());
        output.on('error', (err) => reject(err));
        // ───────────── PAGE 1: COVER ─────────────
        // Full-width dark hero
        doc.rect(0, 0, doc.page.width, 260).fill(C.bgDark);
        doc.rect(0, 258, doc.page.width, 3).fill(C.amber);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(28).text('INFLU', 50, 70, { continued: true });
        doc.fillColor(C.amber).text('WATCH', { continued: false });
        doc.fillColor(C.textMid).font('Helvetica').fontSize(9).text('A FUNDUREX COMPANY', 50, 108, { characterSpacing: 2 });
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('Supervisory Evidence Package', 50, 160, { width: doc.page.width - 100 });
        doc.fillColor(C.textMid).font('Helvetica').fontSize(11).text('Prepared for FINRA Examination', 50, 196);
        // Below hero — details block
        let y = 300;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9).text('FIRM', 50, y, { characterSpacing: 2 });
        y += 14;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(15).text(input.tenant.firmName, 50, y);
        y += 20;
        if (input.tenant.crdNumber) {
            doc.fillColor('#555555').font('Helvetica').fontSize(10).text('CRD Number: ' + input.tenant.crdNumber, 50, y);
            y += 14;
        }
        if (input.tenant.secRegistration) {
            doc.fillColor('#555555').font('Helvetica').fontSize(10).text('SEC Registration: ' + input.tenant.secRegistration, 50, y);
            y += 14;
        }
        y += 20;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9).text('PROMOTER', 50, y, { characterSpacing: 2 });
        y += 14;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(15).text(input.promoter.displayName, 50, y);
        y += 20;
        doc.fillColor('#555555').font('Helvetica').fontSize(10).text(input.promoter.id + '  ·  @' + input.promoter.handle + '  ·  ' + input.promoter.primaryPlatform, 50, y);
        y += 14;
        if (input.promoter.riskTier) {
            doc.text('Risk Tier: ' + input.promoter.riskTier, 50, y);
            y += 14;
        }
        if (input.compensation) {
            y += 20;
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9).text('COMPENSATION STRUCTURE', 50, y, { characterSpacing: 2 });
            y += 14;
            doc.fillColor('#000000').font('Helvetica').fontSize(10)
                .text('Form: ' + input.compensation.compensationForm + '  ·  Trigger: ' + input.compensation.compensationTrigger, 50, y);
            y += 14;
            doc.text('Product Type: ' + input.compensation.productType + '  ·  Posture: ' + input.compensation.supervisionPosture, 50, y);
            y += 14;
        }
        y += 20;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9).text('PERIOD COVERED', 50, y, { characterSpacing: 2 });
        y += 14;
        doc.fillColor('#000000').font('Helvetica').fontSize(11).text(fmtDate(input.dateRange.from) + '  to  ' + fmtDate(input.dateRange.to), 50, y);
        y += 40;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9).text('GENERATED', 50, y, { characterSpacing: 2 });
        y += 14;
        doc.fillColor('#000000').font('Helvetica').fontSize(10).text(fmtDateTime(input.generatedAt), 50, y);
        y += 20;
        // Regulatory context + enforcement precedent
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9).text('REGULATORY BASIS', 50, y, { characterSpacing: 2 });
        y += 14;
        doc.fillColor('#555555').font('Helvetica').fontSize(8)
            .text('This supervision system addresses obligations under FINRA Rules 2210/3110, SEC Marketing Rule 206(4)-1, SEC Regulation Crowdfunding Rules 204 and 402(a), FTC Endorsement Guides §255.5, and applicable securities regulations. Recent enforcement actions against firms with compensated promoter programs include Robinhood ($26M+, 2025), Webull ($1.6M, 2025), Moomoo ($750K, 2024), M1 Finance ($850K, 2024), Public.com ($350K, 2025), Wefunder ($1.4M, August 2025 — improper promotional activities), and Republic ($950K, October 2025 — inadequate supervision of offerings).', 50, y, { width: doc.page.width - 100, lineBreak: true });
        y += 60;
        // Bottom seal bar
        const sealY = doc.page.height - 130;
        doc.rect(50, sealY, doc.page.width - 100, 60).strokeColor(C.amber).lineWidth(1).stroke();
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('CONFIDENTIAL — SUPERVISORY RECORDS', 65, sealY + 14);
        doc.fillColor('#555555').font('Helvetica').fontSize(8).text('This evidence package was generated by InfluWatch — a Fundurex company. All records are cryptographically hashed and append-only. Suitable for FINRA examination submission.', 65, sealY + 30, { width: doc.page.width - 130 });
        // ───────────── PAGE 2: PROMOTER SUMMARY ─────────────
        doc.addPage();
        drawHeader(doc, 'PROMOTER SUMMARY');
        y = 70;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(18).text('Promoter Summary', 50, y);
        y += 30;
        const totalRecords = input.records.length;
        const flaggedRecords = input.records.filter(r => (r.detections || []).length > 0).length;
        const escalated = input.records.filter(r => r.archiveStatus === 'ESCALATED').length;
        const reviewed = input.records.filter(r => r.archiveStatus === 'REVIEWED' || r.archiveStatus === 'CLOSED').length;
        const pending = input.records.filter(r => r.archiveStatus === 'PENDING_REVIEW').length;
        const complianceEvents = input.records.reduce((sum, r) => sum + (r.events || []).filter(e => e.eventType && e.eventType.startsWith('COMPLIANCE_')).length, 0);
        const metric = (label, value, x, yy) => {
            doc.rect(x, yy, 150, 56).strokeColor(C.border).lineWidth(0.5).stroke();
            doc.fillColor('#888888').font('Helvetica').fontSize(7).text(label.toUpperCase(), x + 10, yy + 10, { characterSpacing: 1 });
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(20).text(String(value), x + 10, yy + 22);
        };
        metric('Total Records', totalRecords, 50, y);
        metric('Flagged', flaggedRecords, 210, y);
        metric('Escalated', escalated, 370, y);
        y += 66;
        metric('Reviewed', reviewed, 50, y);
        metric('Pending Review', pending, 210, y);
        metric('Compliance Actions', complianceEvents, 370, y);
        y += 80;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text('Monitored Platform', 50, y);
        y += 16;
        doc.fillColor('#444444').font('Helvetica').fontSize(10).text(input.promoter.primaryPlatform + '  ·  @' + input.promoter.handle, 50, y);
        y += 24;
        if (input.compensation) {
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text('Compensation & Disclosure', 50, y);
            y += 16;
            doc.fillColor('#444444').font('Helvetica').fontSize(10)
                .text('Compensation Form: ' + input.compensation.compensationForm, 50, y);
            y += 12;
            doc.text('Payment Trigger: ' + input.compensation.compensationTrigger, 50, y);
            y += 12;
            doc.text('Product Type: ' + input.compensation.productType, 50, y);
            y += 12;
            doc.text('Supervision Posture: ' + input.compensation.supervisionPosture, 50, y);
            y += 12;
            doc.text('Requires Disclosure: ' + (input.compensation.requiresDisclosure ? 'Yes' : 'No'), 50, y);
            y += 24;
        }
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text('Supervisory Attestations', 50, y);
        y += 16;
        doc.fillColor('#444444').font('Helvetica').fontSize(10)
            .text(input.attestations.length + ' attestation' + (input.attestations.length !== 1 ? 's' : '') + ' on file for this period.', 50, y);
        // ───────────── PAGE 3+: CONTENT RECORDS ─────────────
        for (const rec of input.records) {
            doc.addPage();
            drawHeader(doc, 'CONTENT RECORD · ' + rec.id);
            y = 70;
            // Record ID + severity badge
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(14).text(rec.id, 50, y);
            const sevText = (rec.severity || 'UNCLASSIFIED').toUpperCase();
            const sevC = severityColor(rec.severity);
            doc.rect(doc.page.width - 160, y - 2, 110, 22).fill(sevC);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text(sevText, doc.page.width - 160, y + 4, { width: 110, align: 'center' });
            doc.fillColor('#000000');
            y += 30;
            // Meta grid
            doc.font('Helvetica').fontSize(9).fillColor('#666666');
            doc.text('Platform:', 50, y);
            doc.fillColor('#000000').text(rec.sourcePlatform, 140, y);
            doc.fillColor('#666666').text('Type:', 300, y);
            doc.fillColor('#000000').text(rec.contentType, 360, y);
            y += 14;
            doc.fillColor('#666666').text('Captured:', 50, y);
            doc.fillColor('#000000').text(fmtDateTime(rec.capturedAt), 140, y);
            y += 14;
            if (rec.postedAt) {
                doc.fillColor('#666666').text('Posted:', 50, y);
                doc.fillColor('#000000').text(fmtDateTime(rec.postedAt), 140, y);
                y += 14;
            }
            doc.fillColor('#666666').text('Status:', 50, y);
            doc.fillColor('#000000').text(rec.archiveStatus, 140, y);
            doc.fillColor('#666666').text('Posture:', 300, y);
            const posture = rec.compensationPosture || input.compensation?.supervisionPosture || '—';
            doc.fillColor('#000000').text(posture, 360, y);
            y += 14;
            if (rec.checksum) {
                doc.fillColor('#666666').text('SHA-256:', 50, y);
                doc.fillColor('#000000').font('Courier').fontSize(7).text(rec.checksum, 140, y + 2);
                doc.font('Helvetica').fontSize(9);
                y += 14;
            }
            y += 10;
            // Source URL
            doc.fillColor('#666666').text('Source URL:', 50, y);
            doc.fillColor('#2563eb').fontSize(8).text(rec.sourceUrl, 50, y + 12, { width: doc.page.width - 100, link: rec.sourceUrl, underline: true });
            y += 32;
            // Routing badge
            const routing = routingLabel(rec.compensationPosture || input.compensation?.supervisionPosture, rec.severity);
            doc.rect(50, y, doc.page.width - 100, 24).fill(C.bgDark);
            doc.fillColor(C.amber).font('Helvetica-Bold').fontSize(9).text(routing, 50, y + 8, { width: doc.page.width - 100, align: 'center' });
            y += 36;
            // Content body
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Content Body', 50, y);
            y += 14;
            doc.rect(50, y, doc.page.width - 100, Math.min(120, 20 + Math.ceil(rec.bodyText.length / 90) * 11)).strokeColor(C.border).lineWidth(0.5).stroke();
            doc.fillColor('#222222').font('Helvetica').fontSize(9).text(rec.bodyText, 58, y + 8, { width: doc.page.width - 116, height: 110 });
            y += Math.min(130, 30 + Math.ceil(rec.bodyText.length / 90) * 11);
            if (rec.transcriptText) {
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Transcript Excerpt', 50, y);
                y += 14;
                const tx = rec.transcriptText.slice(0, 400) + (rec.transcriptText.length > 400 ? '…' : '');
                doc.fillColor('#222222').font('Helvetica-Oblique').fontSize(9).text(tx, 50, y, { width: doc.page.width - 100 });
                y += Math.ceil(tx.length / 90) * 11 + 14;
            }
            // Compliance findings — grouped by public category so the
            // regulator-facing PDF never leaks internal rule codes or
            // detection method names. One card per category; findings
            // with the same category from multiple rules collapse.
            const grouped = (0, findingCopy_1.groupDetections)(rec.detections || []);
            if (grouped.length > 0) {
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Compliance Findings', 50, y);
                y += 14;
                for (const g of grouped) {
                    if (y > doc.page.height - 140) {
                        doc.addPage();
                        drawHeader(doc, 'CONTENT RECORD · ' + rec.id + ' (cont.)');
                        y = 70;
                    }
                    const sc = severityColor(g.severity);
                    // Title row: coloured left bar + public title + severity chip
                    doc.rect(50, y, 4, 16).fill(sc);
                    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(g.title, 60, y + 2, { width: doc.page.width - 180 });
                    doc.fillColor(sc).font('Helvetica-Bold').fontSize(8).text(g.severity, doc.page.width - 110, y + 4, { width: 60, align: 'right' });
                    y += 16;
                    // Description
                    doc.fillColor('#444444').font('Helvetica').fontSize(9).text(g.description, 65, y, { width: doc.page.width - 130 });
                    const descLines = Math.max(1, Math.ceil(g.description.length / 90));
                    y += descLines * 11 + 2;
                    // Flagged language — one line per unique phrase
                    if (g.flaggedLanguage.length > 0) {
                        doc.fillColor('#666666').font('Helvetica-Oblique').fontSize(8).text('Flagged language:', 65, y);
                        y += 10;
                        for (const phrase of g.flaggedLanguage) {
                            if (y > doc.page.height - 100) {
                                doc.addPage();
                                drawHeader(doc, 'CONTENT RECORD · ' + rec.id + ' (cont.)');
                                y = 70;
                            }
                            const clipped = phrase.length > 180 ? phrase.slice(0, 177) + '…' : phrase;
                            doc.fillColor('#666666').font('Helvetica-Oblique').fontSize(8).text('· "' + clipped + '"', 75, y, { width: doc.page.width - 140 });
                            y += Math.max(10, Math.ceil(clipped.length / 100) * 10);
                        }
                    }
                    y += 8;
                }
                y += 4;
            }
            // Supervisory decision from events
            const complianceEvt = (rec.events || []).find(e => e.eventType && e.eventType.startsWith('COMPLIANCE_'));
            if (complianceEvt) {
                if (y > doc.page.height - 120) {
                    doc.addPage();
                    drawHeader(doc, 'CONTENT RECORD · ' + rec.id + ' (cont.)');
                    y = 70;
                }
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Supervisory Decision', 50, y);
                y += 14;
                doc.fillColor('#444444').font('Helvetica').fontSize(9)
                    .text('Action: ' + complianceEvt.eventType.replace('COMPLIANCE_', ''), 50, y);
                y += 12;
                doc.text('Actor: ' + (complianceEvt.actorId || 'SYSTEM'), 50, y);
                y += 12;
                doc.text('Timestamp: ' + fmtDateTime(complianceEvt.createdAt), 50, y);
                y += 12;
                if (complianceEvt.eventNote) {
                    doc.fillColor('#222222').font('Helvetica-Oblique').fontSize(9).text('"' + complianceEvt.eventNote + '"', 50, y, { width: doc.page.width - 100 });
                }
            }
        }
        // ───────────── FINAL PAGE: ATTESTATIONS ─────────────
        doc.addPage();
        drawHeader(doc, 'ATTESTATIONS & CERTIFICATION');
        y = 70;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(18).text('Supervisory Attestations', 50, y);
        y += 30;
        if (input.attestations.length === 0) {
            doc.fillColor('#666666').font('Helvetica').fontSize(10).text('No supervisory attestations were recorded for this period.', 50, y);
            y += 24;
        }
        else {
            for (const a of input.attestations) {
                if (y > doc.page.height - 140) {
                    doc.addPage();
                    drawHeader(doc, 'ATTESTATIONS (cont.)');
                    y = 70;
                }
                doc.rect(50, y, doc.page.width - 100, 80).strokeColor(C.border).lineWidth(0.5).stroke();
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text(a.principalName, 60, y + 10);
                doc.fillColor('#666666').font('Helvetica').fontSize(9).text(a.principalRole + ' · ' + a.periodLabel, 60, y + 26);
                doc.fillColor('#888888').fontSize(8).text('Certified: ' + fmtDateTime(a.certifiedAt), 60, y + 40);
                if (a.supervisoryNote) {
                    doc.fillColor('#333333').font('Helvetica-Oblique').fontSize(8).text('"' + a.supervisoryNote + '"', 60, y + 54, { width: doc.page.width - 120 });
                }
                y += 94;
            }
        }
        // Certification statement
        y = Math.max(y, doc.page.height - 200);
        doc.rect(50, y, doc.page.width - 100, 120).fill(C.bgDark);
        doc.rect(50, y, doc.page.width - 100, 3).fill(C.amber);
        doc.fillColor(C.amber).font('Helvetica-Bold').fontSize(10).text('CERTIFICATION', 65, y + 18, { characterSpacing: 2 });
        doc.fillColor('#ffffff').font('Helvetica').fontSize(9)
            .text('This evidence package was generated by InfluWatch — a Fundurex company. All records contained herein are cryptographically hashed and append-only. Every supervisory decision is timestamped, attributed, and stored in an immutable audit log. This package is suitable for submission to FINRA under Rule 3110 / 3130 examination requirements.', 65, y + 40, { width: doc.page.width - 130, lineGap: 3 });
        // ───────────── Page numbers on every page ─────────────
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(range.start + i);
            drawFooter(doc, i + 1, range.count);
        }
        doc.end();
    });
}
//# sourceMappingURL=pdfGenerator.js.map