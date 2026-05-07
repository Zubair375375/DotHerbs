// Force dotenv to load the correct file based on NODE_ENV
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(
    __dirname,
    process.env.NODE_ENV === "production" ? ".env.production" : ".env",
  ),
});

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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
app.set("trust proxy", 1);

const isProduction =
  (process.env.NODE_ENV || "").toLowerCase() === "production";

const allowedOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  allowedOrigins.push(process.env.CLIENT_URL || "http://localhost:5173");
}

// ---------------------- SECURITY ----------------------
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
//         scriptSrc: ["'self'", "'unsafe-inline'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//       },
//     },
//   }),
// );
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        connectSrc: ["'self'", process.env.API_URL],

        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }),
);
// ---------------------- CORS ----------------------
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
  }),
);

app.options("*", cors());

// ---------------------- RATE LIMIT ----------------------
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 300 : 5000,
  }),
);

// ---------------------- BODY ----------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------------- STATIC ----------------------
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

app.use(
  "/api/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

// ---------------------- ROUTES ----------------------
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

// ---------------------- HEALTH ----------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// ---------------------- FRONTEND ----------------------
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  }
});

// ---------------------- ERROR ----------------------
app.use(errorHandler);

// ---------------------- START ----------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    process.on("SIGINT", () => server.close(() => process.exit(0)));
    process.on("SIGTERM", () => server.close(() => process.exit(0)));
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

startServer();
