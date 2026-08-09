import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import routes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { CORS_ALLOWED_ORIGINS, NODE_ENV } from "./config.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Security headers. Allow cross-origin resource sharing for file downloads
  // (access is still gated by the CORS allowlist below).
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // CORS allowlist. When credentials are used, reflect the explicit origin.
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (CORS_ALLOWED_ORIGINS.includes(origin)) {
          callback(null, origin);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      exposedHeaders: ["Content-Disposition", "X-Filename"],
      maxAge: 86400,
    }),
  );

  if (NODE_ENV !== "test") {
    app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
  }

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: false, limit: "5mb" }));
  app.use(cookieParser());

  // Rate limiting on the API surface.
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "Too many requests, please try again later." },
    }),
  );

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
