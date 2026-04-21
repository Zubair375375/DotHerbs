import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
await connectDB();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:5178",
      "http://localhost:5179",
      "http://localhost:5180",
    ],
    credentials: true,
  }),
);

// Rate limiting
const isProduction = process.env.NODE_ENV === "production";
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
    // In local development, dashboard prefetch + StrictMode can create bursts.
    // Skip throttling to keep dev UX stable.
    if (!isProduction) {
      return true;
    }

    // Public/admin read endpoints can produce clustered GET requests.
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
