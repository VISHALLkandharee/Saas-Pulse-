import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Dynamic Rate Limiter for Ingest API
 * thresholds:
 * - FREE: 10 req / min
 * - PRO: 100 req / min
 * - ENTERPRISE: 1000 req / min
 */
export const ingestRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req: Request) => {
    const plan = (req as any).integrationUser?.plan || "FREE";
    if (plan === "PRO") return 100;
    if (plan === "ENTERPRISE") return 1000;
    return 10; // Default: FREE
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many pulses received. Slow down or upgrade your plan."
  },
  keyGenerator: (req: Request) => {
    // Limit based on the API Key (userId) rather than IP
    return (req as any).integrationUser?.userId || "anonymous";
  }
});
