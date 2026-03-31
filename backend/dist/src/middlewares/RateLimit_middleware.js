"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Dynamic Rate Limiter for Ingest API
 * thresholds:
 * - FREE: 10 req / min
 * - PRO: 100 req / min
 * - ENTERPRISE: 1000 req / min
 */
exports.ingestRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => {
        const plan = req.integrationUser?.plan || "FREE";
        if (plan === "PRO")
            return 100;
        if (plan === "ENTERPRISE")
            return 1000;
        return 10; // Default: FREE
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: "Too many pulses received. Slow down or upgrade your plan."
    },
    keyGenerator: (req) => {
        // Limit based on the API Key (userId) rather than IP
        return req.integrationUser?.userId || "anonymous";
    }
});
