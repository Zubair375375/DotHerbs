import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  //   fetchProductById,
  selectProduct,
  selectProductsStatus,
  selectProductsError,
  fetchProduct,
} from "../store/slices/productSlice";
import { addToCart } from "../store/slices/cartSlice";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../store/slices/authSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import {
  FaStar,
  FaRegStar,
  FaShoppingCart,
  FaHeart,
  FaShare,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const product = useSelector(selectProduct);
  const status = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);
  const isAdmin = user?.role === "admin";

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [expandedSection, setExpandedSection] = useState("ingredients");
  const [ingredientsTab, setIngredientsTab] = useState("ingredients");

  const directionsPoints =
    Array.isArray(product?.directions) && product.directions.length > 0
      ? product.directions
      : [];
  const briefDescriptionPoints = Array.isArray(product?.briefDescriptionPoints)
    ? product.briefDescriptionPoints
        .map((point) => String(point).trim())
        .filter(Boolean)
    : (product?.briefDescription || "")
        .split(/\r?\n/)
        .map((point) => point.trim())
        .filter(Boolean);

  const helpsToPoints = (product?.helpsTo || "")
    .split(/\r?\n/)
    .map((point) => point.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  const ingredientsRows = Array.isArray(product?.ingredients)
    ? product.ingredients
        .map((item) => ({
          name: String(item?.name || "").trim(),
          amount: String(item?.amount || "").trim(),
        }))
        .filter((item) => item.name || item.amount)
    : [];

  const servingSizeText = (product?.servingSize || "").trim();
  const instructionsParagraph = (product?.instructionsContent || "").trim();

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? "" : section));
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (product) {
      setSelectedImage(0);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (isAdmin) {
      toast.error("Admin accounts cannot add products to cart");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    dispatch(
      addToCart({
        product,
        quantity,
      }),
    );

    toast.success(`${product.name} added to cart!`);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300" />);
    }

    return stars;
  };

  if (status === "loading") {
    return <Loader />;
  }

  if (status === "failed") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>Error loading product: {error}</p>
          <button
            onClick={() => dispatch(fetchProduct(id))}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Product not found</p>
          <button
            onClick={() => navigate("/products")}
            className="mt-4 bg-[#68a300] text-white px-4 py-2 rounded hover:bg-[#5f9600]"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={
                product.image
                  ? `http://localhost:5000${product.image}`
                  : product.images?.[selectedImage]?.url ||
                    "/placeholder-product.jpg"
              }
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                    selectedImage === index
                      ? "border-green-500"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={image.url || image || "/placeholder-product.jpg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex">
                {renderStars(product.averageRating || 0)}
              </div>
              <span className="text-gray-600">
                ({product.reviews?.length || 0} reviews)
              </span>
            </div>

            <div className="text-3xl mb-4">${product.price?.toFixed(2)}</div>

            {product.helpsTo && (
              <div className="mb-6 rounded-lg border border-green-100 bg-green-50 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-green-800">
                  Helps To
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-green-900">
                  {helpsToPoints.map((point, index) => (
                    <li key={`${point}-${index}`}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                product.stock > 10
                  ? "bg-green-100 text-green-800"
                  : product.stock > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {product.stock > 10
                ? "In Stock"
                : product.stock > 0
                  ? `Only ${product.stock} left`
                  : "Out of Stock"}
            </span>
          </div>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="flex items-center space-x-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdmin}
              className="flex-1 bg-[#68a300] text-white px-6 py-3 rounded-lg hover:bg-[#5f9600] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FaShoppingCart />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`p-3 rounded-lg border ${
                isWishlisted
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaHeart className={isWishlisted ? "fill-current" : ""} />
            </button>

            <button
              onClick={handleShare}
              className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <FaShare />
            </button>
          </div>

          {/* Product Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Product Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Category:</span>
                <p className="capitalize">{product.category}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">SKU:</span>
                <p>{product.sku || "N/A"}</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                Brief Description
              </h4>
              {briefDescriptionPoints.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                  {briefDescriptionPoints.map((point, index) => (
                    <li key={`brief-point-${index}`}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  {product.description || "N/A"}
                </p>
              )}
            </div>

            {directionsPoints.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Directions
                </h4>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
                  {directionsPoints.map((step, index) => (
                    <li key={`dir-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-6 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => toggleSection("ingredients")}
                className="flex w-full items-center justify-between py-2 text-left"
              >
                <h4 className="text-2xl font-semibold text-gray-800">
                  Ingredients
                </h4>
                {expandedSection === "ingredients" ? (
                  <FaChevronUp className="text-gray-500" />
                ) : (
                  <FaChevronDown className="text-gray-500" />
                )}
              </button>

              {expandedSection === "ingredients" && (
                <div className="mt-3 border border-gray-200 bg-white">
                  <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setIngredientsTab("ingredients")}
                      className={`px-4 py-3 text-center text-sm font-semibold ${
                        ingredientsTab === "ingredients"
                          ? "border-b-2 border-gray-900 text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      Ingredients
                    </button>
                    <button
                      type="button"
                      onClick={() => setIngredientsTab("instructions")}
                      className={`px-4 py-3 text-center text-sm font-semibold ${
                        ingredientsTab === "instructions"
                          ? "border-b-2 border-gray-900 text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      Instructions
                    </button>
                  </div>

                  <div className="px-6 py-5 text-sm text-gray-700">
                    {ingredientsTab === "ingredients" ? (
                      <>
                        {servingSizeText ? (
                          <p className="mb-4 text-center font-medium">
                            Serving Size: {servingSizeText}
                          </p>
                        ) : null}
                        {ingredientsRows.length > 0 ? (
                          <div className="space-y-3">
                            {ingredientsRows.map((row, index) => (
                              <div
                                key={`ingredient-row-${index}`}
                                className="flex items-center justify-between border-b border-gray-100 pb-3"
                              >
                                <span>{row.name || "-"}</span>
                                <span className="font-medium">
                                  {row.amount || "-"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500">
                            Ingredients not added yet.
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2">
                        {instructionsParagraph ? (
                          <p className="whitespace-pre-line leading-6 text-gray-700">
                            {instructionsParagraph}
                          </p>
                        ) : (
                          <p>No instructions added for this product yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleSection("faqs")}
                  className="flex w-full items-center justify-between py-4 text-left"
                >
                  <span className="text-2xl font-semibold text-gray-800">
                    FAQs
                  </span>
                  {expandedSection === "faqs" ? (
                    <FaChevronUp className="text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-500" />
                  )}
                </button>
                {expandedSection === "faqs" && (
                  <div className="pb-4 text-sm text-gray-600">
                    Frequently asked questions will be available soon.
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleSection("reviews")}
                  className="flex w-full items-center justify-between py-4 text-left"
                >
                  <span className="text-2xl font-semibold text-gray-800">
                    Customer Reviews
                  </span>
                  {expandedSection === "reviews" ? (
                    <FaChevronUp className="text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-500" />
                  )}
                </button>
                {expandedSection === "reviews" && (
                  <div className="pb-4">
                    {product.reviews && product.reviews.length > 0 ? (
                      <div className="space-y-4">
                        {product.reviews.slice(0, 3).map((review, index) => (
                          <div
                            key={index}
                            className="border-b border-gray-100 pb-4"
                          >
                            <div className="mb-2 flex items-center space-x-2">
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                              <span className="font-medium">
                                {review.user?.name || "Anonymous"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {review.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No customer reviews yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleSection("quality")}
                  className="flex w-full items-center justify-between py-4 text-left"
                >
                  <span className="text-2xl font-semibold text-gray-800">
                    Our Quality Promise
                  </span>
                  {expandedSection === "quality" ? (
                    <FaChevronUp className="text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-500" />
                  )}
                </button>
                {expandedSection === "quality" && (
                  <div className="pb-4 text-sm text-gray-600">
                    Every batch is produced with strict quality checks for
                    purity, consistency, and safety.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
