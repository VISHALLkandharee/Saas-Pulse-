"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsController = void 0;
const Metrics_service_1 = require("../services/Metrics_service");
const redis_1 = require("../utils/redis");
class MetricsController {
    /**
     * Controller for GET /api/v1/metrics/dashboard
     */
    static async getDashboardMetrics(req, res) {
        try {
            const userId = req.user?.userId;
            const role = req.user?.role;
            const stats = await Metrics_service_1.MetricsService.getDashboardStats(userId, role);
            return res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch dashboard metrics",
                error: error.message,
            });
        }
    }
    /**
     * Controller for GET /api/v1/metrics/activities
     */
    static async getRecentActivities(req, res) {
        try {
            const userId = req.user?.userId;
            const role = req.user?.role;
            const activities = await Metrics_service_1.MetricsService.getRecentActivities(userId, role);
            return res.status(200).json({
                success: true,
                data: activities,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch activity feed",
                error: error.message,
            });
        }
    }
    /**
     * Controller for DELETE /api/v1/metrics/activities/:id
     */
    static async deleteActivity(req, res) {
        try {
            const id = req.params.id;
            const userId = req.user?.userId;
            const role = req.user?.role;
            await Metrics_service_1.MetricsService.deleteActivity(id, userId, role);
            // Invalidate cache since an activity has been removed
            await (0, redis_1.invalidateCache)(`user-stats:${userId}`);
            if (role === "ADMIN") {
                await (0, redis_1.invalidateCache)(`admin-stats:overall`);
            }
            else {
                // Also invalidate admin stats generally if a user modifies metrics
                await (0, redis_1.invalidateCache)(`admin-stats:overall`);
            }
            return res.status(200).json({
                success: true,
                message: "Activity deleted successfully",
            });
        }
        catch (error) {
            const status = error.message === "Unauthorized" ? 403 : 500;
            return res.status(status).json({
                success: false,
                message: error.message || "Failed to delete activity",
            });
        }
    }
}
exports.MetricsController = MetricsController;
