import express from "express";
import { body } from "express-validator";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either user or admin"),
];

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

// Routes
router.get("/", protect, authorize("admin"), getUsers);
router.get("/:id", protect, authorize("admin"), getUser);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateUserValidation,
  updateUser,
);
router.delete("/:id", protect, authorize("admin"), deleteUser);

// Profile routes
router.put("/profile", protect, updateProfileValidation, updateProfile);
router.put(
  "/changepassword",
  protect,
  changePasswordValidation,
  changePassword,
);

export default router;
