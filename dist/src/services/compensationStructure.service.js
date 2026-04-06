"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — CompensationStructure
//
// Manages the economic relationship definition for promoters.
// Classification is always computed — never accepted from callers.
// CompensationEvent is written whenever supervisionPosture changes.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompensationStructure = createCompensationStructure;
exports.getCompensationStructure = getCompensationStructure;
exports.listCompensationStructures = listCompensationStructures;
const tenantContext_1 = require("../utils/tenantContext");
const compensationClassifier_1 = require("../lib/compensationClassifier");
// ─────────────────────────────────────────
// AMBASSADOR SELECT SHAPE
// Reused across all queries that return compensation structures
// ─────────────────────────────────────────
const ambassadorSelect = {
    id: true,
    displayName: true,
    handle: true,
    primaryPlatform: true,
    status: true,
};
// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
async function attachAmbassador(tx, tenantId, struct) {
    const ambassador = await tx.ambassadorProfile.findFirst({
        where: { id: struct.promoterId, tenantId },
        select: ambassadorSelect,
    });
    return { ...struct, ambassador: ambassador ?? null };
}
/**
 * Create a new CompensationStructure for a promoter.
 *
 * Classification fields are always computed from compensationForm,
 * compensationTrigger, and productType — never accepted from the caller.
 *
 * If the computed supervisionPosture differs from the promoter's most
 * recent existing structure, a CompensationEvent is written to the audit log.
 */
async function createCompensationStructure(tenantId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const classification = (0, compensationClassifier_1.classifyCompensation)({
            compensationForm: input.compensationForm,
            compensationTrigger: input.compensationTrigger,
            productType: input.productType,
        });
        // Determine previousPosture for audit event
        const existing = await tx.compensationStructure.findFirst({
            where: { promoterId: input.promoterId, tenantId },
            orderBy: { createdAt: 'desc' },
            select: { supervisionPosture: true },
        });
        const previousPosture = existing?.supervisionPosture ?? 'NONE';
        const newPosture = classification.supervisionPosture;
        const struct = await tx.compensationStructure.create({
            data: {
                tenantId,
                promoterId: input.promoterId,
                campaignId: input.campaignId ?? null,
                compensationForm: input.compensationForm,
                compensationTrigger: input.compensationTrigger,
                productType: input.productType,
                isTransactionBased: classification.isTransactionBased,
                isSecurityLinked: classification.isSecurityLinked,
                isCompensationVariable: classification.isCompensationVariable,
                requiresDisclosure: classification.requiresDisclosure,
                requiresPrincipalReview: classification.requiresPrincipalReview,
                supervisionPosture: newPosture,
                compensationType: classification.compensationType,
                compensationBasis: classification.compensationBasis,
                transactionalityClass: classification.transactionalityClass,
                writtenAgreementRequired: input.writtenAgreementRequired,
                agreementReference: input.agreementReference ?? null,
                notes: input.notes ?? null,
            },
        });
        // Write CompensationEvent whenever posture changes (or on first creation)
        if (previousPosture !== newPosture) {
            await tx.compensationEvent.create({
                data: {
                    tenantId,
                    promoterId: input.promoterId,
                    previousPosture,
                    newPosture,
                    reason: existing
                        ? `Posture changed from ${previousPosture} to ${newPosture} on new structure creation`
                        : `Initial compensation structure established — posture ${newPosture}`,
                },
            });
        }
        return attachAmbassador(tx, tenantId, struct);
    });
}
// ─────────────────────────────────────────
// GET (single promoter — most recent)
// ─────────────────────────────────────────
/**
 * Return the most recent CompensationStructure for a promoter.
 * Returns null if none exists.
 */
async function getCompensationStructure(tenantId, promoterId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const struct = await tx.compensationStructure.findFirst({
            where: { promoterId, tenantId },
            orderBy: { createdAt: 'desc' },
        });
        if (!struct)
            return null;
        return attachAmbassador(tx, tenantId, struct);
    });
}
// ─────────────────────────────────────────
// LIST (all promoters)
// ─────────────────────────────────────────
/**
 * Return all CompensationStructures, newest first.
 * Includes ambassador profile for each record.
 */
async function listCompensationStructures(tenantId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        const structs = await tx.compensationStructure.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
        return Promise.all(structs.map(s => attachAmbassador(tx, tenantId, s)));
    });
}
//# sourceMappingURL=compensationStructure.service.js.map