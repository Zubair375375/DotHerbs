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
  body("avatar")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Avatar must be a valid string path"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Phone must be a valid string"),
  body("addressBook")
    .optional()
    .isArray()
    .withMessage("Address book must be an array"),
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
  body("avatar")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Avatar must be a valid string path"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Phone must be a valid string"),
  body("addressBook")
    .optional()
    .isArray()
    .withMessage("Address book must be an array"),
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
router.put("/me/profile", protect, updateProfileValidation, updateProfile);
router.put("/profile", protect, updateProfileValidation, updateProfile);
router.put(
  "/changepassword",
  protect,
  changePasswordValidation,
  changePassword,
);
router.get("/:id([0-9a-fA-F]{24})", protect, authorize("admin"), getUser);
router.put(
  "/:id([0-9a-fA-F]{24})",
  protect,
  authorize("admin"),
  updateUserValidation,
  updateUser,
);
router.delete("/:id([0-9a-fA-F]{24})", protect, authorize("admin"), deleteUser);

export default router;
