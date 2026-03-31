"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10",
});
class StripeService {
    /**
     * Create a Stripe Checkout Session for a plan upgrade
     */
    static async createCheckoutSession(userId, plan) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { subscription: true },
        });
        if (!user)
            throw new Error("User not found");
        // Map plans to your Stripe Price IDs (In a real app, these come from ENV)
        const priceMap = {
            PRO: process.env.STRIPE_PRICE_PRO,
            ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
        };
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            customer_email: user.email,
            line_items: [
                {
                    price: priceMap[plan],
                    quantity: 1,
                },
            ],
            success_url: `${process.env.CLIENT_URL}/dashboard/billing?success=true`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard/billing?canceled=true`,
            metadata: {
                userId: user.id,
                plan: plan,
            },
        });
        return session;
    }
    /**
     * Create a Customer Portal session for managing subscriptions
     */
    static async createPortalSession(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { subscription: true },
        });
        if (!user)
            throw new Error("User not found");
        let customerId = user.subscription?.stripeCustomerId;
        // Fallback: If no customer ID exists (common for Admins/Manual users), create one now
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user.id }
            });
            customerId = customer.id;
            // Update DB with the new customer ID
            await prisma_1.default.subscription.upsert({
                where: { userId },
                update: { stripeCustomerId: customerId },
                create: { userId, stripeCustomerId: customerId, plan: 'FREE', status: 'ACTIVE', mrr: 0 }
            });
        }
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.CLIENT_URL}/dashboard/billing`,
        });
        return session;
    }
}
exports.StripeService = StripeService;
