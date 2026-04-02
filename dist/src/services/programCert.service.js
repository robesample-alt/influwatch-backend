"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — ProgramCertification
//
// listProgramCerts()     — list all, newest first, with principal
// createProgramCert(input) — create new certification
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProgramCerts = listProgramCerts;
exports.createProgramCert = createProgramCert;
const prisma_1 = __importDefault(require("../utils/prisma"));
const principalSelect = {
    id: true,
    displayName: true,
    email: true,
    role: true,
    seriesLicense: true,
};
// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────
/**
 * List all annual program certifications, newest first.
 * Includes signing principal details.
 */
async function listProgramCerts() {
    return prisma_1.default.programCertification.findMany({
        include: { principal: { select: principalSelect } },
        orderBy: { certifiedAt: 'desc' },
    });
}
/**
 * Create a new annual supervisory program certification.
 * Returns the created record with principal details.
 */
async function createProgramCert(input) {
    return prisma_1.default.programCertification.create({
        data: {
            principalId: input.principalId,
            certificationYear: input.certificationYear,
            rulesCertified: input.rulesCertified,
            supervisorySystemAdequate: input.supervisorySystemAdequate,
            findings: input.findings ?? null,
            certificationNote: input.certificationNote ?? null,
        },
        include: { principal: { select: principalSelect } },
    });
}
//# sourceMappingURL=programCert.service.js.map