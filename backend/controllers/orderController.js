import { validationResult } from "express-validator";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No order items",
      });
    }

    // Check if products exist and have sufficient stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product ${item.name} not found`,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}`,
        });
      }
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.stock -= item.quantity;
      await product.save();
    }

    res.status(201).json({
      success: true,
      data: createdOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check if user owns the order or is admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to view this order",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: "orderItems.product",
        select: "name images price",
      })
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .populate("user", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments();

    res.json({
      success: true,
      data: orders,
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

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = "delivered";

    const updatedOrder = await order.save();

    res.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const { status } = req.body;

    if (
      !["pending", "processing", "shipped", "delivered", "cancelled"].includes(
        status,
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    order.status = status;
    if (status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Create Stripe payment intent
// @route   POST /api/orders/create-payment-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        userId: req.user._id.toString(),
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Payment intent creation failed",
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/orders/confirm-payment
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        error: "Not authorized",
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: paymentIntentId,
      status: "succeeded",
    };

    await order.save();

    res.json({
      success: true,
      message: "Payment confirmed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Payment confirmation failed",
    });
  }
};
