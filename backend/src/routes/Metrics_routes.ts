import { Router } from "express";
import { MetricsController } from "../controllers/Metrics_controller";
import { authMiddleware, authorizeAdmin } from "../middlewares/Auth_Middleware";

const router = Router();

// Protect metrics with auth middleware to ensure only logged in users (Founders) can see them
router.get("/dashboard", authMiddleware, MetricsController.getDashboardMetrics);
router.get("/activities", authMiddleware, MetricsController.getRecentActivities);

// Admin or Owner: Delete activity
router.delete("/activities/:id", authMiddleware, MetricsController.deleteActivity);

export default router;
