"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
//routes
const user_routes_1 = __importDefault(require("./routes/user_routes"));
const Metrics_routes_1 = __importDefault(require("./routes/Metrics_routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription_routes"));
const ApiKey_routes_1 = __importDefault(require("./routes/ApiKey_routes"));
const Ingest_routes_1 = __importDefault(require("./routes/Ingest_routes"));
const Admin_routes_1 = __importDefault(require("./routes/Admin_routes"));
const Stripe_Webhook_controller_1 = require("./controllers/Stripe_Webhook_controller");
const ErrorHandler_middleware_1 = __importDefault(require("./middlewares/ErrorHandler_middleware"));
const app = (0, express_1.default)();
// Request logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
//security middlewares
app.use((0, helmet_1.default)());
const allowedOrigins = [
    "http://localhost:3000",
    "http://192.168.10.23:3000",
    process.env.CLIENT_URL, // Allows production domains
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (like Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
// Serve uploaded files statically
app.use('/uploads', express_1.default.static('uploads'));
// Stripe Webhook needs raw body for signature verification
app.post("/api/billing/webhook", express_1.default.raw({ type: "application/json" }), Stripe_Webhook_controller_1.stripeWebhook);
//parsing data middlewares
app.use(express_1.default.json());
app.use("/api/auth", user_routes_1.default);
app.use("/api/metrics", Metrics_routes_1.default);
app.use("/api/subscriptions", subscription_routes_1.default);
app.use("/api/keys", ApiKey_routes_1.default);
app.use("/api/v1", Ingest_routes_1.default);
app.use("/api/admin", Admin_routes_1.default);
app.use(ErrorHandler_middleware_1.default);
exports.default = app;
