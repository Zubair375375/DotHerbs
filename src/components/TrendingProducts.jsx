import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MdChevronRight } from "react-icons/md";
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
          <div className="trending-heading-row">
            <span className="trending-line" aria-hidden="true" />
            <h2 className="trending-title">TRENDING NOW</h2>
            <span className="trending-line" aria-hidden="true" />
          </div>
          <div className="trending-tabs" aria-label="Trending categories">
            <span className="trending-tab trending-tab-active">
              BEST SELLINGS
            </span>
            <span className="trending-tab-divider">/</span>
            <span className="trending-tab">NEW ARRIVALS</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="trending-products-grid">
          {trendingProducts.map((product) => (
            <div key={product._id} className="trending-product-wrapper">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="trending-footer">
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-[#232323] border border-[#232323] text-white px-4 py-2 text-[14px] font-semibold text-black transition hover:bg-[#ffffff] hover:text-black hover:border hover:border-[#232323]"
          >
            View All Products
            <MdChevronRight className="trending-chevron" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
