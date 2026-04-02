"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — Ambassador + Campaign
//
// Lightweight lookup services.
// Full ambassador and campaign management belongs
// to their respective modules in later phases.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmbassadorById = getAmbassadorById;
exports.listAmbassadors = listAmbassadors;
exports.getAmbassadorDetail = getAmbassadorDetail;
exports.createAmbassador = createAmbassador;
exports.assignSupervisor = assignSupervisor;
exports.getCampaignById = getCampaignById;
exports.listCampaigns = listCampaigns;
exports.getMonitorSummary = getMonitorSummary;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const validation_1 = require("../utils/validation");
const SUPERVISOR_INCLUDE = {
    select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        seriesLicense: true,
    },
};
// ─────────────────────────────────────────
// AMBASSADOR
// ─────────────────────────────────────────
async function getAmbassadorById(id) {
    return prisma_1.default.ambassadorProfile.findUnique({
        where: { id },
        include: { assignedSupervisor: SUPERVISOR_INCLUDE },
    });
}
async function listAmbassadors(status) {
    return prisma_1.default.ambassadorProfile.findMany({
        where: status ? { status } : {},
        include: { assignedSupervisor: SUPERVISOR_INCLUDE },
        orderBy: { displayName: 'asc' },
    });
}
/**
 * Full ambassador detail view — profile + all content records + derived counts.
 * Used by the Promoter Detail screen (Phase 1).
 */
async function getAmbassadorDetail(id) {
    const [ambassador, records] = await Promise.all([
        prisma_1.default.ambassadorProfile.findUnique({
            where: { id },
            include: { assignedSupervisor: SUPERVISOR_INCLUDE },
        }),
        prisma_1.default.contentRecord.findMany({
            where: { ambassadorId: id },
            orderBy: { capturedAt: 'desc' },
            select: {
                id: true,
                archiveStatus: true,
                severity: true,
                sourcePlatform: true,
                capturedAt: true,
                checksum: true,
                sourceUrl: true,
            },
        }),
    ]);
    if (!ambassador)
        return null;
    const statusCounts = { total: 0, captured: 0, pending: 0, reviewed: 0, escalated: 0, closed: 0 };
    for (const r of records) {
        statusCounts.total++;
        if (r.archiveStatus === 'CAPTURED')
            statusCounts.captured++;
        else if (r.archiveStatus === 'PENDING_REVIEW')
            statusCounts.pending++;
        else if (r.archiveStatus === 'REVIEWED')
            statusCounts.reviewed++;
        else if (r.archiveStatus === 'ESCALATED')
            statusCounts.escalated++;
        else if (r.archiveStatus === 'CLOSED')
            statusCounts.closed++;
    }
    const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const activeSevs = records
        .filter(r => r.archiveStatus !== 'CLOSED')
        .map(r => r.severity)
        .filter(Boolean);
    const highestSeverity = SEVERITY_ORDER.find(s => activeSevs.includes(s)) ?? null;
    const openCount = statusCounts.pending + statusCounts.reviewed + statusCounts.escalated;
    return { ambassador, records, statusCounts, highestSeverity, openCount };
}
async function createAmbassador(input) {
    const { valid, errors } = (0, validation_1.validateCreateAmbassador)(input);
    if (!valid) {
        const err = new Error(`Validation failed: ${errors.join('; ')}`);
        err.validationErrors = errors;
        throw err;
    }
    return prisma_1.default.ambassadorProfile.create({
        data: {
            displayName: input.displayName,
            handle: input.handle,
            primaryPlatform: input.primaryPlatform,
            riskTier: input.riskTier ?? null,
            status: client_1.AmbassadorStatus.ACTIVE,
            assignedSupervisorId: input.assignedSupervisorId ?? null,
        },
        include: { assignedSupervisor: SUPERVISOR_INCLUDE },
    });
}
async function assignSupervisor(id, supervisorId) {
    return prisma_1.default.ambassadorProfile.update({
        where: { id },
        data: { assignedSupervisorId: supervisorId },
        include: { assignedSupervisor: SUPERVISOR_INCLUDE },
    });
}
// ─────────────────────────────────────────
// CAMPAIGN
// ─────────────────────────────────────────
async function getCampaignById(id) {
    return prisma_1.default.campaign.findUnique({ where: { id } });
}
async function listCampaigns() {
    return prisma_1.default.campaign.findMany({ orderBy: { createdAt: 'desc' } });
}
// ─────────────────────────────────────────
// ACCOUNT MONITOR SUMMARY — Phase 1
// ─────────────────────────────────────────
/**
 * Return all ambassador profiles with aggregated capture statistics.
 * Powers the Account Monitor screen.
 *
 * Per-promoter data:
 *   totalCaptures  — all content records ever captured
 *   flagCount      — records currently in PENDING_REVIEW or ESCALATED
 *   lastCaptureAt  — most recent capturedAt timestamp, or null if none
 *   captures24h    — records captured in the last 24 hours
 *
 * Summary totals included at the root level for the summary bar.
 */
async function getMonitorSummary() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ambassadors = await prisma_1.default.ambassadorProfile.findMany({
        orderBy: { displayName: 'asc' },
        include: {
            assignedSupervisor: SUPERVISOR_INCLUDE,
            contentRecords: {
                select: {
                    capturedAt: true,
                    archiveStatus: true,
                },
            },
        },
    });
    const promoters = ambassadors.map(a => {
        const recs = a.contentRecords;
        const totalCaptures = recs.length;
        const pendingCount = recs.filter(r => r.archiveStatus === 'PENDING_REVIEW').length;
        const escalatedCount = recs.filter(r => r.archiveStatus === 'ESCALATED').length;
        const flagCount = pendingCount + escalatedCount;
        const lastCaptureAt = recs.length > 0
            ? recs.reduce((max, r) => r.capturedAt > max ? r.capturedAt : max, recs[0].capturedAt)
            : null;
        const captures24h = recs.filter(r => r.capturedAt >= since24h).length;
        return {
            id: a.id,
            displayName: a.displayName,
            handle: a.handle,
            primaryPlatform: a.primaryPlatform,
            status: a.status,
            riskTier: a.riskTier,
            assignedSupervisor: a.assignedSupervisor,
            totalCaptures,
            pendingCount,
            escalatedCount,
            flagCount,
            lastCaptureAt,
            captures24h,
        };
    });
    const summary = {
        total: promoters.length,
        active: promoters.filter(p => p.status === 'ACTIVE').length,
        paused: promoters.filter(p => p.status === 'SUSPENDED' || p.status === 'INACTIVE').length,
        totalCaptures: promoters.reduce((sum, p) => sum + p.totalCaptures, 0),
        captures24h: promoters.reduce((sum, p) => sum + p.captures24h, 0),
    };
    return { summary, promoters };
}
//# sourceMappingURL=ambassador.service.js.map