import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectAuthUser,
  selectIsAuthenticated,
  updateProfile,
  selectAuthIsLoading,
  selectAuthError,
  logout,
} from "../store/slices/authSlice";
import { selectOrders, getMyOrders } from "../store/slices/orderSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import {
  FaUser,
  FaShoppingBag,
  FaHeart,
  FaCog,
  FaSignOutAlt,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthIsLoading);
  const authError = useSelector(selectAuthError);
  const userOrders = useSelector(selectOrders);

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
          country: user.address?.country || "",
        },
      });
    }

    if (activeTab === "orders") {
      dispatch(getMyOrders());
    }
  }, [isAuthenticated, navigate, user, activeTab, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error || "Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original user data
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
          country: user.address?.country || "",
        },
      });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (!user) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUser className="text-green-600 text-2xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {user.name}
                </h2>
                <p className="text-gray-600">{user.email}</p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                    activeTab === "profile"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FaUser />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                    activeTab === "orders"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FaShoppingBag />
                  <span>Orders</span>
                </button>

                <button
                  onClick={() => setActiveTab("wishlist")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                    activeTab === "wishlist"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FaHeart />
                  <span>Wishlist</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                    activeTab === "settings"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FaCog />
                  <span>Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800">
                    Profile Information
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        <FaSave />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                      >
                        <FaTimes />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                {authError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                    {authError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">
                      Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          name="address.zipCode"
                          value={formData.address.zipCode}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          name="address.country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-800">
                  Order History
                </h3>

                {userOrders.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <FaShoppingBag className="mx-auto text-4xl text-gray-300 mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      No orders yet
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Start shopping to see your order history here.
                    </p>
                    <button
                      onClick={() => navigate("/products")}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  userOrders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-white rounded-lg shadow-md p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold">
                            Order #{order._id.slice(-8)}
                          </h4>
                          <p className="text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.orderItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-4"
                          >
                            <img
                              src={
                                item.product?.images?.[0] ||
                                "/placeholder-product.jpg"
                              }
                              alt={item.product?.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.product?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity} × $
                                {item.price?.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold">
                              ${(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            Total: ${order.totalPrice?.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Payment: {order.paymentMethod}
                          </p>
                        </div>
                        <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                  Wishlist
                </h3>
                <div className="text-center py-12">
                  <FaHeart className="mx-auto text-4xl text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    Your wishlist is empty
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Save items you love for later.
                  </p>
                  <button
                    onClick={() => navigate("/products")}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  >
                    Browse Products
                  </button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                  Account Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium mb-4">
                      Change Password
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="password"
                        placeholder="Current password"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-lg font-medium mb-4 text-red-600">
                      Danger Zone
                    </h4>
                    <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                      Delete Account
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      This action cannot be undone. All your data will be
                      permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
