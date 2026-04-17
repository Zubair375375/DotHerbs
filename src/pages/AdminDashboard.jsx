import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../store/slices/authSlice";
import {
  fetchCategories,
  fetchProducts,
  selectProducts,
  selectCategories,
  createCategory,
  deleteCategory,
  deleteProduct,
} from "../store/slices/productSlice";
import {
  getOrders,
  selectOrders,
  updateOrderStatus,
} from "../store/slices/orderSlice";
import { getUsers, selectAllUsers } from "../store/slices/userSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import CreateProduct from "./admin/CreateProduct";
import EditProduct from "./admin/EditProduct";
import {
  FaChartLine,
  FaShoppingCart,
  FaUsers,
  FaBox,
  FaDollarSign,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaCheck,
  FaTimes,
  FaBullhorn,
  FaImage,
} from "react-icons/fa";
import {
  fetchAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  selectAllAnnouncements,
} from "../store/slices/announcementSlice";
import {
  fetchAllHeroSlides,
  createHeroSlide,
  deleteHeroSlide,
  selectAllHeroSlides,
} from "../store/slices/heroSlideSlice";
import {
  fetchAllProductBanners,
  createProductBanner,
  deleteProductBanner,
  selectAllProductBanners,
} from "../store/slices/productBannerSlice";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const orders = useSelector(selectOrders);
  const users = useSelector(selectAllUsers);
  const productPagination = useSelector((state) => state.products.pagination);
  const orderPagination = useSelector((state) => state.orders.pagination);
  const userPagination = useSelector((state) => state.users.pagination);
  const heroSlides = useSelector(selectAllHeroSlides);
  const productBanners = useSelector(selectAllProductBanners);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState(null);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [productBannerForm, setProductBannerForm] = useState({
    displayOrder: 0,
  });
  const [productBannerImageFile, setProductBannerImageFile] = useState(null);
  const [productBannerImagePreview, setProductBannerImagePreview] =
    useState(null);
  const [uploadingProductBannerImage, setUploadingProductBannerImage] =
    useState(false);
  const [heroForm, setHeroForm] = useState({
    displayOrder: 0,
  });
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "info",
    isActive: true,
    startDate: "",
    endDate: "",
  });
  const announcements = useSelector(selectAllAnnouncements);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Admin privileges required.");
      return;
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      // Prefetch core dashboard datasets so overview and stat cards are accurate immediately.
      dispatch(fetchProducts({ page: 1, limit: 200 }));
      dispatch(fetchCategories());
      dispatch(getOrders({ page: 1, limit: 200 }));
      dispatch(getUsers({ page: 1, limit: 200 }));
      dispatch(fetchAllAnnouncements());
      dispatch(fetchAllHeroSlides());
      dispatch(fetchAllProductBanners());
    }
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    if (!(isAuthenticated && user?.role === "admin")) return;

    if (activeTab === "products") {
      dispatch(fetchProducts({ page: 1, limit: 200 }));
      dispatch(fetchAllProductBanners());
    } else if (activeTab === "categories") {
      dispatch(fetchCategories());
    } else if (activeTab === "orders") {
      dispatch(getOrders({ page: 1, limit: 200 }));
    } else if (activeTab === "users") {
      dispatch(getUsers({ page: 1, limit: 200 }));
    } else if (activeTab === "announcements") {
      dispatch(fetchAllAnnouncements());
    } else if (activeTab === "hero") {
      dispatch(fetchAllHeroSlides());
    }
  }, [activeTab, dispatch, isAuthenticated, user]);

  const uploadDashboardImage = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);
    const rawToken = localStorage.getItem("accessToken");
    const token = rawToken ? JSON.parse(rawToken) : null;
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      },
    );

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const result = await response.json();
    return result.data.url;
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(productId)).unwrap();
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditProductModal(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      let imageUrl = "";
      if (categoryImageFile) {
        setUploadingCategoryImage(true);
        const formDataUpload = new FormData();
        formDataUpload.append("image", categoryImageFile);
        const rawToken = localStorage.getItem("accessToken");
        const token = rawToken ? JSON.parse(rawToken) : null;
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataUpload,
          },
        );
        if (!response.ok) throw new Error("Failed to upload image");
        const result = await response.json();
        imageUrl = result.data.url;
        setUploadingCategoryImage(false);
      }
      await dispatch(
        createCategory({ ...categoryForm, image: imageUrl }),
      ).unwrap();
      setCategoryForm({ name: "", description: "" });
      setCategoryImageFile(null);
      setCategoryImagePreview(null);
      toast.success("Category created successfully");
    } catch (error) {
      setUploadingCategoryImage(false);
      toast.error(error || "Failed to create category");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    try {
      await dispatch(deleteCategory(categoryId)).unwrap();
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error(error || "Failed to delete category");
    }
  };

  const handleCreateHeroSlide = async (e) => {
    e.preventDefault();

    if (!heroImageFile) {
      toast.error("Hero image is required");
      return;
    }

    try {
      setUploadingHeroImage(true);
      const imageUrl = await uploadDashboardImage(heroImageFile);
      await dispatch(
        createHeroSlide({
          image: imageUrl,
          displayOrder: Number(heroForm.displayOrder || 0),
        }),
      ).unwrap();
      setHeroForm({ displayOrder: 0 });
      setHeroImageFile(null);
      setHeroImagePreview(null);
      toast.success("Hero slide created successfully");
    } catch (error) {
      toast.error(error || "Failed to create hero slide");
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleCreateProductBanner = async (e) => {
    e.preventDefault();

    if (!productBannerImageFile) {
      toast.error("Banner image is required");
      return;
    }

    try {
      setUploadingProductBannerImage(true);
      const imageUrl = await uploadDashboardImage(productBannerImageFile);
      await dispatch(
        createProductBanner({
          image: imageUrl,
          displayOrder: Number(productBannerForm.displayOrder || 0),
        }),
      ).unwrap();
      setProductBannerForm({ displayOrder: 0 });
      setProductBannerImageFile(null);
      setProductBannerImagePreview(null);
      toast.success("Products banner created successfully");
    } catch (error) {
      toast.error(error || "Failed to create products banner");
    } finally {
      setUploadingProductBannerImage(false);
    }
  };

  const handleDeleteProductBanner = async (bannerId) => {
    if (!window.confirm("Delete this products banner?")) {
      return;
    }

    try {
      await dispatch(deleteProductBanner(bannerId)).unwrap();
      toast.success("Products banner deleted successfully");
    } catch (error) {
      toast.error(error || "Failed to delete products banner");
    }
  };

  const handleDeleteHeroSlide = async (slideId) => {
    if (!window.confirm("Delete this hero slide?")) {
      return;
    }

    try {
      await dispatch(deleteHeroSlide(slideId)).unwrap();
      toast.success("Hero slide deleted successfully");
    } catch (error) {
      toast.error(error || "Failed to delete hero slide");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await dispatch(
        updateOrderStatus({ id: orderId, status: newStatus }),
      ).unwrap();
      toast.success("Order status updated");
    } catch (error) {
      toast.error("Failed to update order status");
    }
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

  // Calculate dashboard stats
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.total || 0),
    0,
  );
  const totalOrders = orderPagination?.total || orders?.length || 0;
  const totalProducts = productPagination?.total || products?.length || 0;
  const totalUsers = userPagination?.total || users?.length || 0;

  if (!isAuthenticated || user?.role !== "admin") {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Manage your e-commerce platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FaShoppingCart className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FaBox className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <FaUsers className="text-orange-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 border-t-0 border-l-0 border-r-0 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`py-4 px-1 border-b-2 border-t-0 border-l-0 border-r-0 font-medium text-sm ${
                activeTab === "products"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-4 px-1 border-b-2 border-t-0 border-l-0 border-r-0 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 border-t-0 border-l-0 border-r-0 font-medium text-sm ${
                activeTab === "users"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-4 px-1 border-b-2 border-t-0 border-l-0 border-r-0 font-medium text-sm ${
                activeTab === "categories"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab("hero")}
              className={`py-4 px-1 border-b-2 border-t-0 border-l-0 border-r-0 font-medium text-sm ${
                activeTab === "hero"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Hero
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`py-4 px-1 border-b-2 border-t-0 border-l-0 border-r-0 font-medium text-sm ${
                activeTab === "announcements"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Announcements
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Dashboard Overview</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Orders */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center justify-between p-4 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          Order #{order._id.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.user?.name} - ${order.total?.toFixed(2)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getOrderStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Stock Products */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Low Stock Alert</h3>
                <div className="space-y-4">
                  {products
                    .filter((product) => product.stock < 10)
                    .slice(0, 5)
                    .map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center justify-between p-4 border rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              product.image
                                ? `http://localhost:5000${product.image}`
                                : product.images?.[0]?.url ||
                                  product.images?.[0] ||
                                  "/placeholder-product.jpg"
                            }
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-red-600">
                              Only {product.stock} left
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Product Management</h2>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="bg-[#68a300] text-white px-4 py-2 rounded hover:bg-[#5f9600] flex items-center space-x-2"
              >
                <FaPlus />
                <span>Add Product</span>
              </button>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-[360px,1fr]">
              <div className="rounded-lg border bg-gray-50 p-5">
                <h3 className="mb-4 text-xl font-semibold">Products Page Banners</h3>
                <form className="space-y-4" onSubmit={handleCreateProductBanner}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Banner Image
                    </label>
                    {productBannerImagePreview && (
                      <img
                        src={productBannerImagePreview}
                        alt="Products banner preview"
                        className="mb-3 h-32 w-full rounded-lg object-cover"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) {
                          return;
                        }

                        setProductBannerImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (event) =>
                          setProductBannerImagePreview(event.target.result);
                        reader.readAsDataURL(file);
                      }}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={productBannerForm.displayOrder}
                      onChange={(e) =>
                        setProductBannerForm((prev) => ({
                          ...prev,
                          displayOrder: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      min="0"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingProductBannerImage}
                    className="flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                  >
                    <FaPlus />
                    <span>
                      {uploadingProductBannerImage
                        ? "Uploading..."
                        : "Add Banner"}
                    </span>
                  </button>
                </form>
              </div>

              <div>
                <h3 className="mb-4 text-xl font-semibold">Existing Banners</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {productBanners.map((banner) => (
                    <div
                      key={banner._id}
                      className="overflow-hidden rounded-xl border bg-white shadow-sm"
                    >
                      <img
                        src={`http://localhost:5000${banner.image}`}
                        alt="Products banner"
                        className="h-32 w-full object-cover"
                      />
                      <div className="flex items-center justify-between p-3">
                        <p className="text-sm text-gray-500">
                          Order: {banner.displayOrder || 0}
                        </p>
                        <button
                          onClick={() => handleDeleteProductBanner(banner._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}

                  {productBanners.length === 0 && (
                    <div className="rounded-xl border border-dashed p-8 text-center text-gray-400 md:col-span-2 xl:col-span-3">
                      No products banners yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={
                              product.image
                                ? `http://localhost:5000${product.image}`
                                : product.images?.[0]?.url ||
                                  product.images?.[0] ||
                                  "/placeholder-product.jpg"
                            }
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {product.category}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${product.price?.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            product.stock > 10
                              ? "bg-green-100 text-green-800"
                              : product.stock > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-8">
              <div className="border rounded-lg p-5 bg-gray-50">
                <h2 className="text-2xl font-semibold mb-4">Add Category</h2>
                <form className="space-y-4" onSubmit={handleCreateCategory}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="e.g. Skincare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Optional short description for the home page"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Image
                    </label>
                    {categoryImagePreview && (
                      <img
                        src={categoryImagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-full border-2 border-[#68a300] mb-2"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setCategoryImageFile(file);
                          const reader = new FileReader();
                          reader.onload = (ev) =>
                            setCategoryImagePreview(ev.target.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingCategoryImage}
                    className="bg-[#68a300] text-white px-4 py-2 rounded hover:bg-[#5f9600] flex items-center space-x-2 disabled:opacity-60"
                  >
                    <FaPlus />
                    <span>
                      {uploadingCategoryImage ? "Uploading..." : "Add Category"}
                    </span>
                  </button>
                </form>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-6">
                  Category Management
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Image
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categories.map((category) => (
                        <tr key={category._id || category.value}>
                          <td className="px-4 py-4">
                            {category.image ? (
                              <img
                                src={`http://localhost:5000${category.image}`}
                                alt={category.name}
                                className="w-10 h-10 object-cover rounded-full border border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-200">
                                N/A
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {category.name}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {category.value}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {category.description || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium">
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Order Management</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.slice(-8)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user?.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${order.total?.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(order._id, e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/admin/orders/${order._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">User Management</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userData) => (
                    <tr key={userData._id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {userData.name}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userData.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            userData.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {userData.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/users/${userData._id}`)
                          }
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hero Tab */}
        {activeTab === "hero" && (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px,1fr]">
              <div className="rounded-lg border bg-gray-50 p-5">
                <h2 className="mb-4 text-2xl font-semibold">Add Hero Slide</h2>
                <form className="space-y-4" onSubmit={handleCreateHeroSlide}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Hero Image
                    </label>
                    {heroImagePreview && (
                      <img
                        src={heroImagePreview}
                        alt="Hero preview"
                        className="mb-3 h-40 w-full rounded-lg object-cover"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) {
                          return;
                        }

                        setHeroImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (event) =>
                          setHeroImagePreview(event.target.result);
                        reader.readAsDataURL(file);
                      }}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={heroForm.displayOrder}
                      onChange={(e) =>
                        setHeroForm((prev) => ({
                          ...prev,
                          displayOrder: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      min="0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingHeroImage}
                    className="flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                  >
                    <FaPlus />
                    <span>
                      {uploadingHeroImage ? "Uploading..." : "Add Hero Slide"}
                    </span>
                  </button>
                </form>
              </div>

              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Hero Slides</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FaImage />
                    <span>{heroSlides.length} slides</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {heroSlides.map((slide) => (
                    <div
                      key={slide._id}
                      className="overflow-hidden rounded-xl border bg-white shadow-sm"
                    >
                      <img
                        src={`http://localhost:5000${slide.image}`}
                        alt="Hero slide"
                        className="h-44 w-full object-cover"
                      />
                      <div className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Order: {slide.displayOrder || 0}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteHeroSlide(slide._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {heroSlides.length === 0 && (
                    <div className="rounded-xl border border-dashed p-8 text-center text-gray-400 md:col-span-2 xl:col-span-3">
                      No hero slides yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Announcements</h2>
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setAnnouncementForm({
                    title: "",
                    message: "",
                    type: "info",
                    isActive: true,
                    startDate: "",
                    endDate: "",
                  });
                  setShowAnnouncementModal(true);
                }}
                className="bg-[#68a300] text-white px-4 py-2 rounded hover:bg-[#5f9600] flex items-center space-x-2"
              >
                <FaPlus />
                <span>New Announcement</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Message
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Expires
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {announcements.map((ann) => (
                    <tr key={ann._id}>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {ann.title}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {ann.message}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded capitalize ${
                            ann.type === "promo"
                              ? "bg-green-100 text-green-800"
                              : ann.type === "warning"
                                ? "bg-yellow-100 text-yellow-800"
                                : ann.type === "success"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {ann.type}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded ${ann.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {ann.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {ann.endDate
                          ? new Date(ann.endDate).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium space-x-3">
                        <button
                          onClick={() => {
                            setEditingAnnouncement(ann);
                            setAnnouncementForm({
                              title: ann.title,
                              message: ann.message,
                              type: ann.type,
                              isActive: ann.isActive,
                              startDate: ann.startDate
                                ? ann.startDate.slice(0, 10)
                                : "",
                              endDate: ann.endDate
                                ? ann.endDate.slice(0, 10)
                                : "",
                            });
                            setShowAnnouncementModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm("Delete this announcement?")) {
                              try {
                                await dispatch(
                                  deleteAnnouncement(ann._id),
                                ).unwrap();
                                toast.success("Announcement deleted");
                              } catch {
                                toast.error("Failed to delete announcement");
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {announcements.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        No announcements yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <form
              className="p-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload = {
                    ...announcementForm,
                    startDate: announcementForm.startDate || undefined,
                    endDate: announcementForm.endDate || null,
                  };
                  if (editingAnnouncement) {
                    await dispatch(
                      updateAnnouncement({
                        id: editingAnnouncement._id,
                        data: payload,
                      }),
                    ).unwrap();
                    toast.success("Announcement updated");
                  } else {
                    await dispatch(createAnnouncement(payload)).unwrap();
                    toast.success("Announcement created");
                  }
                  setShowAnnouncementModal(false);
                  dispatch(fetchAllAnnouncements());
                } catch {
                  toast.error("Failed to save announcement");
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm((f) => ({
                      ...f,
                      title: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  required
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm((f) => ({
                      ...f,
                      message: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={announcementForm.type}
                    onChange={(e) =>
                      setAnnouncementForm((f) => ({
                        ...f,
                        type: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="promo">Promo</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementForm.isActive}
                      onChange={(e) =>
                        setAnnouncementForm((f) => ({
                          ...f,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#68a300]"
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={announcementForm.startDate}
                    onChange={(e) =>
                      setAnnouncementForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={announcementForm.endDate}
                    onChange={(e) =>
                      setAnnouncementForm((f) => ({
                        ...f,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-[#68a300] text-white rounded hover:bg-[#5f9600]"
                >
                  {editingAnnouncement ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Product
              </h2>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CreateProduct
                onClose={() => setShowAddProductModal(false)}
                onSuccess={() => {
                  setShowAddProductModal(false);
                  dispatch(fetchProducts()); // Refresh products list
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Product
              </h2>
              <button
                onClick={() => {
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EditProduct
                product={editingProduct}
                onClose={() => {
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                }}
                onSuccess={() => {
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                  dispatch(fetchProducts()); // Refresh products list
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
