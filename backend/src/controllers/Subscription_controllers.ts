import { Request, Response } from "express";
import prisma from "../utils/prisma";

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

    // Log the event
    await prisma.activity.create({
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
  } catch (error: any) {
    console.error("Failed to update subscription", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subscription",
      error: error.message,
    });
  }
};
