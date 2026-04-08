"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Service — Phyllo Integration
//
// API client for Phyllo social content ingestion.
// Handles: user creation, SDK token generation, content fetch,
// and account linkage to AmbassadorProfile.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPhylloUser = createPhylloUser;
exports.createSdkToken = createSdkToken;
exports.linkPhylloAccount = linkPhylloAccount;
exports.fetchPhylloContent = fetchPhylloContent;
exports.findAmbassadorByPhylloAccount = findAmbassadorByPhylloAccount;
const tenantContext_1 = require("../utils/tenantContext");
const logger_1 = __importDefault(require("../utils/logger"));
const PHYLLO_BASE_URL = process.env.INSIGHTIQ_BASE_URL || process.env.PHYLLO_BASE_URL || 'https://api.sandbox.insightiq.ai/v1';
const PHYLLO_CLIENT_ID = process.env.INSIGHTIQ_CLIENT_ID || process.env.PHYLLO_CLIENT_ID || '';
const PHYLLO_CLIENT_SECRET = process.env.INSIGHTIQ_CLIENT_SECRET || process.env.PHYLLO_CLIENT_SECRET || '';
function getAuthHeader() {
    return 'Basic ' + Buffer.from(`${PHYLLO_CLIENT_ID}:${PHYLLO_CLIENT_SECRET}`).toString('base64');
}
async function phylloFetch(path, options = {}) {
    const url = `${PHYLLO_BASE_URL}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    if (!res.ok) {
        const text = await res.text();
        logger_1.default.error({ status: res.status, body: text, path }, 'Phyllo API error');
        throw new Error(`Phyllo API error (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.json();
}
// ─────────────────────────────────────────
// Create a Phyllo user for an ambassador
// ─────────────────────────────────────────
async function createPhylloUser(tenantId, ambassadorId, displayName) {
    const externalId = `${tenantId}-${ambassadorId}`;
    const data = await phylloFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
            name: displayName,
            external_id: externalId,
        }),
    });
    // Store the Phyllo user ID on the ambassador profile
    await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        await tx.ambassadorProfile.update({
            where: { id: ambassadorId },
            data: { phylloUserId: data.id },
        });
    });
    logger_1.default.info({ ambassadorId, phylloUserId: data.id }, 'Phyllo user created');
    return data;
}
// ─────────────────────────────────────────
// Generate an SDK token for the Connect widget
// ─────────────────────────────────────────
async function createSdkToken(tenantId, ambassadorId) {
    // Get the ambassador's Phyllo user ID
    const ambassador = await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.ambassadorProfile.findFirst({
            where: { id: ambassadorId, tenantId },
            select: { phylloUserId: true, displayName: true },
        });
    });
    if (!ambassador) {
        throw new Error('Ambassador not found');
    }
    // Create Phyllo user if not yet linked
    let phylloUserId = ambassador.phylloUserId;
    if (!phylloUserId) {
        const user = await createPhylloUser(tenantId, ambassadorId, ambassador.displayName);
        phylloUserId = user.id;
    }
    const data = await phylloFetch('/sdk-tokens', {
        method: 'POST',
        body: JSON.stringify({
            user_id: phylloUserId,
            products: ['IDENTITY', 'ENGAGEMENT', 'ACTIVITY'],
        }),
    });
    return {
        token: data.sdk_token,
        phylloUserId,
    };
}
// ─────────────────────────────────────────
// Store a connected account ID on the ambassador
// ─────────────────────────────────────────
async function linkPhylloAccount(tenantId, ambassadorId, phylloAccountId) {
    await (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        await tx.ambassadorProfile.update({
            where: { id: ambassadorId },
            data: { phylloAccountId },
        });
    });
    logger_1.default.info({ ambassadorId, phylloAccountId }, 'Phyllo account linked');
}
// ─────────────────────────────────────────
// Fetch content from Phyllo for a connected account
// ─────────────────────────────────────────
async function fetchPhylloContent(phylloAccountId) {
    const data = await phylloFetch(`/social/contents?account_id=${phylloAccountId}&limit=50`);
    return data.data || [];
}
// ─────────────────────────────────────────
// Look up an ambassador by Phyllo account ID
// (used by the webhook handler)
// ─────────────────────────────────────────
async function findAmbassadorByPhylloAccount(phylloAccountId) {
    // This query needs system context since we don't know the tenant yet
    const { withSystemContext } = require('../utils/tenantContext');
    return withSystemContext('Phyllo webhook — resolve ambassador by account ID', async (tx) => {
        return tx.ambassadorProfile.findFirst({
            where: { phylloAccountId },
            select: { id: true, tenantId: true, displayName: true, handle: true },
        });
    });
}
//# sourceMappingURL=phyllo.service.js.map