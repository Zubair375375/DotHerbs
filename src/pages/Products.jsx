import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  fetchCategories,
  fetchProducts,
  selectCategories,
  selectProducts,
  selectProductsStatus,
  selectProductsError,
} from "../store/slices/productSlice";
import {
  fetchProductBanners,
  selectProductBanners,
} from "../store/slices/productBannerSlice";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";

const Products = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const status = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);
  const productBanners = useSelector(selectProductBanners);
  const initialCategory = searchParams.get("category") || "";
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isBannerTransition, setIsBannerTransition] = useState(true);

  const [filters, setFilters] = useState({
    category: initialCategory,
    priceRange: "",
    search: "",
    sortBy: "name",
  });

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchProductBanners());
  }, [dispatch]);

  const bannerSlides = useMemo(() => {
    if (productBanners.length > 0) {
      return productBanners.map((banner) => ({
        _id: banner._id,
        image: banner.image?.startsWith("http")
          ? banner.image
          : `http://localhost:5000${banner.image}`,
      }));
    }

    return [
      {
        _id: "fallback-products-banner",
        image: "/images/banners/hero_banner1.jpg",
      },
    ];
  }, [productBanners]);

  const loopedBannerSlides = useMemo(() => {
    if (bannerSlides.length <= 1) return bannerSlides;
    return [...bannerSlides, bannerSlides[0]];
  }, [bannerSlides]);

  useEffect(() => {
    setCurrentBanner(0);
    setIsBannerTransition(true);
  }, [bannerSlides.length]);

  useEffect(() => {
    if (bannerSlides.length <= 1) return undefined;
    const intervalId = window.setInterval(() => {
      setCurrentBanner((prev) => prev + 1);
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [bannerSlides.length]);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    if (currentBanner > bannerSlides.length) {
      setIsBannerTransition(false);
      setCurrentBanner(0);
    }
  }, [currentBanner, bannerSlides.length]);

  useEffect(() => {
    if (isBannerTransition) return undefined;
    const frameId = window.requestAnimationFrame(() =>
      setIsBannerTransition(true),
    );
    return () => window.cancelAnimationFrame(frameId);
  }, [isBannerTransition]);

  const handleBannerTransitionEnd = () => {
    if (bannerSlides.length <= 1) return;
    if (currentBanner === bannerSlides.length) {
      setIsBannerTransition(false);
      setCurrentBanner(0);
    }
  };

  const handlePrevBanner = () => {
    setCurrentBanner(
      (prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length,
    );
  };

  const handleNextBanner = () => {
    setCurrentBanner((prev) => prev + 1);
  };

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get("category") || "",
    }));
  }, [searchParams]);

  useEffect(() => {
    const stateSearch = location.state?.search;
    if (typeof stateSearch !== "string") {
      return;
    }

    setFilters((prev) => ({
      ...prev,
      search: stateSearch,
    }));

    navigate(location.pathname + location.search, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, location.state, navigate]);

  const filteredProducts = products.filter((product) => {
    const searchValue = filters.search.trim().toLowerCase();
    const matchesCategory =
      !filters.category || product.category === filters.category;
    const matchesSearch =
      !searchValue || product.name.toLowerCase().startsWith(searchValue);

    let matchesPrice = true;
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      matchesPrice = max
        ? product.price >= min && product.price <= max
        : product.price >= min;
    }

    return matchesCategory && matchesSearch && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return (b.averageRating || 0) - (a.averageRating || 0);
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (status === "loading") {
    return <Loader />;
  }

  if (status === "failed") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>Error loading products: {error}</p>
          <button
            onClick={() => dispatch(fetchProducts())}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative mb-8 overflow-hidden">
        <div className="relative h-[220px] sm:h-[280px] lg:h-[340px]">
          <div
            className={`flex h-full ${
              isBannerTransition
                ? "transition-transform duration-700 ease-in-out"
                : ""
            }`}
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            onTransitionEnd={handleBannerTransitionEnd}
          >
            {loopedBannerSlides.map((banner, index) => (
              <div
                key={`${banner._id}-${index}`}
                className="relative h-full min-w-full"
              >
                <img
                  src={banner.image}
                  alt="Products banner"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          {bannerSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevBanner}
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow transition hover:bg-white"
                aria-label="Previous products banner"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                onClick={handleNextBanner}
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow transition hover:bg-white"
                aria-label="Next products banner"
              >
                <FaChevronRight />
              </button>

              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
                {bannerSlides.map((banner, index) => (
                  <button
                    key={banner._id}
                    type="button"
                    onClick={() => setCurrentBanner(index)}
                    className={`h-2.5 w-2.5 rounded-full border border-white/70 transition ${
                      index === currentBanner % bannerSlides.length
                        ? "bg-[#68a300]"
                        : "bg-white/80"
                    }`}
                    aria-label={`Go to products banner ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option
                      key={category._id || category.value}
                      value={category.value}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) =>
                    handleFilterChange("priceRange", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Prices</option>
                  <option value="0-25">$0 - $25</option>
                  <option value="25-50">$25 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100">$100+</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="name">Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Rating</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-gray-600">
              {sortedProducts.length} products found
            </p>
          </div>

          {/* Products Grid */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No products found matching your criteria.
              </p>
              <button
                onClick={() =>
                  setFilters({
                    category: "",
                    priceRange: "",
                    search: "",
                    sortBy: "name",
                  })
                }
                className="mt-4 bg-[#68a300] text-white px-4 py-2 rounded hover:bg-[#5f9600]"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
