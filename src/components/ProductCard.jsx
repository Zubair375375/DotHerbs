import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import toast from "react-hot-toast";
import { MdStar, MdShoppingCart } from "react-icons/md";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0) {
      toast.error("Product is out of stock");
      return;
    }

    dispatch(addToCart({ product, quantity: 1 }));
    toast.success("Added to cart!");
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <MdStar
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-secondary-300"
        }`}
      />
    ));
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="group bg-white rounded-lg shadow-soft overflow-hidden hover:shadow-large transition-shadow duration-300"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={
            product.image
              ? `http://localhost:5000${product.image}`
              : product.images?.[0]?.url ||
                product.images?.[0] ||
                "/placeholder-product.jpg"
          }
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center mb-2">
          <div className="flex items-center">{renderStars(product.rating)}</div>
          <span className="text-sm text-secondary-600 ml-2">
            ({product.numReviews})
          </span>
        </div>

        <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-lg">
            <span className="text-xs align-super mr-1 text-black-100">PKR</span>
            {product.price.toFixed(2)}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex items-center gap-2 bg-white text-[#68a300] py-1 px-3 rounded-sm border border-[#68a300] hover:border-[#68a300] hover:bg-[#68a300] hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Add to cart"
          >
            Add To Cart
            {/* <MdShoppingCart className="w-4 h-4" /> */}
          </button>
        </div>

        {product.stock === 0 && (
          <p className="text-accent-600 text-sm mt-2">Out of stock</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
