import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getIO } from "../utils/socket";
import { invalidateCache } from "../utils/redis";
import redisClient from "../utils/redis";

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

    // Tier Enforcement: Check monthly pulse limits (Plan provided by verifyApiKey middleware)
    const plan = (req as any).integrationUser?.plan || "FREE";
    
    // Monthly pulse limits
    const limits = { FREE: 1000, PRO: 50000, ENTERPRISE: Infinity };
    const limit = limits[plan as keyof typeof limits];

    if (limit !== Infinity) {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
      const usageKey = `usage:count:${userId}:${monthKey}`;

      // 1. Get current count from Redis
      let currentUsageStr: string | null = null;
      try {
        if (redisClient.isReady) currentUsageStr = await redisClient.get(usageKey);
      } catch (e) {}

      if (currentUsageStr === null) {
        // 2. Cache Miss: Warm up from Database
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const dbCount = await prisma.activity.count({
          where: {
            userId,
            createdAt: { gte: startOfMonth },
            NOT: {
              event: { in: ["USER_SIGNUP", "USER_LOGIN"] }
            }
          }
        });
        
        try {
          if (redisClient.isReady) await redisClient.setEx(usageKey, 2592000, String(dbCount)); // 30 days
        } catch (e) {}
        currentUsageStr = String(dbCount);
      }

      // 3. Atomically increment and check
      let newUsage = parseInt(currentUsageStr) + 1; // Default memory increment
      try {
        if (redisClient.isReady) newUsage = await redisClient.incr(usageKey);
      } catch (e) {}

      if (newUsage > limit) {
        return res.status(402).json({ 
          success: false, 
          message: `Pulse limit reached for ${plan} plan. Please upgrade to continue ingesting data.`,
          upgradeUrl: `${process.env.CLIENT_URL}/dashboard/billing`
        });
      }
    }

    // --- STATEFUL GATEKEEPER START ---
    const isUpgrade = String(event).toUpperCase() === "PLAN_UPGRADE";
    const isCancellation = ["SUBSCRIPTION_CANCELLED", "CHURN"].includes(String(event).toUpperCase());

    if (isUpgrade || isCancellation) {
      const meta = metadata || {};
      const custId = meta.customer || meta.customerId || meta.email || meta.userId;
      const targetPlan = isUpgrade ? (meta.plan || meta.name) : "FREE";

      if (custId) {
        const stateKey = `customer:plan:${userId}:${custId}`;

        if (isUpgrade && targetPlan) {
          let currentPlan: string | null = null;
          
          // 1. Fast Cache Check (Redis)
          try {
            if (redisClient.isReady) currentPlan = await redisClient.get(stateKey);
          } catch (e) {
             console.log("[GATEKEEPER] Cache unavailable, using Deep SQL fallback.");
          }

          // 2. Iron-Clad DB Check (Only if Redis is missing data or offline)
          if (!currentPlan) {
            const lastLifecyclePulse = await prisma.activity.findFirst({
              where: { 
                userId, 
                event: { in: ["PLAN_UPGRADE", "SUBSCRIPTION_CANCELLED", "CHURN"] },
                OR: [
                  { metadata: { path: ["customer"], equals: custId } },
                  { metadata: { path: ["customerId"], equals: custId } },
                  { metadata: { path: ["email"], equals: custId } },
                  { metadata: { path: ["userId"], equals: custId } }
                ]
              },
              orderBy: { createdAt: 'desc' }
            });
            
            if (lastLifecyclePulse) {
              const meta = lastLifecyclePulse.metadata as any;
              const isCancellation = ["SUBSCRIPTION_CANCELLED", "CHURN"].includes(lastLifecyclePulse.event);
              currentPlan = isCancellation ? "free" : String(meta.plan || meta.name || "").toLowerCase();
              
              // Warm cache if Redis is back up
              try {
                if (redisClient.isReady) await redisClient.setEx(stateKey, 2592000, currentPlan);
              } catch (e) {}
            }
          }

          if (currentPlan === String(targetPlan).toLowerCase()) {
            return res.status(409).json({
              success: false,
              message: `Conflict: Customer is already on the '${targetPlan}' plan. Duplicate pulse rejected.`,
            });
          }
          (req as any).pendingPlanUpdate = { key: stateKey, plan: String(targetPlan).toLowerCase() };
        } else if (isCancellation) {
          // Reset state on cancellation so they can upgrade again in the future
          (req as any).pendingPlanUpdate = { key: stateKey, plan: "free" };
        }
      }
    }
    // --- STATEFUL GATEKEEPER END ---

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

      // 🛡️ 1. Private Pulse: Full data only for the owner
      io.to(userId).emit("new-pulse", {
        id: newActivity.id,
        userId: newActivity.userId,
        event: newActivity.event,
        timestamp: newActivity.createdAt.toISOString(),
        userEmail: displayEmail,
        metadata: newActivity.metadata,
        isOwner: false // Frontend determines this
      });
      
      // 🎉 2. Public Pulse: Anonymized social proof for the whole community
      if (["PLAN_UPGRADE", "USER_SIGNUP"].includes(newActivity.event)) {
        io.emit("community-pulse", {
          event: newActivity.event,
          message: newActivity.event === "USER_SIGNUP" 
            ? "A new founder just joined the pulse! 🚀" 
            : "Someone just upgraded to PRO! 🔥"
        });
      }
      
      // Clear Redis cache for the specific user
      await invalidateCache(`user-stats:${userId}`);
      
      // Only clear Admin Stats for high-level plan changes (Optimization)
      if (["PLAN_UPGRADE", "CHURN", "SUBSCRIPTION_CANCELLED"].includes(newActivity.event)) {
        await invalidateCache(`admin-stats:overall`);
      }
      
    } catch (err) {
      console.error("[SOCKET/CACHE] Failed to emit event or invalidate cache:", err);
    }

    // Bonus feature: If it's a paid event, we could also theoretically update the MRR or Subscription tables here,
    // but for the basic "Pulse", we just ingest it as an activity to display on the dashboard stream.

    // Finalize state update if this was a new plan upgrade
    const pendingUpdate = (req as any).pendingPlanUpdate;
    if (pendingUpdate) {
      try {
        if (redisClient.isReady) {
          await redisClient.setEx(pendingUpdate.key, 2592000, pendingUpdate.plan); // 30 days
        }
      } catch (e) {
        console.warn("[INGEST] Final state update failed, pulse was still successful.");
      }
    }

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
