import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";
import orderReducer from "./slices/orderSlice";
import userReducer from "./slices/userSlice";
import announcementReducer from "./slices/announcementSlice";
import heroSlideReducer from "./slices/heroSlideSlice";
import productBannerReducer from "./slices/productBannerSlice";
import trendingReducer from "./slices/trendingSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    orders: orderReducer,
    users: userReducer,
    announcements: announcementReducer,
    heroSlides: heroSlideReducer,
    productBanners: productBannerReducer,
    trending: trendingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});
