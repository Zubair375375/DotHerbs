import Product from "../models/Product.js";

// In-memory cache with TTL (10-30 minutes, default 15 minutes)
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds
let cachedTrendingProducts = null;
let cacheTimestamp = null;

/**
 * Get current season based on date
 * @param {Date} date - Date to check
 * @returns {string} - Season name
 */
const getCurrentSeason = (date = new Date()) => {
  const month = date.getMonth();
  // Winter: Dec, Jan, Feb (months 11, 0, 1)
  if (month === 11 || month === 0 || month === 1) return "winter";
  // Spring: Mar, Apr, May (months 2, 3, 4)
  if (month >= 2 && month <= 4) return "spring";
  // Summer: Jun, Jul, Aug (months 5, 6, 7)
  if (month >= 5 && month <= 7) return "summer";
  // Fall: Sep, Oct, Nov (months 8, 9, 10)
  return "fall";
};

/**
 * Get seasonal boost based on category and season
 * @param {string} category - Product category
 * @param {string} season - Current season
 * @returns {number} - Boost multiplier (1.0 = no boost, 1.15 = 15% boost)
 */
const getSeasonalBoost = (category, season) => {
  if (!category) return 1.0;
  
  const categoryLower = category.toLowerCase();
  
  // Winter boosting: immunity, cough, flu-related products
  if (season === "winter") {
    if (
      categoryLower.includes("immunity") ||
      categoryLower.includes("immune") ||
      categoryLower.includes("cough") ||
      categoryLower.includes("cold") ||
      categoryLower.includes("flu") ||
      categoryLower.includes("respiratory")
    ) {
      return 1.15; // 15% boost
    }
  }
  
  // Spring boosting: energy, detox, allergy relief
  if (season === "spring") {
    if (
      categoryLower.includes("energy") ||
      categoryLower.includes("detox") ||
      categoryLower.includes("allergy") ||
      categoryLower.includes("digestion")
    ) {
      return 1.10; // 10% boost
    }
  }
  
  // Summer boosting: cooling, hydration, skin care
  if (season === "summer") {
    if (
      categoryLower.includes("cooling") ||
      categoryLower.includes("hydration") ||
      categoryLower.includes("skin") ||
      categoryLower.includes("sun")
    ) {
      return 1.10; // 10% boost
    }
  }
  
  // Fall boosting: digestion, energy, immune support
  if (season === "fall") {
    if (
      categoryLower.includes("digestion") ||
      categoryLower.includes("energy") ||
      categoryLower.includes("immune") ||
      categoryLower.includes("respiratory")
    ) {
      return 1.10; // 10% boost
    }
  }
  
  return 1.0; // No boost
};

/**
 * Calculate trending score for a product
 * Formula: (recentSales * 0.4) + (views * 0.2) + (addToCartCount * 0.2) + (growthRate * 0.2)
 * @param {object} product - Product document
 * @returns {number} - Trending score
 */
const calculateTrendingScore = (product) => {
  const recentSales = product.recentSales || 0;
  const views = product.views || 0;
  const addToCartCount = product.addToCartCount || 0;
  
  // Calculate growth rate safely (handle divide by zero)
  let growthRate = 0;
  const previousSales = product.previousPeriodSales || 0;
  if (previousSales > 0) {
    growthRate = (recentSales - previousSales) / previousSales;
  } else if (recentSales > 0) {
    // If no previous sales but recent sales exist, treat as strong growth
    growthRate = 1.0;
  }
  
  // Clamp growth rate to prevent extreme values (-1 to 2)
  growthRate = Math.max(-1, Math.min(2, growthRate));
  
  // Calculate base score with weights
  const score =
    recentSales * 0.4 +
    views * 0.2 +
    addToCartCount * 0.2 +
    growthRate * 0.2;
  
  return score;
};

/**
 * Fetch all trending products with scoring and optional caching
 * @param {boolean} useCache - Whether to use cached results
 * @returns {Promise<array>} - Array of top 8 trending products
 */
