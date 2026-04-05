import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { invalidateCache } from "../utils/redis";
import { getIO } from "../utils/socket";

export const updateSubscription = async (req: Request, res: Response) => {
  const { userId, plan, status, mrr } = req.body;

  // Validate mrr
  const parsedMrr = parseFloat(mrr);
  if (isNaN(parsedMrr)) {
    return res.status(400).json({ success: false, message: "Invalid MRR value" });
  }

  try {
    const updatedSubscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status,
        mrr: parsedMrr,
      },
      create: {
        userId,
        plan,
        status,
        mrr: parsedMrr,
      },
    });

    // Award "isBeta" status automatically during manual admin upgrades (Founder's Bonus)
    await prisma.user.update({
      where: { id: userId },
      data: { isBeta: true }
    }).catch(err => console.warn("[ADMIN] Beta auto-tag failed (non-critical):", err));

    // Log the event
    await prisma.activity.create({
      data: {
        userId,
        event: "PLAN_UPGRADE",
        metadata: { newPlan: plan, newMrr: parsedMrr, manual: true },
      },
    });

    // 🚀 NEW: Instant Real-time Sync (Matches Stripe Logic)
    try {
      const io = getIO();
      io.emit("subscription-updated", { userId, plan, status });
      
      // Invalidate ALL metrics caches (Stats, Aggregates, and Admin totals)
      console.log(`[ADMIN] Nuking stale metrics caches for user ${userId}...`);
      await invalidateCache(`user-stats:${userId}`);
      await invalidateCache(`user-dashboard-stats:${userId}`); // The hidden "Dashboard" cache
      await invalidateCache(`admin-stats:overall`);
      
      console.log(`[ADMIN] Manual synchronization completed for user ${userId}`);
    } catch (syncErr) {
      console.warn("[ADMIN] Sync broadcast/cache failed:", syncErr);
    }

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully. Sync active.",
      data: updatedSubscription,
    });
  } catch (error: any) {
    console.error("Failed to update subscription", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subscription",
      error: error.message,
    });
  }
};
