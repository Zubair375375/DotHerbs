/**
 * Trending Metrics Tracker
 * Utility to record user interactions for trending products algorithm
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Record that a product was viewed
 * Call this when user opens product detail page
 */
export const trackProductView = async (productId) => {
  try {
    if (!productId) {
      console.warn("[Tracking] No product ID provided for view");
      return;
    }

    const response = await fetch(`${API_URL}/products/${productId}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[Tracking] Failed to record product view:", response.status);
      return;
    }

    console.log("[Tracking] Product view recorded:", productId);
  } catch (error) {
    // Silently fail - don't break user experience for analytics
    console.warn("[Tracking] Error recording view:", error.message);
  }
};

/**
 * Record that a product was added to cart
 * Call this when user clicks "Add to Cart"
 */
export const trackAddToCart = async (productId) => {
  try {
    if (!productId) {
      console.warn("[Tracking] No product ID provided for add to cart");
      return;
    }

    const response = await fetch(`${API_URL}/products/${productId}/add-to-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[Tracking] Failed to record add to cart:", response.status);
      return;
    }

    console.log("[Tracking] Add to cart recorded:", productId);
  } catch (error) {
    // Silently fail - don't break user experience for analytics
    console.warn("[Tracking] Error recording add to cart:", error.message);
  }
};

/**
 * Record a product sale
 * Call this when order is successfully placed
 * Requires authentication
 */
export const trackProductSale = async (productId, quantity = 1, token = null) => {
  try {
    if (!productId) {
      console.warn("[Tracking] No product ID provided for sale");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/products/${productId}/sale`, {
      method: "POST",
      headers,
      body: JSON.stringify({ quantity: Math.max(1, quantity) }),
    });

    if (!response.ok) {
      console.warn("[Tracking] Failed to record sale:", response.status);
      return;
    }

    console.log("[Tracking] Product sale recorded:", productId, "qty:", quantity);
  } catch (error) {
    // Silently fail - don't break user experience for analytics
    console.warn("[Tracking] Error recording sale:", error.message);
  }
};

/**
 * Fetch trending products
 * Usually handled by Redux, but available as standalone utility too
 */
export const fetchTrendingProducts = async (bypassCache = false) => {
  try {
    const cacheParam = bypassCache ? "?cache=false" : "";
    const response = await fetch(`${API_URL}/products/trending${cacheParam}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("[Tracking] Error fetching trending products:", error);
    return [];
  }
};

/**
 * Clear trending cache (admin only)
 */
export const clearTrendingCache = async (token) => {
  try {
    if (!token) {
      console.warn("[Tracking] No auth token provided for cache clear");
      return false;
    }

    const response = await fetch(`${API_URL}/products/trending/cache/clear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn("[Tracking] Failed to clear cache:", response.status);
      return false;
    }

    console.log("[Tracking] Trending cache cleared");
    return true;
  } catch (error) {
    console.warn("[Tracking] Error clearing cache:", error.message);
    return false;
  }
};

export default {
  trackProductView,
  trackAddToCart,
  trackProductSale,
  fetchTrendingProducts,
  clearTrendingCache,
};
