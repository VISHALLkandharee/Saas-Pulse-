import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
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

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    isRedisConnected = true;
  } catch (error) {
    console.warn("[REDIS] Failed to connect on startup. Operating without cache.");
    isRedisConnected = false;
  }
};

export const getCache = async (key: string): Promise<any | null> => {
  if (!isRedisConnected) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

export const setCache = async (key: string, value: any, expirationSeconds: number = 3600) => {
  if (!isRedisConnected) return;
  try {
    await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
  } catch (err) {
    // Ignore errors to not break app flow
  }
};

export const invalidateCache = async (pattern: string) => {
  if (!isRedisConnected) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    // Ignore errors
  }
};

export default redisClient;
