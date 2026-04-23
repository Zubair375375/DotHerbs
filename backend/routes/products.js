import express from "express";
import { body } from "express-validator";
import Category from "../models/Category.js";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getCategories,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

const getWordCount = (value = "") =>
  String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const isValidBriefPoints = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  return value.every(
    (point) =>
      typeof point === "string" &&
      point.trim().length > 0 &&
      point.trim().length <= 300,
  );
};

// Validation rules
const createProductValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters")
    .custom((value) => {
      if (getWordCount(value) > 50) {
        throw new Error("Description for product listing must be 50 words or fewer");
      }
      return true;
    }),
  body("briefDescriptionPoints")
    .custom((value) => {
      if (!isValidBriefPoints(value)) {
        throw new Error(
          "Brief description points are required, and each point must be 1 to 300 characters",
        );
      }
      return true;
    }),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("costPrice")
    .isFloat({ min: 0 })
    .withMessage("Cost price must be a positive number"),
  body("sku")
    .trim()
    .isLength({ min: 3, max: 64 })
    .withMessage("SKU must be between 3 and 64 characters")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "SKU can only contain letters, numbers, hyphens, and underscores",
    ),
  body("category").custom(async (value) => {
    const category = await Category.findOne({ value, isActive: true });
    if (!category) {
      throw new Error("Invalid category");
    }
    return true;
  }),
  body("helpsTo")
    .optional()
    .trim()
    .isLength({ max: 600 })
    .withMessage("Helps to content cannot be more than 600 characters"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

const updateProductValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters")
    .custom((value) => {
      if (getWordCount(value) > 50) {
        throw new Error("Description for product listing must be 50 words or fewer");
      }
      return true;
    }),
  body("briefDescriptionPoints")
    .optional()
    .custom((value) => {
      if (!isValidBriefPoints(value)) {
        throw new Error(
          "Brief description points must be a non-empty list and each point must be 1 to 300 characters",
        );
      }
      return true;
    }),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("costPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost price must be a positive number"),
  body("sku")
    .optional()
    .trim()
    .isLength({ min: 3, max: 64 })
    .withMessage("SKU must be between 3 and 64 characters")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "SKU can only contain letters, numbers, hyphens, and underscores",
    ),
  body("category")
    .optional()
    .custom(async (value) => {
      const category = await Category.findOne({ value, isActive: true });
      if (!category) {
        throw new Error("Invalid category");
      }
      return true;
    }),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("helpsTo")
    .optional()
    .trim()
    .isLength({ max: 600 })
    .withMessage("Helps to content cannot be more than 600 characters"),
];

const reviewValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Comment must be between 10 and 500 characters"),
];

// Routes
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProduct);
router.post(
  "/",
  protect,
  authorize("admin"),
  createProductValidation,
  createProduct,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateProductValidation,
  updateProduct,
);
router.delete("/:id", protect, authorize("admin"), deleteProduct);
router.post("/:id/reviews", protect, reviewValidation, createProductReview);

export default router;
