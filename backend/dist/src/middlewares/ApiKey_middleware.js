"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyApiKey = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const redis_1 = require("../utils/redis");
const redis_2 = __importDefault(require("../utils/redis"));
const verifyApiKey = async (req, res, next) => {
    try {
        const apiKeyHeader = req.headers["x-api-key"];
        if (!apiKeyHeader) {
            return res.status(401).json({ success: false, message: "Missing API Key" });
        }
        // 1. Check Redis for API Key (Auth)
        const authCacheKey = `auth:key:${apiKeyHeader}`;
        let authData = await (0, redis_1.getCache)(authCacheKey);
        if (!authData) {
            const apiKey = await prisma_1.default.apiKey.findUnique({
                where: { key: apiKeyHeader },
            });
            if (!apiKey) {
                return res.status(401).json({ success: false, message: "Invalid API Key" });
            }
            authData = { userId: apiKey.userId, keyId: apiKey.id };
            await (0, redis_1.setCache)(authCacheKey, authData, 3600);
        }
        // 2. Check Redis for Subscription Plan (Tier)
        const planCacheKey = `user-plan:${authData.userId}`;
        let plan = await redis_2.default.get(planCacheKey);
        if (!plan) {
            const sub = await prisma_1.default.subscription.findUnique({
                where: { userId: authData.userId },
                select: { plan: true }
            });
            plan = sub?.plan || "FREE";
            await redis_2.default.setEx(planCacheKey, 3600, plan);
        }
        // 3. Performance: Throttled 'lastUsed' update (Once every 5 mins)
        const throttleKey = `auth:lastused:${authData.keyId}`;
        const isThrottled = await redis_2.default.get(throttleKey);
        if (!isThrottled) {
            // Background update (don't await)
            prisma_1.default.apiKey.update({
                where: { id: authData.keyId },
                data: { lastUsed: new Date() }
            }).catch(() => { });
            // Set throttle flag for 5 minutes
            await redis_2.default.setEx(throttleKey, 300, "1");
        }
        // 5. Attach context for downstream logic (Rate limiter & Usage counters)
        req.integrationUser = {
            userId: authData.userId,
            plan: plan // Use the correctly cached plan from Step 2
        };
        next();
    }
    catch (error) {
        console.error("API Key Verification Failed:", error);
        res.status(500).json({ success: false, message: "Internal server error connecting to pulse" });
    }
};
exports.verifyApiKey = verifyApiKey;
