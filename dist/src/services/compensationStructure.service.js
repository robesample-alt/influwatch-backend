"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — CompensationStructure
//
// Manages the economic relationship definition for promoters.
// Classification is always computed — never accepted from callers.
// CompensationEvent is written whenever supervisionPosture changes.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompensationStructure = createCompensationStructure;
exports.getCompensationStructure = getCompensationStructure;
exports.listCompensationStructures = listCompensationStructures;
const prisma_1 = __importDefault(require("../utils/prisma"));
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
async function attachAmbassador(struct) {
    const ambassador = await prisma_1.default.ambassadorProfile.findUnique({
        where: { id: struct.promoterId },
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
async function createCompensationStructure(input) {
    const classification = (0, compensationClassifier_1.classifyCompensation)({
        compensationForm: input.compensationForm,
        compensationTrigger: input.compensationTrigger,
        productType: input.productType,
    });
    // Determine previousPosture for audit event
    const existing = await prisma_1.default.compensationStructure.findFirst({
        where: { promoterId: input.promoterId },
        orderBy: { createdAt: 'desc' },
        select: { supervisionPosture: true },
    });
    const previousPosture = existing?.supervisionPosture ?? 'NONE';
    const newPosture = classification.supervisionPosture;
    const struct = await prisma_1.default.compensationStructure.create({
        data: {
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
            writtenAgreementRequired: input.writtenAgreementRequired,
            agreementReference: input.agreementReference ?? null,
            notes: input.notes ?? null,
        },
    });
    // Write CompensationEvent whenever posture changes (or on first creation)
    if (previousPosture !== newPosture) {
        await prisma_1.default.compensationEvent.create({
            data: {
                promoterId: input.promoterId,
                previousPosture,
                newPosture,
                reason: existing
                    ? `Posture changed from ${previousPosture} to ${newPosture} on new structure creation`
                    : `Initial compensation structure established — posture ${newPosture}`,
            },
        });
    }
    return attachAmbassador(struct);
}
// ─────────────────────────────────────────
// GET (single promoter — most recent)
// ─────────────────────────────────────────
/**
 * Return the most recent CompensationStructure for a promoter.
 * Returns null if none exists.
 */
async function getCompensationStructure(promoterId) {
    const struct = await prisma_1.default.compensationStructure.findFirst({
        where: { promoterId },
        orderBy: { createdAt: 'desc' },
    });
    if (!struct)
        return null;
    return attachAmbassador(struct);
}
// ─────────────────────────────────────────
// LIST (all promoters)
// ─────────────────────────────────────────
/**
 * Return all CompensationStructures, newest first.
 * Includes ambassador profile for each record.
 */
async function listCompensationStructures() {
    const structs = await prisma_1.default.compensationStructure.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return Promise.all(structs.map(s => attachAmbassador(s)));
}
//# sourceMappingURL=compensationStructure.service.js.map