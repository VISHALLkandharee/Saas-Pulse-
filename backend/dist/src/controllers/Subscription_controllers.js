"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubscription = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const redis_1 = require("../utils/redis");
const socket_1 = require("../utils/socket");
const updateSubscription = async (req, res) => {
    const { userId, plan, status, mrr } = req.body;
    // Validate mrr
    const parsedMrr = parseFloat(mrr);
    if (isNaN(parsedMrr)) {
        return res.status(400).json({ success: false, message: "Invalid MRR value" });
    }
    try {
        const updatedSubscription = await prisma_1.default.subscription.upsert({
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
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { isBeta: true }
        }).catch(err => console.warn("[ADMIN] Beta auto-tag failed (non-critical):", err));
        // Log the event
        await prisma_1.default.activity.create({
            data: {
                userId,
                event: "PLAN_UPGRADE",
                metadata: { newPlan: plan, newMrr: parsedMrr, manual: true },
            },
        });
        // 🚀 NEW: Instant Real-time Sync (Matches Stripe Logic)
        try {
            const io = (0, socket_1.getIO)();
            io.emit("subscription-updated", { userId, plan, status });
            // Invalidate ALL metrics caches (Stats, Aggregates, and Admin totals)
            console.log(`[ADMIN] Nuking stale metrics caches for user ${userId}...`);
            await (0, redis_1.invalidateCache)(`user-stats:${userId}`);
            await (0, redis_1.invalidateCache)(`user-dashboard-stats:${userId}`);
            await (0, redis_1.invalidateCache)(`user-plan:${userId}`); // 🏁 NEW: Unlock the ingestion engine instantly
            await (0, redis_1.invalidateCache)(`admin-stats:overall`);
            console.log(`[ADMIN] Manual synchronization completed for user ${userId}`);
        }
        catch (syncErr) {
            console.warn("[ADMIN] Sync broadcast/cache failed:", syncErr);
        }
        res.status(200).json({
            success: true,
            message: "Subscription updated successfully. Sync active.",
            data: updatedSubscription,
        });
    }
    catch (error) {
        console.error("Failed to update subscription", error);
        res.status(500).json({
            success: false,
            message: "Failed to update subscription",
            error: error.message,
        });
    }
};
exports.updateSubscription = updateSubscription;
