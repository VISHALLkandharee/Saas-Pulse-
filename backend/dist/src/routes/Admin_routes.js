"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Admin_controllers_1 = require("../controllers/Admin_controllers");
const Auth_Middleware_1 = require("../middlewares/Auth_Middleware");
const router = (0, express_1.Router)();
// Secure all admin routes with auth and role check
router.use(Auth_Middleware_1.authMiddleware);
router.use(Auth_Middleware_1.authorizeAdmin);
router.get("/export", Admin_controllers_1.exportSystemData);
exports.default = router;
