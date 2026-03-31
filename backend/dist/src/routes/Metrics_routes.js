"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Metrics_controller_1 = require("../controllers/Metrics_controller");
const Auth_Middleware_1 = require("../middlewares/Auth_Middleware");
const router = (0, express_1.Router)();
// Protect metrics with auth middleware to ensure only logged in users (Founders) can see them
router.get("/dashboard", Auth_Middleware_1.authMiddleware, Metrics_controller_1.MetricsController.getDashboardMetrics);
router.get("/activities", Auth_Middleware_1.authMiddleware, Metrics_controller_1.MetricsController.getRecentActivities);
// Admin or Owner: Delete activity
router.delete("/activities/:id", Auth_Middleware_1.authMiddleware, Metrics_controller_1.MetricsController.deleteActivity);
exports.default = router;
