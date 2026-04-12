import { createSlice } from "@reduxjs/toolkit";

// Get cart from localStorage
const getCartFromStorage = () => {
  const cart = localStorage.getItem("cart");
  return cart ? JSON.parse(cart) : { items: [], total: 0 };
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
};

// Initial state
const initialState = {
  ...getCartFromStorage(),
  isLoading: false,
  error: null,
};

// Cart slice
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(
        (item) => item.product._id === product._id,
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          product,
          quantity,
          price: product.price,
        });
      }

      // Recalculate total
      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      saveCartToStorage(state);
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(
        (item) => item.product._id !== productId,
      );

      // Recalculate total
      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      saveCartToStorage(state);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((item) => item.product._id === productId);

      if (item && quantity > 0) {
        item.quantity = quantity;

        // Recalculate total
        state.total = state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );

        saveCartToStorage(state);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      saveCartToStorage(state);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  clearError,
} = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartIsLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;

export default cartSlice.reducer;
