import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getIO } from "../utils/socket";
import { invalidateCache } from "../utils/redis";

export const ingestEvent = async (req: Request, res: Response) => {
  try {
    // This userId is injected by the verifyApiKey middleware
    const userId = (req as any).integrationUser?.userId;
    const { event, metadata } = req.body;

    if (!event) {
      return res.status(400).json({ success: false, message: "Missing required 'event' field" });
    }

    if (!userId) {
      return res.status(500).json({ success: false, message: "Integration context lost" });
    }

    // Tier Enforcement: Check monthly pulse limits
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    const plan = sub?.plan || "FREE";
    
    // Monthly pulse limits
    const limits = { FREE: 1000, PRO: 50000, ENTERPRISE: Infinity };
    const limit = limits[plan as keyof typeof limits];

    if (limit !== Infinity) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const count = await prisma.activity.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
          NOT: {
            event: { in: ["USER_SIGNUP", "USER_LOGIN", "PLAN_UPGRADE"] }
          }
        }
      });

      if (count >= limit) {
        return res.status(402).json({ 
          success: false, 
          message: `Pulse limit reached for ${plan} plan. Please upgrade to continue ingesting data.`,
          upgradeUrl: `${process.env.CLIENT_URL}/dashboard/billing`
        });
      }
    }

    // Save the incoming event as an Activity belonging to the founder
    const newActivity = await prisma.activity.create({
      data: {
        userId,
        event: String(event).toUpperCase(),
        metadata: metadata || {},
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    });

    // Tier Feature: Activity Alerts (PRO/ENTERPRISE)
    if (plan !== "FREE" && newActivity.user?.email) {
      const isCritical = String(event).toUpperCase().includes("CRITICAL") || metadata?.alert === true;
      const mrrValue = metadata?.mrr || metadata?.amount || metadata?.value || 0;
      const isHighValue = typeof mrrValue === 'number' && mrrValue >= 50;

      if (isCritical || isHighValue) {
        // We don't await this to keep ingestion latency low
        import("../services/Email_service").then(({ EmailService }) => {
          if (isHighValue) {
            EmailService.sendHighValueAlert(newActivity.user!.email, mrrValue, metadata?.customer || "a new customer");
          } else {
            EmailService.sendActivityAlert(newActivity.user!.email, newActivity.event, newActivity.metadata);
          }
        });
      }
    }

    // Emit real-time event via Socket.io
    try {
      const io = getIO();
      let displayEmail = newActivity.user?.email || "external@user.com";
      
      // Mask email for the global broadcast (Social Proof)
      if (displayEmail.includes("@")) {
        const [name, domain] = displayEmail.split("@");
        displayEmail = `${name.charAt(0)}****@${domain}`;
      }

      io.emit("new-pulse", {
        id: newActivity.id,
        userId: newActivity.userId,
        event: newActivity.event,
        timestamp: newActivity.createdAt.toISOString(),
        userEmail: displayEmail,
        metadata: newActivity.metadata,
        isOwner: false // Frontend will determine this
      });
      
      // Clear Redis cache to ensure real-time dashboard updates
      await invalidateCache(`user-stats:${userId}`);
      await invalidateCache(`admin-stats:overall`);
      
    } catch (err) {
      console.error("[SOCKET/CACHE] Failed to emit event or invalidate cache:", err);
    }

    // Bonus feature: If it's a paid event, we could also theoretically update the MRR or Subscription tables here,
    // but for the basic "Pulse", we just ingest it as an activity to display on the dashboard stream.

    res.status(201).json({
      success: true,
      message: "Pulse received",
      activityId: newActivity.id,
    });
  } catch (error) {
    console.error("Failed to ingest event:", error);
    res.status(500).json({ success: false, message: "Failed to process pulse" });
  }
};
