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
import { sendEmail } from "../utils/sendEmail.js";

const getGuestNameFromShipping = (shippingAddress = {}) => {
  const firstName = (shippingAddress.firstName || "").trim();
  const lastName = (shippingAddress.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  return fullName || "Guest Customer";
};

const getGuestEmailFromShipping = (shippingAddress = {}) => {
  return (shippingAddress.email || "").trim();
};

const withCustomerFallback = (order) => {
  const orderObject =
    typeof order.toObject === "function" ? order.toObject() : order;

  const snapshotName = (orderObject.customerSnapshot?.name || "").trim();
  const snapshotEmail = (orderObject.customerSnapshot?.email || "").trim();
  const resolvedGuestName =
    snapshotName && snapshotName !== "Guest Customer"
      ? snapshotName
      : getGuestNameFromShipping(orderObject.shippingAddress);
  const resolvedEmail =
    snapshotEmail || (orderObject.shippingAddress?.email || "").trim();

  if (!orderObject.user && orderObject.customerSnapshot) {
    orderObject.user = {
      name: resolvedGuestName,
      email: resolvedEmail,
    };
  }

  return orderObject;
};

const buildOrderConfirmationEmail = (customerName, order) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();
  const itemRows = (order.orderItems || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₱${Number(item.price).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  const addr = order.shippingAddress || {};
  const addressLine = [
    addr.street,
    addr.city,
    addr.state,
    addr.zipCode,
    addr.country,
  ]
    .filter(Boolean)
    .join(", ");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#2d5a27;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:1px;">Dot Herbs</h1>
            <p style="margin:8px 0 0;color:#b7e1b0;font-size:14px;">Order Confirmation</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#333;">Hi <strong>${customerName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#555;">Thank you for your order! We've received it and will process it shortly.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:6px;padding:16px 20px;margin-bottom:28px;">
              <tr>
                <td style="font-size:13px;color:#777;">Order ID</td>
                <td style="font-size:13px;color:#333;text-align:right;font-weight:bold;">#${orderId}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#777;padding-top:8px;">Payment Method</td>
                <td style="font-size:13px;color:#333;text-align:right;padding-top:8px;">${order.paymentMethod || "N/A"}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#777;padding-top:8px;">Shipping To</td>
                <td style="font-size:13px;color:#333;text-align:right;padding-top:8px;">${addressLine || "N/A"}</td>
              </tr>
            </table>

            <!-- Order Items -->
            <h3 style="margin:0 0 12px;font-size:15px;color:#2d5a27;">Order Items</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr style="background:#f1f1f1;">
                  <th style="padding:8px 12px;text-align:left;font-size:13px;color:#555;">Product</th>
                  <th style="padding:8px 12px;text-align:center;font-size:13px;color:#555;">Qty</th>
                  <th style="padding:8px 12px;text-align:right;font-size:13px;color:#555;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr>
                <td style="padding:6px 12px;color:#777;font-size:13px;">Subtotal</td>
                <td style="padding:6px 12px;text-align:right;font-size:13px;color:#333;">₱${(Number(order.totalPrice) - Number(order.taxPrice || 0) - Number(order.shippingPrice || 0)).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:6px 12px;color:#777;font-size:13px;">Shipping</td>
                <td style="padding:6px 12px;text-align:right;font-size:13px;color:#333;">₱${Number(order.shippingPrice || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:6px 12px;color:#777;font-size:13px;">Tax</td>
                <td style="padding:6px 12px;text-align:right;font-size:13px;color:#333;">₱${Number(order.taxPrice || 0).toFixed(2)}</td>
              </tr>
              <tr style="border-top:2px solid #eee;">
                <td style="padding:10px 12px;font-weight:bold;font-size:15px;color:#2d5a27;">Total</td>
                <td style="padding:10px 12px;text-align:right;font-weight:bold;font-size:15px;color:#2d5a27;">₱${Number(order.totalPrice || 0).toFixed(2)}</td>
              </tr>
            </table>

            <p style="margin:32px 0 0;font-size:14px;color:#888;">If you have any questions, reply to this email or contact us at <a href="mailto:${process.env.FROM_EMAIL}" style="color:#2d5a27;">${process.env.FROM_EMAIL}</a>.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} Dot Herbs. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
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
        user: req.user?._id || null,
        customerSnapshot: {
          name: req.user?.name || getGuestNameFromShipping(shippingAddress),
          email: req.user?.email || getGuestEmailFromShipping(shippingAddress),
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
      console.warn(
        "[Trending] Failed to record product sales:",
        trendingError.message,
      );
    }

    // Send order confirmation email (fire-and-forget)
    const customerEmail = shippingAddress.email || req.user?.email;
    const customerName =
      getGuestNameFromShipping(shippingAddress) || req.user?.name || "Customer";
    if (customerEmail) {
      sendEmail({
        email: customerEmail,
        subject: `Order Confirmed - #${createdOrder._id.toString().slice(-8).toUpperCase()}`,
        html: buildOrderConfirmationEmail(customerName, createdOrder),
      }).catch((err) =>
        console.warn("[Order Email] Failed to send confirmation:", err.message),
      );
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
      if (
        !order.user ||
        order.user._id.toString() !== req.user._id.toString()
      ) {
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
