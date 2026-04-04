import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";


//routes
import userRoutes from "./routes/user_routes";
import metricsRoutes from "./routes/Metrics_routes";
import subscriptionRoutes from "./routes/subscription_routes";
import apiKeyRoutes from "./routes/ApiKey_routes";
import ingestRoutes from "./routes/Ingest_routes";
import adminRoutes from "./routes/Admin_routes";
import { stripeWebhook } from "./controllers/Stripe_Webhook_controller";
import errorHandlerMiddleware from "./middlewares/ErrorHandler_middleware";

import { generalRateLimiter } from "./middlewares/RateLimit_middleware";

const app = express();
app.set('trust proxy', 1);

// Apply global rate limiting to protect the server
app.use(generalRateLimiter);

// Request logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

//security middlewares
app.use(helmet());

const allowedOrigins = [
  "http://localhost:3000", 
  "http://192.168.10.23:3000",
  process.env.CLIENT_URL, // Allows production domains
].filter(Boolean) as string[];


app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Stripe Webhook needs raw body for signature verification
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);

//parsing data middlewares
app.use(express.json());


app.use("/api/auth", userRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use("/api/v1", ingestRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandlerMiddleware);

export default app;
