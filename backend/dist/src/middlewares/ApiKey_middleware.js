"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyApiKey = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const verifyApiKey = async (req, res, next) => {
    try {
        const apiKeyHeader = req.headers["x-api-key"];
        if (!apiKeyHeader) {
            return res.status(401).json({ success: false, message: "Missing API Key" });
        }
        const apiKey = await prisma_1.default.apiKey.findUnique({
            where: { key: apiKeyHeader },
        });
        if (!apiKey) {
            return res.status(401).json({ success: false, message: "Invalid API Key" });
        }
        // Update last used timestamp (optional precision feature)
        await prisma_1.default.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsed: new Date() },
        });
        // Attach the owner's userId and plan to the request so downstream middlewares 
        // (like the rate limiter or pulse controller) know the context.
        const sub = await prisma_1.default.subscription.findUnique({
            where: { userId: apiKey.userId },
            select: { plan: true }
        });
        req.integrationUser = {
            userId: apiKey.userId,
            plan: sub?.plan || "FREE"
        };
        next();
    }
    catch (error) {
        console.error("API Key Verification Failed:", error);
        res.status(500).json({ success: false, message: "Internal server error connecting to pulse" });
    }
};
exports.verifyApiKey = verifyApiKey;
