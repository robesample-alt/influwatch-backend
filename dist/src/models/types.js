"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Types — shared across service, route, and response layers
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_COMPLIANCE_ACTIONS = exports.DetectionMethod = exports.PromoterRiskTier = exports.InternalActorStatus = exports.InternalActorRole = exports.SourcePlatform = exports.Severity = exports.ContentType = exports.CampaignType = exports.CampaignStatus = exports.AssetType = exports.AmbassadorStatus = exports.ArchiveEventType = exports.ArchiveStatus = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "ArchiveStatus", { enumerable: true, get: function () { return client_1.ArchiveStatus; } });
Object.defineProperty(exports, "ArchiveEventType", { enumerable: true, get: function () { return client_1.ArchiveEventType; } });
Object.defineProperty(exports, "AmbassadorStatus", { enumerable: true, get: function () { return client_1.AmbassadorStatus; } });
Object.defineProperty(exports, "AssetType", { enumerable: true, get: function () { return client_1.AssetType; } });
Object.defineProperty(exports, "CampaignStatus", { enumerable: true, get: function () { return client_1.CampaignStatus; } });
Object.defineProperty(exports, "CampaignType", { enumerable: true, get: function () { return client_1.CampaignType; } });
Object.defineProperty(exports, "ContentType", { enumerable: true, get: function () { return client_1.ContentType; } });
Object.defineProperty(exports, "Severity", { enumerable: true, get: function () { return client_1.Severity; } });
Object.defineProperty(exports, "SourcePlatform", { enumerable: true, get: function () { return client_1.SourcePlatform; } });
Object.defineProperty(exports, "InternalActorRole", { enumerable: true, get: function () { return client_1.InternalActorRole; } });
Object.defineProperty(exports, "InternalActorStatus", { enumerable: true, get: function () { return client_1.InternalActorStatus; } });
Object.defineProperty(exports, "PromoterRiskTier", { enumerable: true, get: function () { return client_1.PromoterRiskTier; } });
Object.defineProperty(exports, "DetectionMethod", { enumerable: true, get: function () { return client_1.DetectionMethod; } });
exports.VALID_COMPLIANCE_ACTIONS = [
    'APPROVE',
    'REQUEST_EDIT',
    'WARN_PROMOTER',
    'SUSPEND_PROMOTER',
    'ESCALATE',
    'CERTIFY',
];
//# sourceMappingURL=types.js.map