import { Router } from "express";
import { createCheckout, createPortal } from "../controllers/Stripe_controllers";
import { updateSubscription } from "../controllers/Subscription_controllers";
import { authMiddleware, authorizeAdmin } from "../middlewares/Auth_Middleware";
import prisma from "../utils/prisma";

const router = Router();

// Founder routes (Managing their own plan)
router.post("/checkout", authMiddleware, createCheckout);
router.post("/portal", authMiddleware, createPortal);

// Admin routes (Managing other people's subscriptions)
router.patch("/update", authMiddleware, authorizeAdmin, updateSubscription);

export default router;
