import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MdTrendingUp, MdChevronRight } from "react-icons/md";
import {
  fetchTrendingProducts,
  selectTrendingProducts,
  selectTrendingIsLoading,
  selectTrendingError,
} from "../store/slices/trendingSlice";
import ProductCard from "./ProductCard";
import Loader from "./Loader";
import "../styles/TrendingProducts.css";

const TrendingProducts = () => {
  const dispatch = useDispatch();
  const trendingProducts = useSelector(selectTrendingProducts);
  const isLoading = useSelector(selectTrendingIsLoading);
  const error = useSelector(selectTrendingError);

  useEffect(() => {
    dispatch(fetchTrendingProducts());
  }, [dispatch]);

  if (isLoading) {
    return (
      <section className="trending-section">
        <div className="trending-container">
          <Loader />
        </div>
      </section>
    );
  }

  if (error) {
    console.error("Error fetching trending products:", error);
    return null;
  }

  if (!trendingProducts || trendingProducts.length === 0) {
    return null;
  }

  return (
    <section className="trending-section">
      <div className="trending-container">
        {/* Header */}
        <div className="trending-header">
          <div className="trending-title-group">
            <MdTrendingUp className="trending-icon" />
            <h2 className="trending-title">Trending Now</h2>
          </div>
          <p className="trending-subtitle">
            Discover what's popular with our community right now
          </p>
        </div>

        {/* Products Grid */}
        <div className="trending-products-grid">
          {trendingProducts.map((product) => (
            <div key={product._id} className="trending-product-wrapper">
              <ProductCard product={product} />
              {product.trendingScore && (
                <div className="trending-badge">
                  <span className="trending-score">
                    🔥 {product.trendingScore.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="trending-footer">
          <Link to="/products" className="trending-view-all">
            View All Products
            <MdChevronRight className="trending-chevron" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
