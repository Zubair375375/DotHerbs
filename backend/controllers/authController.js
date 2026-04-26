import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

const EMAIL_VERIFICATION_EXPIRE_MINUTES = Number(
  process.env.EMAIL_VERIFICATION_EXPIRE_MINUTES || 60,
);
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES || 15);
const TWO_FACTOR_CODE_EXPIRE_MINUTES = Number(
  process.env.TWO_FACTOR_CODE_EXPIRE_MINUTES || 10,
);

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateRandomToken = () => crypto.randomBytes(32).toString("hex");

const generateNumericCode = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

const normalizedEmail = (email) => email?.trim().toLowerCase();

const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", getRefreshCookieOptions());
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

const generateTwoFactorChallengeToken = (id) => {
  return jwt.sign({ id, type: "2fa" }, process.env.JWT_SECRET, {
    expiresIn: `${TWO_FACTOR_CODE_EXPIRE_MINUTES}m`,
  });
};

const issueAuthTokens = async (user) => {
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = hashToken(refreshToken);
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

const getClientBaseUrl = () => {
  const clientUrls = (process.env.CLIENT_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (clientUrls.length > 0) {
    return clientUrls[0];
  }

  return process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
};

const sendVerificationEmail = async (user) => {
  const verificationToken = generateRandomToken();

  user.emailVerificationToken = hashToken(verificationToken);
  user.emailVerificationExpire =
    Date.now() + EMAIL_VERIFICATION_EXPIRE_MINUTES * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const clientUrl = getClientBaseUrl();
  const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;

  const message = `Welcome to Dot-Herbs! Please verify your email by opening this link: ${verifyUrl}. This link expires in ${EMAIL_VERIFICATION_EXPIRE_MINUTES} minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Verify your Dot-Herbs account",
      message,
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw error;
  }
};

const sendTwoFactorCode = async (user) => {
  const code = generateNumericCode(6);

  user.twoFactorCodeHash = hashToken(code);
  user.twoFactorCodeExpire =
    Date.now() + TWO_FACTOR_CODE_EXPIRE_MINUTES * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const message = `Your Dot-Herbs login verification code is: ${code}. It expires in ${TWO_FACTOR_CODE_EXPIRE_MINUTES} minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your Dot-Herbs login verification code",
      message,
    });
  } catch (error) {
    user.twoFactorCodeHash = undefined;
    user.twoFactorCodeExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw error;
  }
};

const getRemainingLockMinutes = (lockUntil) => {
  const diff = Number(lockUntil) - Date.now();
  return Math.max(1, Math.ceil(diff / (60 * 1000)));
};

const registerFailedLoginAttempt = async (user) => {
  const attempts = (user.loginAttempts || 0) + 1;

  if (attempts >= LOGIN_MAX_ATTEMPTS) {
    user.loginAttempts = 0;
    user.lockUntil = Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000;
  } else {
    user.loginAttempts = attempts;
  }

  await user.save({ validateBeforeSave: false });

  if (user.lockUntil && user.lockUntil > Date.now()) {
    return {
      locked: true,
      remainingMinutes: getRemainingLockMinutes(user.lockUntil),
    };
  }

  return {
    locked: false,
    attemptsLeft: Math.max(0, LOGIN_MAX_ATTEMPTS - attempts),
  };
};

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  const name = req.body.name?.trim();
  const email = normalizedEmail(req.body.email);
  const { password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      isEmailVerified: false,
    });

    await sendVerificationEmail(user);

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email before logging in.",
      data: { email: user.email },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const verifyEmail = async (req, res) => {
  const tokenHash = hashToken(req.params.token);

  try {
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const resendVerification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  const email = normalizedEmail(req.body.email);

  try {
    const user = await User.findOne({ email });
    if (user && !user.isEmailVerified) {
      await sendVerificationEmail(user);
    }

    res.json({
      success: true,
      message: "If your account exists, a verification email has been sent.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Email could not be sent",
    });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  const email = normalizedEmail(req.body.email);
  const { password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        error: `Account temporarily locked. Try again in ${getRemainingLockMinutes(user.lockUntil)} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const lockState = await registerFailedLoginAttempt(user);

      if (lockState.locked) {
        return res.status(423).json({
          success: false,
          error: `Too many failed attempts. Account locked for ${lockState.remainingMinutes} minute(s).`,
        });
      }

      return res.status(401).json({
        success: false,
        error: `Invalid credentials. ${lockState.attemptsLeft} attempt(s) remaining.`,
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    if (user.twoFactorEnabled) {
      await sendTwoFactorCode(user);
      const challengeToken = generateTwoFactorChallengeToken(user._id);

      return res.json({
        success: true,
        data: {
          requiresTwoFactor: true,
          challengeToken,
          email: user.email,
        },
      });
    }

    const authPayload = await issueAuthTokens(user);
    setRefreshCookie(res, authPayload.refreshToken);

    res.json({
      success: true,
      data: {
        user: authPayload.user,
        accessToken: authPayload.accessToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const verifyTwoFactor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  const { challengeToken, code } = req.body;

  try {
    const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
    if (decoded.type !== "2fa") {
      return res.status(401).json({
        success: false,
        error: "Invalid 2FA challenge",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({
        success: false,
        error: "Invalid 2FA challenge",
      });
    }

    if (!user.twoFactorCodeHash || !user.twoFactorCodeExpire) {
      return res.status(401).json({
        success: false,
        error: "2FA code expired. Please login again.",
      });
    }

    if (user.twoFactorCodeExpire <= Date.now()) {
      user.twoFactorCodeHash = undefined;
      user.twoFactorCodeExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(401).json({
        success: false,
        error: "2FA code expired. Please login again.",
      });
    }

    const incomingCodeHash = hashToken(String(code).trim());
    if (incomingCodeHash !== user.twoFactorCodeHash) {
      return res.status(401).json({
        success: false,
        error: "Invalid verification code",
      });
    }

    user.twoFactorCodeHash = undefined;
    user.twoFactorCodeExpire = undefined;
    const authPayload = await issueAuthTokens(user);
    setRefreshCookie(res, authPayload.refreshToken);

    res.json({
      success: true,
      data: {
        user: authPayload.user,
        accessToken: authPayload.accessToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired 2FA challenge",
    });
  }
};

export const refreshToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({
      success: false,
      error: "Refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET,
    );
    const user = await User.findById(decoded.id);
    const incomingTokenHash = hashToken(incomingRefreshToken);

    if (!user || user.refreshToken !== incomingTokenHash) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }

    const accessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = hashToken(newRefreshToken);
    await user.save({ validateBeforeSave: false });
    setRefreshCookie(res, newRefreshToken);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid refresh token",
    });
  }
};

export const logout = async (req, res) => {
  try {
    req.user.refreshToken = null;
    req.user.twoFactorCodeHash = undefined;
    req.user.twoFactorCodeExpire = undefined;
    await req.user.save({ validateBeforeSave: false });
    clearRefreshCookie(res);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  const email = normalizedEmail(req.body.email);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account exists for that email, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${getClientBaseUrl()}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) requested a password reset. Open this link: ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password reset token",
        message,
      });

      res.json({
        success: true,
        message:
          "If an account exists for that email, a password reset link has been sent.",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: "Email could not be sent",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid token",
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: user,
  });
};
