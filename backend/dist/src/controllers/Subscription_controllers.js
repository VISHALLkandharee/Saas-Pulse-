"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubscription = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
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
        // Log the event
        await prisma_1.default.activity.create({
            data: {
                userId,
                event: "PLAN_UPGRADE",
                metadata: { newPlan: plan, newMrr: parsedMrr },
            },
        });
        res.status(200).json({
            success: true,
            message: "Subscription updated successfully",
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
