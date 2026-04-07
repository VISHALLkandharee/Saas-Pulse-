import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { getCache, setCache } from "../utils/redis";
import redisClient from "../utils/redis";

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyHeader = req.headers["x-api-key"] as string;

    if (!apiKeyHeader) {
      return res.status(401).json({ success: false, message: "Missing API Key" });
    }

    // 1. Check Redis for API Key (Auth)
    const authCacheKey = `auth:key:${apiKeyHeader}`;
    let authData = await getCache(authCacheKey);

    if (!authData) {
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: apiKeyHeader },
      });

      if (!apiKey) {
        return res.status(401).json({ success: false, message: "Invalid API Key" });
      }

      authData = { userId: apiKey.userId, keyId: apiKey.id };
      await setCache(authCacheKey, authData, 3600);
    }

    // 2. Check Redis for Subscription Plan (Tier)
    const planCacheKey = `user-plan:${authData.userId}`;
    let plan = await redisClient.get(planCacheKey);

    if (!plan) {
      const sub = await prisma.subscription.findUnique({
        where: { userId: authData.userId },
        select: { plan: true }
      });
      plan = sub?.plan || "FREE";
      await redisClient.setEx(planCacheKey, 3600, plan);
    }

    // 3. Performance: Throttled 'lastUsed' update (Once every 5 mins)
    const throttleKey = `auth:lastused:${authData.keyId}`;
    const isThrottled = await redisClient.get(throttleKey);
    
    if (!isThrottled) {
      // Background update (don't await)
      prisma.apiKey.update({
        where: { id: authData.keyId },
        data: { lastUsed: new Date() }
      }).catch(() => {});
      
      // Set throttle flag for 5 minutes
      await redisClient.setEx(throttleKey, 300, "1");
    }

    // 5. Attach context for downstream logic (Rate limiter & Usage counters)
    (req as any).integrationUser = { 
      userId: authData.userId,
      plan: plan // Use the correctly cached plan from Step 2
    };
    
    next();
  } catch (error) {
    console.error("API Key Verification Failed:", error);
    res.status(500).json({ success: false, message: "Internal server error connecting to pulse" });
  }
};
