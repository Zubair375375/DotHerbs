import {
  fetchTrendingProducts,
  recordProductView,
  recordAddToCart,
  recordProductSale,
  clearTrendingCache,
} from "../services/trendingProductService.js";

/**
 * @desc    Get trending products
 * @route   GET /api/products/trending
 * @access  Public
 */
export const getTrendingProducts = async (req, res) => {
  try {
    const useCache = req.query.cache !== "false"; // Allow bypassing cache via ?cache=false
    const trendingProducts = await fetchTrendingProducts(useCache);
    
    res.json({
      success: true,
      data: trendingProducts,
      count: trendingProducts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TrendingController] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trending products",
    });
  }
};

/**
 * @desc    Record product view
 * @route   POST /api/products/:id/view
 * @access  Public
 */
export const recordView = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }
    
    await recordProductView(id);
    
    res.json({
      success: true,
      message: "View recorded",
    });
  } catch (error) {
    console.error("[TrendingController] Error recording view:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record view",
    });
  }
};

/**
 * @desc    Record add to cart action
 * @route   POST /api/products/:id/add-to-cart
 * @access  Public
 */
export const recordCart = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }
    
    await recordAddToCart(id);
    
    res.json({
      success: true,
      message: "Add to cart recorded",
    });
  } catch (error) {
    console.error("[TrendingController] Error recording add to cart:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record add to cart",
    });
  }
};

/**
 * @desc    Record product sale
 * @route   POST /api/products/:id/sale
 * @access  Private/Admin
 */
export const recordSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be at least 1",
      });
    }
    
    await recordProductSale(id, quantity);
    
    res.json({
      success: true,
      message: "Sale recorded",
    });
  } catch (error) {
    console.error("[TrendingController] Error recording sale:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record sale",
    });
  }
};

/**
 * @desc    Clear trending cache
 * @route   POST /api/products/trending/cache/clear
 * @access  Private/Admin
 */
export const clearCache = async (req, res) => {
  try {
    clearTrendingCache();
    
    res.json({
      success: true,
      message: "Trending cache cleared",
    });
  } catch (error) {
    console.error("[TrendingController] Error clearing cache:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cache",
    });
  }
};
