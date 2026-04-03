"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = require("./auth.routes");
const router = (0, express_1.Router)();
router.post('/login', auth_routes_1.login);
exports.default = router;
//# sourceMappingURL=auth.router.js.map