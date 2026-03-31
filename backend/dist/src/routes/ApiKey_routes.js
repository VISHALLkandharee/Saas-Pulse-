"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApiKey_controllers_1 = require("../controllers/ApiKey_controllers");
const Auth_Middleware_1 = require("../middlewares/Auth_Middleware");
const router = (0, express_1.Router)();
// All API key routes require standard authentication (founder role)
router.use(Auth_Middleware_1.authMiddleware);
router.post("/generate", ApiKey_controllers_1.generateApiKey);
router.get("/", ApiKey_controllers_1.getApiKeys);
router.delete("/:id", ApiKey_controllers_1.deleteApiKey);
exports.default = router;
