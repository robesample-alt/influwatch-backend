"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — ProgramCertification
//
// listProgramCerts(tenantId)       — list all, newest first, with principal
// createProgramCert(tenantId, input) — create new certification
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProgramCerts = listProgramCerts;
exports.createProgramCert = createProgramCert;
const tenantContext_1 = require("../utils/tenantContext");
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
async function listProgramCerts(tenantId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.programCertification.findMany({
            where: { tenantId },
            include: { principal: { select: principalSelect } },
            orderBy: { certifiedAt: 'desc' },
        });
    });
}
/**
 * Create a new annual supervisory program certification.
 * Returns the created record with principal details.
 */
async function createProgramCert(tenantId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.programCertification.create({
            data: {
                tenantId,
                principalId: input.principalId,
                certificationYear: input.certificationYear,
                rulesCertified: input.rulesCertified,
                supervisorySystemAdequate: input.supervisorySystemAdequate,
                findings: input.findings ?? null,
                certificationNote: input.certificationNote ?? null,
            },
            include: { principal: { select: principalSelect } },
        });
    });
}
//# sourceMappingURL=programCert.service.js.map