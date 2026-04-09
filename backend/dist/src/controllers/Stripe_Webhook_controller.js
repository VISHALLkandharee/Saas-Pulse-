"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const stripe_1 = __importDefault(require("stripe"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10",
});
const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error("Webhook Signature Verification Failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);
    // Handle the event
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object;
            console.log(`[STRIPE WEBHOOK] Session Metadata:`, session.metadata);
            const userId = session.metadata?.userId;
            const plan = session.metadata?.plan;
            const customerId = session.customer;
            if (!userId || !plan) {
                console.error(`[STRIPE WEBHOOK] Missing metadata! userId: ${userId}, plan: ${plan}`);
                return res.status(400).json({ message: "Missing metadata in session" });
            }
            console.log(`[STRIPE] Successful checkout for user ${userId}. Upgrading to ${plan}.`);
            try {
                await prisma_1.default.subscription.upsert({
                    where: { userId },
                    update: {
                        plan,
                        status: "ACTIVE",
                        stripeCustomerId: customerId,
                        mrr: plan === "PRO" ? 29.0 : 99.0,
                    },
                    create: {
                        userId,
                        plan,
                        status: "ACTIVE",
                        stripeCustomerId: customerId,
                        mrr: plan === "PRO" ? 29.0 : 99.0,
                    },
                });
                // Log social proof activity
                await prisma_1.default.activity.create({
                    data: {
                        userId,
                        event: "PLAN_UPGRADE",
                        metadata: { plan },
                    },
                });
                // Notify client via sockets
                try {
                    const { getIO } = require("../utils/socket");
                    getIO().emit("subscription-updated", { userId, plan, status: "ACTIVE" });
                }
                catch (ioErr) {
                    console.warn("[STRIPE WEBHOOK] Socket notify failed (ignoring):", ioErr);
                }
                console.log(`[STRIPE] Database updated successfully for user ${userId}`);
                // Final Step: Invalidate cache so dashboard and API limits are fresh
                const { invalidateCache } = require("../utils/redis");
                await invalidateCache(`user-stats:${userId}`);
                await invalidateCache(`user-plan:${userId}`);
                await invalidateCache(`usage:count:${userId}:*`); // 🚀 UNLOCK API LIMITS INSTANTLY
                await invalidateCache("admin-stats:overall");
            }
            catch (dbError) {
                console.error(`[STRIPE] Database update failed for user ${userId}:`, dbError);
                return res.status(500).json({ message: "Internal server error during subscription update" });
            }
            break;
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
            const subscription = event.data.object;
            const stripeCustId = subscription.customer;
            const subStatus = subscription.status === "active" ? "ACTIVE" : "CANCELLED";
            // Map Stripe Price IDs back to Plan Names
            // In a real app, this would be a lookup table or metadata on the price
            const priceId = subscription.items.data[0].price.id;
            let newPlan = "FREE";
            let newMrr = 0;
            if (priceId === process.env.STRIPE_PRICE_PRO) {
                newPlan = "PRO";
                newMrr = 29.0;
            }
            else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
                newPlan = "ENTERPRISE";
                newMrr = 99.0;
            }
            console.log(`[STRIPE] Subscription ${event.type} for customer ${stripeCustId}. New status: ${subStatus}, Plan: ${newPlan}`);
            try {
                const affectedSubscriptions = await prisma_1.default.subscription.findMany({
                    where: { stripeCustomerId: stripeCustId }
                });
                await prisma_1.default.subscription.updateMany({
                    where: { stripeCustomerId: stripeCustId },
                    data: {
                        plan: newPlan,
                        status: subStatus, // ACTIVE, CANCELLED, PAST_DUE
                        mrr: subStatus === "ACTIVE" ? newMrr : 0,
                    },
                });
                // Invalidate cache for all affected users
                const { invalidateCache } = require("../utils/redis");
                for (const sub of affectedSubscriptions) {
                    await invalidateCache(`user-stats:${sub.userId}`);
                    await invalidateCache(`user-plan:${sub.userId}`); // Sync plans
                    await invalidateCache(`usage:count:${sub.userId}:*`); // 🚀 SYNC LIMITS INSTANTLY
                }
                await invalidateCache("admin-stats:overall");
                // Notify affected users via sockets
                try {
                    const { getIO } = require("../utils/socket");
                    affectedSubscriptions.forEach((sub) => {
                        getIO().emit("subscription-updated", { userId: sub.userId, plan: newPlan, status: subStatus });
                    });
                }
                catch (ioErr) {
                    console.warn("[STRIPE WEBHOOK] Socket notify failed:", ioErr);
                }
            }
            catch (dbErr) {
                console.error("[STRIPE WEBHOOK] DB update failed for update/delete:", dbErr);
            }
            break;
        default:
            console.log(`[STRIPE] Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
};
exports.stripeWebhook = stripeWebhook;
