import { validationResult } from "express-validator";
import User from "../models/User.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get user's orders
    const Order = (await import("../models/Order.js")).default;
    const orders = await Order.find({ user: req.params.id })
      .populate("orderItems.product", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate statistics
    const totalOrders = await Order.countDocuments({ user: req.params.id });
    const totalSpent = orders.reduce(
      (sum, order) => sum + (order.total || 0),
      0,
    );

    // Get user's reviews (if Product model has reviews)
    let reviews = [];
    try {
      const Product = (await import("../models/Product.js")).default;
      const productsWithReviews = await Product.find({
        "reviews.user": req.params.id,
      }).select("reviews");
      reviews = productsWithReviews.flatMap((product) =>
        product.reviews.filter(
          (review) => review.user.toString() === req.params.id,
        ),
      );
    } catch (error) {
      // Reviews might not be implemented yet, that's okay
      reviews = [];
    }

    const userData = {
      ...user.toObject(),
      orders: orders.map((order) => ({
        _id: order._id,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.orderItems?.length || 0,
      })),
      totalSpent,
      reviews: reviews.length,
    };

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const { name, email, role, avatar, shippingAddress } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    if (typeof avatar === "string") {
      user.avatar = avatar;
    }
    if (shippingAddress) {
      user.shippingAddress = { ...user.shippingAddress, ...shippingAddress };
    }

    await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User removed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const user = await User.findById(req.user._id);

    const { name, email, avatar, shippingAddress } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;
    if (typeof avatar === "string") {
      user.avatar = avatar;
    }
    if (shippingAddress) {
      user.shippingAddress = { ...user.shippingAddress, ...shippingAddress };
    }

    await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/changepassword
// @access  Private
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const user = await User.findById(req.user._id).select("+password");

    const { currentPassword, newPassword } = req.body;

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
