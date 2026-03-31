"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Ingest_controllers_1 = require("../controllers/Ingest_controllers");
const ApiKey_middleware_1 = require("../middlewares/ApiKey_middleware");
const RateLimit_middleware_1 = require("../middlewares/RateLimit_middleware");
const router = (0, express_1.Router)();
// Public ingestion endpoint, protected by API Key and Rate Limiting
router.post("/event", ApiKey_middleware_1.verifyApiKey, RateLimit_middleware_1.ingestRateLimiter, Ingest_controllers_1.ingestEvent);
exports.default = router;
