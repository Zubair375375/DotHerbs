import { Link } from "react-router-dom";
import { MdEco, MdShield, MdLocalShipping, MdFavorite } from "react-icons/md";

const Home = () => {
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
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="text-center max-w-5xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">
            Natural Healing <span className="text-green-600">Starts Here</span>
          </h1>

          <p className="text-gray-600 mb-8">
            Premium herbal products for a healthier lifestyle.
          </p>

          <Link
            to="/products"
            className="bg-green-600 text-white px-6 py-3 rounded-lg"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white grid grid-cols-1 md:grid-cols-4 gap-8 text-center px-6">
        <div>
          <MdEco className="text-3xl mx-auto text-green-600" />
          <h3>100% Organic</h3>
        </div>

        <div>
          <MdShield className="text-3xl mx-auto text-green-600" />
          <h3>Quality Assured</h3>
        </div>

        <div>
          <MdLocalShipping className="text-3xl mx-auto text-green-600" />
          <h3>Fast Shipping</h3>
        </div>

        <div>
          <MdFavorite className="text-3xl mx-auto text-green-600" />
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
                className="text-green-600 mt-2 block"
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
