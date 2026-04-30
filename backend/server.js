// console.log("CLOUDINARY KEY:", process.env.CLOUDINARY_API_KEY); // Remove after debugging
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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

const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",")
  : [];

// ---------------------- SECURITY (Helmet) ----------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // IMPORTANT: disables CSP blocking React/Vite issues
  }),
);


// ---------------------- CORS (Recommended Static Config) ----------------------
app.use(
  cors({
    origin: "https://dotherbs.com",
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

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

// ---------------------- GRACEFUL SHUTDOWN ----------------------
process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  process.exit(0);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
