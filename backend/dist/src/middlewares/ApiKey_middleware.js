"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyApiKey = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const redis_1 = __importDefault(require("../utils/redis"));
const crypto_1 = __importDefault(require("crypto"));
const hashApiKey = (key) => crypto_1.default.createHash("sha256").update(key).digest("hex");
const verifyApiKey = async (req, res, next) => {
    try {
        const apiKeyHeader = req.headers["x-api-key"];
        if (!apiKeyHeader) {
            return res.status(401).json({ success: false, message: "Missing API Key" });
        }
        // Query by a one-way digest. Authentication is deliberately not cached: a
        // deleted key must stop working immediately, not after a cache TTL.
        const apiKeyHash = hashApiKey(apiKeyHeader);
        let apiKey = await prisma_1.default.apiKey.findUnique({ where: { keyHash: apiKeyHash } });
        // Transition path for keys issued before hashing was introduced. A valid
        // legacy key is upgraded atomically on its first successful use.
        if (!apiKey) {
            apiKey = await prisma_1.default.apiKey.findUnique({ where: { key: apiKeyHeader } });
            if (apiKey) {
                apiKey = await prisma_1.default.apiKey.update({
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
        let plan = null;
        try {
            if (redis_1.default.isReady)
                plan = await redis_1.default.get(planCacheKey);
        }
        catch (e) { }
        if (!plan) {
            const sub = await prisma_1.default.subscription.findUnique({
                where: { userId: authData.userId },
                select: { plan: true }
            });
            plan = sub?.plan || "FREE";
            try {
                if (redis_1.default.isReady)
                    await redis_1.default.setEx(planCacheKey, 3600, plan);
            }
            catch (e) { }
        }
        // 3. Performance: Throttled 'lastUsed' update (Once every 5 mins)
        const throttleKey = `auth:lastused:${authData.keyId}`;
        let isThrottled = null;
        try {
            if (redis_1.default.isReady)
                isThrottled = await redis_1.default.get(throttleKey);
        }
        catch (e) { }
        if (!isThrottled) {
            // Background update (don't await)
            prisma_1.default.apiKey.update({
                where: { id: authData.keyId },
                data: { lastUsed: new Date() }
            }).catch(() => { });
            // Set throttle flag for 5 minutes
            try {
                if (redis_1.default.isReady)
                    await redis_1.default.setEx(throttleKey, 300, "1");
            }
            catch (e) { }
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
