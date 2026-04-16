import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdEco, MdShield, MdLocalShipping, MdFavorite } from "react-icons/md";
import {
  FaLeaf,
  FaMugHot,
  FaCapsules,
  FaOilCan,
  FaSeedling,
} from "react-icons/fa";
import {
  fetchCategories,
  selectCategories,
} from "../store/slices/productSlice";

const Home = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);

  useEffect(() => {
    dispatch(fetchCategories({ force: true }));
  }, [dispatch]);

  const categoryMeta = {
    herbs: {
      icon: <FaLeaf className="text-3xl text-[#68a300]" />,
      description: "Whole herbs and botanical essentials",
    },
    teas: {
      icon: <FaMugHot className="text-3xl text-[#68a300]" />,
      description: "Comforting blends for daily wellness",
    },
    supplements: {
      icon: <FaCapsules className="text-3xl text-[#68a300]" />,
      description: "Targeted support for your routine",
    },
    oils: {
      icon: <FaOilCan className="text-3xl text-[#68a300]" />,
      description: "Pure oils with therapeutic benefits",
    },
    other: {
      icon: <FaSeedling className="text-3xl text-[#68a300]" />,
      description: "Special wellness picks and more",
    },
  };

  const featuredProducts = [
    {
      _id: "1",
      name: "Organic Turmeric Powder",
      price: 12.99,
      images: ["/placeholder-product.jpg"],
      averageRating: 4.5,
    },
    {
      _id: "2",
      name: "Green Tea Leaves",
      price: 8.99,
      images: ["/placeholder-product.jpg"],
      averageRating: 4.2,
    },
    {
      _id: "3",
      name: "Lavender Essential Oil",
      price: 15.99,
      images: ["/placeholder-product.jpg"],
      averageRating: 4.8,
    },
    {
      _id: "4",
      name: "Ginger Root Powder",
      price: 9.99,
      images: ["/placeholder-product.jpg"],
      averageRating: 4.3,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative h-[550px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: "url('/images/banners/hero_banner1.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>

        <div className="relative text-center max-w-5xl mx-auto px-4 text-white">
          <h1 className="text-5xl font-bold mb-6">
            Pure Health <span className="text-[#68a300]">Pure Life</span>
          </h1>

          <p className="mb-8">
            Premium herbal products for a healthier lifestyle.
          </p>

          <Link
            to="/products"
            className="bg-[#68a300] text-white px-6 py-3 rounded-lg"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#68a300] font-semibold uppercase tracking-[0.2em] text-sm mb-3">
              Shop by Category
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Herbal Choice For Your Health
            </h2>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,220px))] justify-center gap-5">
            {categories.map((category) => {
              const meta = categoryMeta[category.value] || {
                icon: <FaSeedling className="text-3xl text-[#68a300]" />,
                description:
                  category.description || "Explore curated wellness essentials",
              };

              return (
                <Link
                  key={category.value}
                  to={`/products?category=${category.value}`}
                  className="group rounded-2xl border border-gray-200 bg-[#f9fcf3] p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#68a300] hover:shadow-md"
                >
                  <div className="mx-auto mb-4 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-2 ring-[#68a300]/20 transition-all group-hover:ring-[#68a300]/50">
                    {category.image ? (
                      <img
                        src={`http://localhost:5000${category.image}`}
                        alt={category.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      meta.icon
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-6">
                    {category.description || meta.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white grid grid-cols-1 md:grid-cols-4 gap-8 text-center px-6">
        <div>
          <MdEco className="text-3xl mx-auto text-[#68a300]" />
          <h3>100% Organic</h3>
        </div>

        <div>
          <MdShield className="text-3xl mx-auto text-[#68a300]" />
          <h3>Quality Assured</h3>
        </div>

        <div>
          <MdLocalShipping className="text-3xl mx-auto text-[#68a300]" />
          <h3>Fast Shipping</h3>
        </div>

        <div>
          <MdFavorite className="text-3xl mx-auto text-[#68a300]" />
          <h3>Customer Care</h3>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 bg-gray-50 px-6">
        <h2 className="text-center text-3xl mb-10">Featured Products</h2>

        <div className="grid md:grid-cols-4 gap-6">
          {featuredProducts.map((p) => (
            <div key={p._id} className="bg-white p-4 rounded shadow">
              <img
                src={p.images[0]}
                alt={p.name}
                className="w-full h-40 object-cover"
              />

              <h3 className="mt-2 font-bold">{p.name}</h3>
              <p>${p.price}</p>

              <Link
                to={`/products/${p._id}`}
                className="text-[#68a300] mt-2 block"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
