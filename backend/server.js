import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Always use absolute path for dotenv config
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
const envPath = path.resolve(__dirname, envFile);
if (!fs.existsSync(envPath)) {
  console.error(`[FATAL] Environment file not found: ${envPath}`);
} else {
  console.log(`[INFO] Loading environment file: ${envPath}`);
}
dotenv.config({ path: envPath });

import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import orderRoutes from "./routes/orders.js";
import uploadRoutes from "./routes/upload.js";
import announcementRoutes from "./routes/announcements.js";
import heroSlideRoutes from "./routes/heroSlides.js";
import productBannerRoutes from "./routes/productBanners.js";
import aboutContentRoutes from "./routes/aboutContent.js";
import batchRoutes from "./routes/batches.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.set("trust proxy", 1); // Trust first proxy (Hostinger, Heroku, etc.)

const isProduction =
  (process.env.NODE_ENV || "").toLowerCase() === "production";

const parseAllowedOrigins = () => {
  const explicitOrigins = (process.env.CLIENT_URLS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (explicitOrigins.length > 0) {
    return explicitOrigins;
  }

  const fallbackOrigin = process.env.CLIENT_URL || "http://localhost:5173";
  return [
    fallbackOrigin,
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:5179",
    "http://localhost:5180",
  ];
};

const allowedOrigins = parseAllowedOrigins();

const startServer = async () => {
  try {
    await connectDB();

    // Security middleware
    app.use(helmet());
    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error("CORS blocked for this origin"));
        },
        credentials: true,
      }),
    );

    // Rate limiting
    const rateLimitWindowMs = Number(
      process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    );
    const rateLimitMax = Number(
      process.env.RATE_LIMIT_MAX || (isProduction ? 300 : 5000),
    );

    const limiter = rateLimit({
      windowMs: rateLimitWindowMs,
      max: rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: "Too many requests from this IP, please try again later.",
      skip: (req) => {
        if (!isProduction) {
          return true;
        }
        if (req.method === "GET") {
          return (
            req.originalUrl.startsWith("/api/categories") ||
            req.originalUrl.startsWith("/api/auth/me") ||
            req.originalUrl.startsWith("/api/about-content") ||
            req.originalUrl.startsWith("/api/announcements") ||
            req.originalUrl.startsWith("/api/products") ||
            req.originalUrl.startsWith("/api/orders") ||
            req.originalUrl.startsWith("/api/users") ||
            req.originalUrl.startsWith("/api/hero-slides") ||
            req.originalUrl.startsWith("/api/product-banners")
          );
        }
        return false;
      },
    });
    app.use("/api/", limiter);

    // Body parsing middleware
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    app.use(cookieParser());

    // Serve uploaded product images (allow cross-origin loading from frontend)
    app.use(
      "/uploads",
      (req, res, next) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        next();
      },
      express.static(path.join(__dirname, "uploads")),
    );

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/announcements", announcementRoutes);
    app.use("/api/hero-slides", heroSlideRoutes);
    app.use("/api/product-banners", productBannerRoutes);
    app.use("/api/about-content", aboutContentRoutes);
    app.use("/api/batches", batchRoutes);

    // Health check
    app.get("/api/health", (req, res) => {
      res.json({ status: "OK", message: "Server is running" });
    });

    // Serve static frontend files
    app.use(express.static(path.join(__dirname, "../dist")));

    // Fallback route for SPA (serves index.html for unmatched routes)
    app.use((req, res, next) => {
      if (
        req.method === "GET" &&
        !req.path.startsWith("/api") &&
        !req.path.startsWith("/uploads")
      ) {
        res.sendFile(path.join(__dirname, "../dist/index.html"));
      } else {
        next();
      }
    });

    // Error handling middleware
    app.use(errorHandler);

    const PORT = process.env.PORT;
    if (!PORT) throw new Error("PORT environment variable is missing");
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Ensure only one backend process is running.`,
        );
        process.exit(1);
      }
      console.error("Server failed to start:", error);
      process.exit(1);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received. Shutting down server gracefully...`);
      server.close(() => {
        process.exit(0);
      });
      setTimeout(() => {
        console.error("Forced shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Promise Rejection:", reason);
    });
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
