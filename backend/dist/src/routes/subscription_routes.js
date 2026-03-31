"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Stripe_controllers_1 = require("../controllers/Stripe_controllers");
const Subscription_controllers_1 = require("../controllers/Subscription_controllers");
const Auth_Middleware_1 = require("../middlewares/Auth_Middleware");
const router = (0, express_1.Router)();
// Founder routes (Managing their own plan)
router.post("/checkout", Auth_Middleware_1.authMiddleware, Stripe_controllers_1.createCheckout);
router.post("/portal", Auth_Middleware_1.authMiddleware, Stripe_controllers_1.createPortal);
// Admin routes (Managing other people's subscriptions)
router.patch("/update", Auth_Middleware_1.authMiddleware, Auth_Middleware_1.authorizeAdmin, Subscription_controllers_1.updateSubscription);
exports.default = router;
