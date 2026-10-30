// @ts-check
import { join } from "path";
import { readFileSync, existsSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import compression from "compression";

import shopify from "./shopify.js";
import PrivacyWebhookHandlers from "./privacy.js";
import { connectDB } from "./config/db.js";

import storefrontRoutes from "./routes/storefront.routes.js";
import timerRoutes from "./routes/timer.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

import { requireAuthenticatedShop } from "./middleware/auth.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

app.use(compression());

// Connect to MongoDB
if (process.env.NODE_ENV !== "test") {
  connectDB().catch((err) => {
    console.error("Initial MongoDB connection failed:", err.message);
  });
}

// 1. Shopify OAuth Authentication endpoints
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

// 2. Shopify Webhook processing
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// 3. Public Storefront Endpoints (Unauthenticated, rate-limited, strictly validated, CORS enabled)
app.use("/api/storefront", express.json({ limit: "64kb" }), storefrontRoutes);

// Auth middleware helper: in test environment allows x-test-shop header for testing multi-tenancy
const authCheck = (req, res, next) => {
  if (process.env.NODE_ENV === "test" && req.headers["x-test-shop"]) {
    return next();
  }
  return shopify.validateAuthenticatedSession()(req, res, next);
};

// 4. Protected Admin API Endpoints (Requires verified Shopify session token)
app.use("/api/timers", authCheck, express.json({ limit: "1mb" }), requireAuthenticatedShop, timerRoutes);
app.use("/api/analytics", authCheck, express.json({ limit: "1mb" }), requireAuthenticatedShop, analyticsRoutes);

// CSP headers for embedded admin app
app.use(shopify.cspHeaders());

// Serve frontend assets
app.use(serveStatic(STATIC_PATH, { index: false }));

// Fallback to React app for embedded admin navigation
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  const indexPath = join(STATIC_PATH, "index.html");
  if (existsSync(indexPath)) {
    return res
      .status(200)
      .set("Content-Type", "text/html")
      .send(
        readFileSync(indexPath)
          .toString()
          .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
      );
  }
  return res.status(200).send("Countdown Timer + Analytics Admin App");
});

// Centralized error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[Countdown Timer + Analytics] Server running on port ${PORT}`);
  });
}

export default app;
