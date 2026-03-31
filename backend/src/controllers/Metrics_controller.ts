import { Request, Response } from "express";
import { MetricsService } from "../services/Metrics_service";
import { invalidateCache } from "../utils/redis";

export class MetricsController {
  /**
   * Controller for GET /api/v1/metrics/dashboard
   */
  static async getDashboardMetrics(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const role = (req as any).user?.role;
      const stats = await MetricsService.getDashboardStats(userId, role);
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
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
  static async getRecentActivities(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const role = (req as any).user?.role;
      const activities = await MetricsService.getRecentActivities(userId, role);
      return res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error: any) {
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
  static async deleteActivity(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.userId;
      const role = (req as any).user?.role;
      
      await MetricsService.deleteActivity(id, userId, role);
      
      // Invalidate cache since an activity has been removed
      await invalidateCache(`user-stats:${userId}`);
      if (role === "ADMIN") {
         await invalidateCache(`admin-stats:overall`);
      } else {
         // Also invalidate admin stats generally if a user modifies metrics
         await invalidateCache(`admin-stats:overall`);
      }
      
      return res.status(200).json({
        success: true,
        message: "Activity deleted successfully",
      });
    } catch (error: any) {
      const status = error.message === "Unauthorized" ? 403 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Failed to delete activity",
      });
    }
  }
}
