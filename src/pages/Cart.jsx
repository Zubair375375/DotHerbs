import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectCartItems,
  selectCartTotal,
  selectCartIsLoading,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "../store/slices/cartSlice";
import { selectIsAuthenticated } from "../store/slices/authSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { FaTrash, FaPlus, FaMinus, FaShoppingBag } from "react-icons/fa";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const isLoading = useSelector(selectCartIsLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const getProductImage = (product) => {
    const rawImage =
      product?.image || product?.images?.[0]?.url || product?.images?.[0];
    if (!rawImage) return "/placeholder-product.jpg";
    if (/^https?:\/\//i.test(rawImage)) return rawImage;
    if (rawImage === "/placeholder-product.jpg") return rawImage;
    if (rawImage.startsWith("/uploads/"))
      return `${SERVER_URL}${rawImage}`;
    return rawImage;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const item = cartItems.find((item) => item.product._id === productId);
    if (item && newQuantity > item.product.stock) {
      toast.error(`Only ${item.product.stock} items available in stock`);
      return;
    }

    dispatch(updateQuantity({ productId, quantity: newQuantity }));
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
    toast.success("Item removed from cart");
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      dispatch(clearCart());
      toast.success("Cart cleared");
    }
  };

  const handleApplyPromoCode = () => {
    // Simple promo code logic - in real app, this would be validated on backend
    if (promoCode.toLowerCase() === "welcome10") {
      setDiscount(cartTotal * 0.1);
      toast.success("Promo code applied! 10% discount");
    } else if (promoCode.toLowerCase() === "herbs20") {
      setDiscount(cartTotal * 0.2);
      toast.success("Promo code applied! 20% discount");
    } else {
      toast.error("Invalid promo code");
      setDiscount(0);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  const subtotal = cartTotal;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = (subtotal + shipping - discount) * 0.08;
  const total = subtotal + shipping + tax - discount;

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[24px] font-bold text-gray-800">Shopping Cart</h1>
        {cartItems.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-800 flex items-center space-x-2"
          >
            <FaTrash />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <FaShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
          <h2 className="text-[18px] font-semibold text-gray-600 mb-4">
            Your cart is empty
          </h2>
          <p className="text-[14px] text-gray-500 mb-8">
            Add some products to get started!
          </p>
          <button
            onClick={() => navigate("/products")}
            className="bg-[#232323] text-white px-4 py-2 hover:bg-white hover:text-[#232323] border border-[#232323] hover:border-[#232323] transition-colors duration-300"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.product._id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex space-x-4">
                  <img
                    src={getProductImage(item.product)}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded"
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {item.product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-green-600">
                          ${item.product.price?.toFixed(2)}
                        </span>

                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product._id,
                                item.quantity - 1,
                              )
                            }
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                          >
                            <FaMinus className="text-xs" />
                          </button>
                          <span className="px-4 py-1 border-x border-gray-300">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product._id,
                                item.quantity + 1,
                              )
                            }
                            disabled={item.quantity >= item.product.stock}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <FaPlus className="text-xs" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="font-semibold">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.product._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Promo Code */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Promo Code</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleApplyPromoCode}
                  className="bg-[#68a300] text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Try: WELCOME10 or HERBS20
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-[#ffce12] text-black py-3 rounded-lg hover:bg-[##f8bd19] mt-6 font-semibold"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate("/products")}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 mt-3"
              >
                Continue Shopping
              </button>
            </div>

            {/* Shipping Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                Free Shipping
              </h4>
              <p className="text-blue-700 text-sm">
                Orders over $50 qualify for free shipping. Standard shipping is
                just $9.99.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