export const fetchTrendingProducts = async (useCache = true) => {
  try {
    // Check cache first
    if (useCache && cachedTrendingProducts && cacheTimestamp) {
      const now = Date.now();
      if (now - cacheTimestamp < CACHE_TTL) {
        console.log("[Trending] Using cached results (valid for", CACHE_TTL / 1000 / 60, "mins)");
        return cachedTrendingProducts;
      } else {
        console.log("[Trending] Cache expired, fetching fresh data");
        cachedTrendingProducts = null;
        cacheTimestamp = null;
      }
    }
    
    // Fetch active products from last 7-14 days
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const products = await Product.find({
      isActive: true,
      $or: [
        { recentSales: { $gt: 0 } },
        { views: { $gt: 0 } },
        { addToCartCount: { $gt: 0 } },
      ],
    })
      .select(
        "_id name price image category recentSales previousPeriodSales views addToCartCount totalSales createdAt"
      )
      .lean();
    
    // Get current season for seasonal boosting
    const season = getCurrentSeason();
    
    // Calculate scores with seasonal boost
    const productsWithScores = products.map((product) => {
      let score = calculateTrendingScore(product);
      
      // Apply seasonal boost
      const seasonalBoost = getSeasonalBoost(product.category, season);
      score = score * seasonalBoost;
      
      return {
        ...product,
        trendingScore: score,
        isTrending: true,
      };
    });
    
    // Sort by trending score (descending) and get top 8
    const topTrending = productsWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 8);
    
    // Cache the results
    if (useCache) {
      cachedTrendingProducts = topTrending;
      cacheTimestamp = Date.now();
      console.log("[Trending] Cache updated with fresh data");
    }
    
    return topTrending;
  } catch (error) {
    console.error("[Trending] Error fetching trending products:", error);
    throw error;
  }
};

/**
 * Record a view for a product
 * @param {string} productId - Product ID
 */
export const recordProductView = async (productId) => {
  try {
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { views: 1 } },
      { new: true }
    );
  } catch (error) {
    console.error("[Trending] Error recording product view:", error);
  }
};

/**
 * Record an add to cart action
 * @param {string} productId - Product ID
 */
export const recordAddToCart = async (productId) => {
  try {
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { addToCartCount: 1 } },
      { new: true }
    );
  } catch (error) {
    console.error("[Trending] Error recording add to cart:", error);
  }
};

/**
 * Record a sale for a product
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity sold
 */
export const recordProductSale = async (productId, quantity = 1) => {
  try {
    await Product.findByIdAndUpdate(
      productId,
      { 
        $inc: { 
          recentSales: quantity,
          totalSales: quantity,
        } 
      },
      { new: true }
    );
    
    // Invalidate cache when a sale is recorded
    cachedTrendingProducts = null;
    cacheTimestamp = null;
  } catch (error) {
    console.error("[Trending] Error recording product sale:", error);
  }
};

/**
 * Reset trending metrics (call this weekly)
 * Moves recentSales to previousPeriodSales and resets recentSales
 */
export const resetTrendingMetrics = async () => {
  try {
    const result = await Product.updateMany(
      {},
      {
        $set: {
          previousPeriodSales: "$recentSales",
          recentSales: 0,
          views: 0,
          addToCartCount: 0,
          metricsLastUpdatedAt: new Date(),
        },
      }
    );
    
    // Clear cache
    cachedTrendingProducts = null;
    cacheTimestamp = null;
    
    console.log("[Trending] Metrics reset completed:", result);
    return result;
  } catch (error) {
    console.error("[Trending] Error resetting metrics:", error);
    throw error;
  }
};

/**
 * Clear cache manually
 */
export const clearTrendingCache = () => {
  cachedTrendingProducts = null;
  cacheTimestamp = null;
  console.log("[Trending] Cache cleared");
};
