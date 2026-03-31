import { Router } from "express";
import { ingestEvent } from "../controllers/Ingest_controllers";
import { verifyApiKey } from "../middlewares/ApiKey_middleware";
import { ingestRateLimiter } from "../middlewares/RateLimit_middleware";

const router = Router();

// Public ingestion endpoint, protected by API Key and Rate Limiting
router.post("/event", verifyApiKey, ingestRateLimiter, ingestEvent);

export default router;
