"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRateLimiter = exports.ingestRateLimiter = void 0;
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
            return 300; // 5 pulses per second
        if (plan === "ENTERPRISE")
            return 3000; // 50 pulses per second
        return 60; // Default: 1 pulse per second for FREE
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
/**
 * General Rate Limiter for all other routes
 */
exports.generalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
});
