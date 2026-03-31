"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = exports.setCache = exports.getCache = exports.connectRedis = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = (0, redis_1.createClient)({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: false, // Disable automatic reconnection to avoid spamming the console
    }
});
let hasLoggedConnectionError = false;
redisClient.on("error", (err) => {
    if (!hasLoggedConnectionError) {
        console.warn(`[REDIS] Connection Error: ${err.message}. Caching will be disabled.`);
        hasLoggedConnectionError = true;
    }
});
redisClient.on("connect", () => {
    console.log("[REDIS] Connected successfully.");
});
// Avoid crashing if Redis isn't running by catching connection errors right away
let isRedisConnected = false;
const connectRedis = async () => {
    try {
        await redisClient.connect();
        isRedisConnected = true;
    }
    catch (error) {
        console.warn("[REDIS] Failed to connect on startup. Operating without cache.");
        isRedisConnected = false;
    }
};
exports.connectRedis = connectRedis;
const getCache = async (key) => {
    if (!isRedisConnected)
        return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (err) {
        return null;
    }
};
exports.getCache = getCache;
const setCache = async (key, value, expirationSeconds = 3600) => {
    if (!isRedisConnected)
        return;
    try {
        await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
    }
    catch (err) {
        // Ignore errors to not break app flow
    }
};
exports.setCache = setCache;
const invalidateCache = async (pattern) => {
    if (!isRedisConnected)
        return;
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    }
    catch (err) {
        // Ignore errors
    }
};
exports.invalidateCache = invalidateCache;
exports.default = redisClient;
