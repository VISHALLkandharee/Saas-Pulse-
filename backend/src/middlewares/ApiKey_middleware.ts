import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyHeader = req.headers["x-api-key"] as string;

    if (!apiKeyHeader) {
      return res.status(401).json({ success: false, message: "Missing API Key" });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: apiKeyHeader },
    });

    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid API Key" });
    }

    // Update last used timestamp (optional precision feature)
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    });

    // Attach the owner's userId and plan to the request so downstream middlewares 
    // (like the rate limiter or pulse controller) know the context.
    const sub = await prisma.subscription.findUnique({
      where: { userId: apiKey.userId },
      select: { plan: true }
    });

    (req as any).integrationUser = { 
      userId: apiKey.userId,
      plan: sub?.plan || "FREE"
    };
    next();
  } catch (error) {
    console.error("API Key Verification Failed:", error);
    res.status(500).json({ success: false, message: "Internal server error connecting to pulse" });
  }
};
