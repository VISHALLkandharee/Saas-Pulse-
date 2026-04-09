"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestEvent = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const socket_1 = require("../utils/socket");
const redis_1 = require("../utils/redis");
const redis_2 = __importDefault(require("../utils/redis"));
const ingestEvent = async (req, res) => {
    try {
        // This userId is injected by the verifyApiKey middleware
        const userId = req.integrationUser?.userId;
        const { event, metadata } = req.body;
        if (!event) {
            return res.status(400).json({ success: false, message: "Missing required 'event' field" });
        }
        if (!userId) {
            return res.status(500).json({ success: false, message: "Integration context lost" });
        }
        // Tier Enforcement: Check monthly pulse limits (Plan provided by verifyApiKey middleware)
        const plan = req.integrationUser?.plan || "FREE";
        // Monthly pulse limits
        const limits = { FREE: 1000, PRO: 50000, ENTERPRISE: Infinity };
        const limit = limits[plan];
        if (limit !== Infinity) {
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
            const usageKey = `usage:count:${userId}:${monthKey}`;
            // 1. Get current count from Redis
            let currentUsage = await redis_2.default.get(usageKey);
            if (currentUsage === null) {
                // 2. Cache Miss: Warm up from Database
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const dbCount = await prisma_1.default.activity.count({
                    where: {
                        userId,
                        createdAt: { gte: startOfMonth },
                        NOT: {
                            event: { in: ["USER_SIGNUP", "USER_LOGIN"] }
                        }
                    }
                });
                await redis_2.default.setEx(usageKey, 2592000, String(dbCount)); // 30 days
                currentUsage = String(dbCount);
            }
            // 3. Atomically increment and check
            const newUsage = await redis_2.default.incr(usageKey);
            if (newUsage > limit) {
                return res.status(402).json({
                    success: false,
                    message: `Pulse limit reached for ${plan} plan. Please upgrade to continue ingesting data.`,
                    upgradeUrl: `${process.env.CLIENT_URL}/dashboard/billing`
                });
            }
        }
        // --- STATEFUL GATEKEEPER START ---
        // Prevent duplicate upgrades and manage customer plan lifecycle
        const isUpgrade = String(event).toUpperCase() === "PLAN_UPGRADE";
        const isCancellation = ["SUBSCRIPTION_CANCELLED", "CHURN"].includes(String(event).toUpperCase());
        if (isUpgrade || isCancellation) {
            const meta = metadata || {};
            const custId = meta.customer || meta.customerId || meta.email || meta.userId;
            const targetPlan = isUpgrade ? (meta.plan || meta.name) : "FREE";
            if (custId) {
                const stateKey = `customer:plan:${userId}:${custId}`;
                if (isUpgrade && targetPlan) {
                    const currentPlan = await redis_2.default.get(stateKey);
                    if (currentPlan === String(targetPlan).toLowerCase()) {
                        return res.status(409).json({
                            success: false,
                            message: `Conflict: Customer is already on the '${targetPlan}' plan. Duplicate pulse rejected.`,
                        });
                    }
                    req.pendingPlanUpdate = { key: stateKey, plan: String(targetPlan).toLowerCase() };
                }
                else if (isCancellation) {
                    // Reset state on cancellation so they can upgrade again in the future
                    req.pendingPlanUpdate = { key: stateKey, plan: "free" };
                }
            }
        }
        // --- STATEFUL GATEKEEPER END ---
        // Save the incoming event as an Activity belonging to the founder
        const newActivity = await prisma_1.default.activity.create({
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
                Promise.resolve().then(() => __importStar(require("../services/Email_service"))).then(({ EmailService }) => {
                    if (isHighValue) {
                        EmailService.sendHighValueAlert(newActivity.user.email, mrrValue, metadata?.customer || "a new customer");
                    }
                    else {
                        EmailService.sendActivityAlert(newActivity.user.email, newActivity.event, newActivity.metadata);
                    }
                });
            }
        }
        // Emit real-time event via Socket.io
        try {
            const io = (0, socket_1.getIO)();
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
            await (0, redis_1.invalidateCache)(`user-stats:${userId}`);
            // Only clear Admin Stats for high-level plan changes (Optimization)
            if (["PLAN_UPGRADE", "CHURN", "SUBSCRIPTION_CANCELLED"].includes(newActivity.event)) {
                await (0, redis_1.invalidateCache)(`admin-stats:overall`);
            }
        }
        catch (err) {
            console.error("[SOCKET/CACHE] Failed to emit event or invalidate cache:", err);
        }
        // Bonus feature: If it's a paid event, we could also theoretically update the MRR or Subscription tables here,
        // but for the basic "Pulse", we just ingest it as an activity to display on the dashboard stream.
        // Finalize state update if this was a new plan upgrade
        const pendingUpdate = req.pendingPlanUpdate;
        if (pendingUpdate) {
            await redis_2.default.setEx(pendingUpdate.key, 2592000, pendingUpdate.plan); // 30 days
        }
        res.status(201).json({
            success: true,
            message: "Pulse received",
            activityId: newActivity.id,
        });
    }
    catch (error) {
        console.error("Failed to ingest event:", error);
        res.status(500).json({ success: false, message: "Failed to process pulse" });
    }
};
exports.ingestEvent = ingestEvent;
