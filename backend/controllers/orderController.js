import { validationResult } from "express-validator";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";
import {
  deductStockFIFO,
  getStockTotalsByProductIds,
} from "../services/inventoryService.js";
import { recordProductSale } from "../services/trendingProductService.js";

const withCustomerFallback = (order) => {
  const orderObject = typeof order.toObject === "function" ? order.toObject() : order;

  if (!orderObject.user && orderObject.customerSnapshot) {
    orderObject.user = {
      name: orderObject.customerSnapshot.name || "Deleted user",
      email: orderObject.customerSnapshot.email || "",
    };
  }

  return orderObject;
};

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

    const session = await mongoose.startSession();
    let createdOrder;

    await session.withTransaction(async () => {
      const productIds = orderItems.map((item) => item.product);
      const products = await Product.find({ _id: { $in: productIds } }).session(
        session,
      );
      const productMap = new Map(
        products.map((product) => [String(product._id), product]),
      );
      const stockMap = await getStockTotalsByProductIds(productIds, session);
      const allocationMap = new Map();

      for (const item of orderItems) {
        const product = productMap.get(String(item.product));
        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.name}`);
        }

        const availableStock = stockMap.get(String(item.product)) || 0;
        if (availableStock < Number(item.quantity)) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }
      }

      for (const item of orderItems) {
        const allocations = await deductStockFIFO(
          item.product,
          Number(item.quantity),
          session,
        );
        allocationMap.set(String(item.product), allocations);
      }

      const orderItemsWithBatches = orderItems.map((item) => {
        const allocations = allocationMap.get(String(item.product)) || [];
        return {
          ...item,
          batchAllocations: allocations.map((allocation) => ({
            batchId: allocation.batchId,
            batchNumber: allocation.batchNumber,
            quantity: allocation.deducted,
          })),
        };
      });

      const order = new Order({
        user: req.user._id,
        customerSnapshot: {
          name: req.user.name || "",
          email: req.user.email || "",
        },
        orderItems: orderItemsWithBatches,
        shippingAddress,
        paymentMethod,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      createdOrder = await order.save({ session });
    });

    session.endSession();

    // Record product sales for trending algorithm
    try {
      for (const item of orderItems) {
        await recordProductSale(item.product, item.quantity);
      }
    } catch (trendingError) {
      // Fire-and-forget: don't fail order if trending tracking fails
      console.warn("[Trending] Failed to record product sales:", trendingError.message);
    }

    res.status(201).json({
      success: true,
      data: createdOrder,
    });
  } catch (error) {
    if (typeof error?.message === "string") {
      if (error.message.startsWith("PRODUCT_NOT_FOUND:")) {
        return res.status(404).json({
          success: false,
          error:
            error.message.replace("PRODUCT_NOT_FOUND:", "Product ") +
            " not found",
        });
      }

      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${error.message.replace("INSUFFICIENT_STOCK:", "")}`,
        });
      }
    }

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
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "orderItems.product",
        select: "name image images",
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check if user owns the order or is admin
    if (req.user.role !== "admin") {
      if (!order.user || order.user._id.toString() !== req.user._id.toString()) {
        return res.status(401).json({
          success: false,
          error: "Not authorized to view this order",
        });
      }
    }

    res.json({
      success: true,
      data: withCustomerFallback(order),
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
      data: orders.map(withCustomerFallback),
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
      data: orders.map(withCustomerFallback),
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

// @desc    Update order status
// @route   PUT /api/orders/:id/status
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
