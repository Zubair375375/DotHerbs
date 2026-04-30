import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./config/loadEnv.js";
import connectDB from "./config/database.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[DEBUG] Cloudinary ENV (server.js):', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '***' : undefined
});

const isProduction = (process.env.NODE_ENV || "").toLowerCase() === "production";

const parseAllowedOrigins = () => {
  const explicitOrigins = (process.env.CLIENT_URLS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (explicitOrigins.length > 0) {
    return explicitOrigins;
  }
  return [process.env.CLIENT_URL || "http://localhost:5173"];
};
const allowedOrigins = parseAllowedOrigins();

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
app.set("trust proxy", 1);

const startServer = async () => {
  try {
    await connectDB();

    // Security middleware with explicit Content Security Policy for Cloudinary images
    app.use(
      helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      })
    );
    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error("CORS blocked for this origin"));
        },
        credentials: true,
      })
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ENV
const envFile = process.env.NODE_ENV?.includes("production")
  ? ".env.production"
  : ".env";

const envPath = path.resolve(__dirname, envFile);

if (!fs.existsSync(envPath)) {
  console.error(`[FATAL] Missing env file: ${envPath}`);
} else {
  console.log(`[INFO] Loading env: ${envPath}`);
}

dotenv.config({
  path:
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, ".env.production")
      : path.resolve(__dirname, ".env"),
});

const app = express();
app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";


// Robust CORS: allow all localhost ports in dev, only prod domain in prod
const allowedOrigins = isProduction
  ? ["https://dotherbs.com"]
  : [
      "http://localhost:5173",
      "http://localhost:5000",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:5178",
      "http://localhost:5179",
      "http://localhost:5180"
    ];

// ---------------------- SECURITY (Helmet) ----------------------

// Only enable Helmet CSP in production
if (isProduction) {
  app.use(
    helmet({
      contentSecurityPolicy: false, // Set to true if you want strict CSP in prod
    })
  );
}

// ---------------------- CORS (Recommended Static Config) ----------------------

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow all localhost:* in dev
      if (
        !isProduction &&
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error("CORS blocked: " + origin));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests for all routes
app.options("*", cors());

// ---------------------- RATE LIMIT ----------------------
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 300 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ---------------------- BODY PARSER ----------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------------- STATIC FILES ----------------------
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

// ---------------------- ROUTES ----------------------
// (CORS must be above all routes)
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

// ---------------------- HEALTH CHECK ----------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server running" });
});

// ---------------------- SERVE FRONTEND ----------------------
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  }
});

// ---------------------- ERROR HANDLER ----------------------
app.use(errorHandler);

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 5000;

=======
>>>>>>> Stashed changes
const startServer = async () => {
  try {
    await connectDB();

    // Security middleware with explicit Content Security Policy for Cloudinary images
    app.use(
      helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      })
    );
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
