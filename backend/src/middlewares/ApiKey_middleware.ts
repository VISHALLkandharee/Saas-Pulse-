import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import redisClient from "../utils/redis";
import crypto from "crypto";

const hashApiKey = (key: string) =>
  crypto.createHash("sha256").update(key).digest("hex");

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyHeader = req.headers["x-api-key"] as string;

    if (!apiKeyHeader) {
      return res.status(401).json({ success: false, message: "Missing API Key" });
    }

    // Query by a one-way digest. Authentication is deliberately not cached: a
    // deleted key must stop working immediately, not after a cache TTL.
    const apiKeyHash = hashApiKey(apiKeyHeader);
    let apiKey = await prisma.apiKey.findUnique({ where: { keyHash: apiKeyHash } });

    // Transition path for keys issued before hashing was introduced. A valid
    // legacy key is upgraded atomically on its first successful use.
    if (!apiKey) {
      apiKey = await prisma.apiKey.findUnique({ where: { key: apiKeyHeader } });
      if (apiKey) {
        apiKey = await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: {
            key: null,
            keyHash: apiKeyHash,
            prefix: apiKeyHeader.slice(0, 11),
            last4: apiKeyHeader.slice(-4),
          },
        });
      }
    }

    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid API Key" });
    }
    const authData = { userId: apiKey.userId, keyId: apiKey.id };

    // 2. Check Redis for Subscription Plan (Tier)
    const planCacheKey = `user-plan:${authData.userId}`;
    let plan: string | null = null;
    
    try {
      if (redisClient.isReady) plan = await redisClient.get(planCacheKey);
    } catch(e) {}

    if (!plan) {
      const sub = await prisma.subscription.findUnique({
        where: { userId: authData.userId },
        select: { plan: true }
      });
      plan = sub?.plan || "FREE";
      try {
        if (redisClient.isReady) await redisClient.setEx(planCacheKey, 3600, plan);
      } catch(e) {}
    }

    // 3. Performance: Throttled 'lastUsed' update (Once every 5 mins)
    const throttleKey = `auth:lastused:${authData.keyId}`;
    let isThrottled: string | null = null;
    
    try {
      if (redisClient.isReady) isThrottled = await redisClient.get(throttleKey);
    } catch(e) {}
    
    if (!isThrottled) {
      // Background update (don't await)
      prisma.apiKey.update({
        where: { id: authData.keyId },
        data: { lastUsed: new Date() }
      }).catch(() => {});
      
      // Set throttle flag for 5 minutes
      try {
        if (redisClient.isReady) await redisClient.setEx(throttleKey, 300, "1");
      } catch(e) {}
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
