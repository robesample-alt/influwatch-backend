"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Severity Engine
//
// Thin wrapper around ruleRegistry — delegates all phrase
// detection to the canonical rule map.
// External API (computeSeverity) is unchanged.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSeverity = computeSeverity;
const ruleRegistry_1 = require("./ruleRegistry");
/**
 * Scan bodyText for risky promotional phrases.
 * Returns the highest severity level matched, or LOW if nothing matches.
 */
function computeSeverity(bodyText) {
    return (0, ruleRegistry_1.computeSeverityFromHits)((0, ruleRegistry_1.detectRuleHits)(bodyText));
}
//# sourceMappingURL=severityEngine.js.map