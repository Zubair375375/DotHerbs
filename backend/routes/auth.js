import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  verifyTwoFactor,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many auth attempts. Please try again in 15 minutes.",
  },
});

const passwordRules = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long")
  .matches(/[A-Z]/)
  .withMessage("Password must include at least one uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Password must include at least one lowercase letter")
  .matches(/\d/)
  .withMessage("Password must include at least one number")
  .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
  .withMessage("Password must include at least one special character");

// Validation rules
const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  passwordRules,
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

const resendVerificationValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

const verifyTwoFactorValidation = [
  body("challengeToken").notEmpty().withMessage("Challenge token is required"),
  body("code")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be 6 digits")
    .isNumeric()
    .withMessage("Verification code must be numeric"),
];

const resetPasswordValidation = [passwordRules];

// Routes
router.post("/register", authLimiter, registerValidation, register);
router.get("/verify-email/:token", verifyEmail);
router.post(
  "/resend-verification",
  authLimiter,
  resendVerificationValidation,
  resendVerification,
);
router.post("/login", authLimiter, loginValidation, login);
router.post(
  "/verify-2fa",
  authLimiter,
  verifyTwoFactorValidation,
  verifyTwoFactor,
);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);
router.post(
  "/forgotpassword",
  authLimiter,
  forgotPasswordValidation,
  forgotPassword,
);
router.put(
  "/resetpassword/:resettoken",
  authLimiter,
  resetPasswordValidation,
  resetPassword,
);
router.get("/me", protect, getMe);

export default router;
