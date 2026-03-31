import { Request, Response } from "express";
import { StripeService } from "../services/Stripe_service";

export const createCheckout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { plan } = req.body;

    if (!["PRO", "ENTERPRISE"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan selected" });
    }

    const session = await StripeService.createCheckoutSession(userId, plan);

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPortal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const session = await StripeService.createPortalSession(userId);

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
