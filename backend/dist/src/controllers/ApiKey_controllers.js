"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteApiKey = exports.getApiKeys = exports.generateApiKey = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const hashApiKey = (key) => crypto_1.default.createHash("sha256").update(key).digest("hex");
const publicApiKey = (apiKey) => ({
    ...apiKey,
    display: apiKey.prefix && apiKey.last4 ? `${apiKey.prefix}••••${apiKey.last4}` : "Legacy key",
});
const generateApiKey = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { name } = req.body;
        // 🛡️ PRO Gating: Check API Key limits (Skip for ADMINs)
        if (userRole !== "ADMIN") {
            const [sub, keyCount] = await Promise.all([
                prisma_1.default.subscription.findUnique({ where: { userId } }),
                prisma_1.default.apiKey.count({ where: { userId } })
            ]);
            const plan = sub?.plan || "FREE";
            const limits = { FREE: 1, PRO: 5, ENTERPRISE: 999 };
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
        const key = `sp_live_${crypto_1.default.randomBytes(24).toString("hex")}`;
        const apiKey = await prisma_1.default.apiKey.create({
            data: {
                keyHash: hashApiKey(key),
                prefix: key.slice(0, 11),
                last4: key.slice(-4),
                name: name || "Default Key",
                userId,
            },
            select: {
                id: true,
                name: true,
                prefix: true,
                last4: true,
                createdAt: true,
                lastUsed: true,
            },
        });
        res.status(201).json({
            success: true,
            message: "API Key generated successfully",
            // The plaintext is intentionally returned exactly once and is never stored.
            apiKey: { ...publicApiKey(apiKey), key },
        });
    }
    catch (error) {
        console.error("Failed to generate API Key:", error);
        res.status(500).json({ success: false, message: "Failed to generate API Key" });
    }
};
exports.generateApiKey = generateApiKey;
const getApiKeys = async (req, res) => {
    try {
        const userId = req.user.userId;
        const apiKeys = await prisma_1.default.apiKey.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                prefix: true,
                last4: true,
                createdAt: true,
                lastUsed: true,
            },
        });
        res.status(200).json({
            success: true,
            apiKeys: apiKeys.map(publicApiKey),
        });
    }
    catch (error) {
        console.error("Failed to fetch API Keys:", error);
        res.status(500).json({ success: false, message: "Failed to fetch API Keys" });
    }
};
exports.getApiKeys = getApiKeys;
const deleteApiKey = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        await prisma_1.default.apiKey.deleteMany({
            where: {
                id: id,
                userId: userId // Security check
            },
        });
        res.status(200).json({
            success: true,
            message: "API Key deleted successfully",
        });
    }
    catch (error) {
        console.error("Failed to delete API Key:", error);
        res.status(500).json({ success: false, message: "Failed to delete API Key" });
    }
};
exports.deleteApiKey = deleteApiKey;
