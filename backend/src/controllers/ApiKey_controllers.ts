import { Request, Response } from "express";
import prisma from "../utils/prisma";
import crypto from "crypto";

export const generateApiKey = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { name } = req.body;

    // 🛡️ PRO Gating: Check API Key limits (Skip for ADMINs)
    if (userRole !== "ADMIN") {
      const [sub, keyCount] = await Promise.all([
        prisma.subscription.findUnique({ where: { userId } }),
        prisma.apiKey.count({ where: { userId } })
      ]);

      const plan = sub?.plan || "FREE";
      const limits: Record<string, number> = { FREE: 1, PRO: 5, ENTERPRISE: 999 };
      const limit = limits[plan];

      if (keyCount >= limit) {
        return res.status(403).json({
          success: false,
          message: `Limit reached for ${plan} plan. ${plan === "FREE" ? "Upgrade to PRO for 5 keys!" : "Contact support for more keys."}`,
          upgradeUrl: "/dashboard/billing"
        });
      }
    }

    // Generate a secure random key with prefix
    const key = `sp_live_${crypto.randomBytes(24).toString("hex")}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        name: name || "Default Key",
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "API Key generated successfully",
      apiKey,
    });
  } catch (error) {
    console.error("Failed to generate API Key:", error);
    res.status(500).json({ success: false, message: "Failed to generate API Key" });
  }
};

export const getApiKeys = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      apiKeys,
    });
  } catch (error) {
    console.error("Failed to fetch API Keys:", error);
    res.status(500).json({ success: false, message: "Failed to fetch API Keys" });
  }
};

export const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    await prisma.apiKey.deleteMany({
      where: { 
        id: id as string,
        userId: userId as string // Security check
      },
    });

    res.status(200).json({
      success: true,
      message: "API Key deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete API Key:", error);
    res.status(500).json({ success: false, message: "Failed to delete API Key" });
  }
};
