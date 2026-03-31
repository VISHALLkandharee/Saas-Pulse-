import { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../utils/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
});

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook Signature Verification Failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[STRIPE WEBHOOK] Session Metadata:`, session.metadata);
      
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as "PRO" | "ENTERPRISE";
      const customerId = session.customer as string;

      if (!userId || !plan) {
        console.error(`[STRIPE WEBHOOK] Missing metadata! userId: ${userId}, plan: ${plan}`);
        return res.status(400).json({ message: "Missing metadata in session" });
      }

      console.log(`[STRIPE] Successful checkout for user ${userId}. Upgrading to ${plan}.`);
      
      try {
        await prisma.subscription.upsert({
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
        await prisma.activity.create({
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
        } catch (ioErr) {
          console.warn("[STRIPE WEBHOOK] Socket notify failed (ignoring):", ioErr);
        }

        console.log(`[STRIPE] Database updated successfully for user ${userId}`);
      } catch (dbError) {
        console.error(`[STRIPE] Database update failed for user ${userId}:`, dbError);
        return res.status(500).json({ message: "Internal server error during subscription update" });
      }
      break;

    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustId = subscription.customer as string;
      const subStatus = subscription.status === "active" ? "ACTIVE" : "CANCELLED";
      
      // Map Stripe Price IDs back to Plan Names
      // In a real app, this would be a lookup table or metadata on the price
      const priceId = subscription.items.data[0].price.id;
      let newPlan = "FREE";
      let newMrr = 0;

      if (priceId === process.env.STRIPE_PRICE_PRO) {
        newPlan = "PRO";
        newMrr = 29.0;
      } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
        newPlan = "ENTERPRISE";
        newMrr = 99.0;
      }

      console.log(`[STRIPE] Subscription ${event.type} for customer ${stripeCustId}. New status: ${subStatus}, Plan: ${newPlan}`);
      
      try {
        const affectedSubscriptions = await prisma.subscription.findMany({
          where: { stripeCustomerId: stripeCustId }
        });

        await prisma.subscription.updateMany({
          where: { stripeCustomerId: stripeCustId },
          data: {
            plan: newPlan as any,
            status: subStatus as any, // ACTIVE, CANCELLED, PAST_DUE
            mrr: subStatus === "ACTIVE" ? newMrr : 0,
          },
        });

        // Notify affected users via sockets
        try {
          const { getIO } = require("../utils/socket");
          affectedSubscriptions.forEach(sub => {
            getIO().emit("subscription-updated", { userId: sub.userId, plan: newPlan, status: subStatus });
          });
        } catch (ioErr) {
          console.warn("[STRIPE WEBHOOK] Socket notify failed:", ioErr);
        }
      } catch (dbErr) {
        console.error("[STRIPE WEBHOOK] DB update failed for update/delete:", dbErr);
      }
      break;

    default:
      console.log(`[STRIPE] Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
