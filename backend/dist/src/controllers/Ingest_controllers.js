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
        // Tier Enforcement: Check monthly pulse limits
        const sub = await prisma_1.default.subscription.findUnique({ where: { userId } });
        const plan = sub?.plan || "FREE";
        // Monthly pulse limits
        const limits = { FREE: 1000, PRO: 50000, ENTERPRISE: Infinity };
        const limit = limits[plan];
        if (limit !== Infinity) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const count = await prisma_1.default.activity.count({
                where: {
                    userId,
                    createdAt: { gte: startOfMonth }
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
            if (isCritical) {
                // We don't await this to keep ingestion latency low
                Promise.resolve().then(() => __importStar(require("../services/Email_service"))).then(({ EmailService }) => {
                    EmailService.sendActivityAlert(newActivity.user.email, newActivity.event, newActivity.metadata);
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
            io.emit("new-pulse", {
                id: newActivity.id,
                userId: newActivity.userId,
                event: newActivity.event,
                timestamp: newActivity.createdAt.toISOString(),
                userEmail: displayEmail,
                metadata: newActivity.metadata,
                isOwner: false // Frontend will determine this
            });
        }
        catch (err) {
            console.error("[SOCKET] Failed to emit event:", err);
        }
        // Bonus feature: If it's a paid event, we could also theoretically update the MRR or Subscription tables here,
        // but for the basic "Pulse", we just ingest it as an activity to display on the dashboard stream.
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
