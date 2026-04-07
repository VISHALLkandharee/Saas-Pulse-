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
    if (plan === "PRO") return 300; // 5 pulses per second
    if (plan === "ENTERPRISE") return 3000; // 50 pulses per second
    return 60; // Default: 1 pulse per second for FREE
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

/**
 * General Rate Limiter for all other routes
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

