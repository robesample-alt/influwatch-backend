"use strict";
// @robesample-alt/influwatch-core
// Public API — exports all detection and escalation primitives
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeEscalation = exports.computeSeverityFromHits = exports.detectRuleHits = exports.Severity = void 0;
var ruleRegistry_1 = require("./ruleRegistry");
Object.defineProperty(exports, "Severity", { enumerable: true, get: function () { return ruleRegistry_1.Severity; } });
var ruleRegistry_2 = require("./ruleRegistry");
Object.defineProperty(exports, "detectRuleHits", { enumerable: true, get: function () { return ruleRegistry_2.detectRuleHits; } });
Object.defineProperty(exports, "computeSeverityFromHits", { enumerable: true, get: function () { return ruleRegistry_2.computeSeverityFromHits; } });
var escalation_1 = require("./escalation");
Object.defineProperty(exports, "computeEscalation", { enumerable: true, get: function () { return escalation_1.computeEscalation; } });
//# sourceMappingURL=index.js.map