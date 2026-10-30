"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPortal = exports.createCheckout = void 0;
const Stripe_service_1 = require("../services/Stripe_service");
const createCheckout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { plan } = req.body;
        if (!["PRO", "ENTERPRISE"].includes(plan)) {
            return res.status(400).json({ success: false, message: "Invalid plan selected" });
        }
        const session = await Stripe_service_1.StripeService.createCheckoutSession(userId, plan);
        res.status(200).json({
            success: true,
            url: session.url,
        });
    }
    catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCheckout = createCheckout;
const createPortal = async (req, res) => {
    try {
        const userId = req.user.userId;
        const session = await Stripe_service_1.StripeService.createPortalSession(userId);
        res.status(200).json({
            success: true,
            url: session.url,
        });
    }
    catch (error) {
        console.error("Stripe Portal Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createPortal = createPortal;
