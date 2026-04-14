import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  createProduct,
  selectProductsStatus,
  selectProductsError,
} from "../../store/slices/productSlice";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";

const categories = [
  { value: "herbs", label: "Herbs" },
  { value: "teas", label: "Teas" },
  { value: "oils", label: "Oils" },
  { value: "supplements", label: "Supplements" },
  { value: "other", label: "Other" },
];

const CreateProduct = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "herbs",
    stock: "0",
    image: null,
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log(
      "CreateProduct useEffect - isAuthenticated:",
      isAuthenticated,
      "user:",
      user,
    );
    if (!isAuthenticated || user?.role !== "admin") {
      console.log("User not authenticated or not admin, closing modal");
      onClose();
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAuthenticated, user, onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    // Token is stored JSON-stringified, so parse it before use
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
    return result.data; // { url: "/uploads/filename", public_id: "filename" }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, description, price, category, stock, image, isActive } =
      formData;

    // Frontend validation matching backend requirements
    if (!name || name.trim().length < 2 || name.length > 100) {
      toast.error("Product name must be between 2 and 100 characters.");
      return;
    }

    if (
      !description ||
      description.trim().length < 10 ||
      description.length > 1000
    ) {
      toast.error("Description must be between 10 and 1000 characters.");
      return;
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum < 0) {
      toast.error("Price must be a positive number.");
      return;
    }

    if (
      !category ||
      !["herbs", "teas", "oils", "supplements", "other"].includes(category)
    ) {
      toast.error("Please select a valid category.");
      return;
    }

    const stockNum = parseInt(stock);
    if (stock === "" || isNaN(stockNum) || stockNum < 0) {
      toast.error("Stock must be a non-negative integer.");
      return;
    }

    console.log("Validation passed, proceeding with product creation");

    try {
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        stock: Number(stock),
        isActive,
        image: "",
        images: [],
      };

      if (image) {
        setUploading(true);
        toast.loading("Uploading image...", { id: "upload" });
        try {
          const imageData = await uploadImage(image);
          productData.image = imageData.url; // e.g. "/uploads/abc.jpg"
          productData.images = [imageData];
          toast.success("Image uploaded", { id: "upload" });
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error("Image upload failed, product saved without image", {
            id: "upload",
          });
        } finally {
          setUploading(false);
        }
      }

      await dispatch(createProduct(productData)).unwrap();
      toast.success("Product created successfully.");
      onSuccess();
    } catch (err) {
      console.error("Product creation failed:", err);
      setUploading(false);
      toast.error(err || "Failed to create product.");
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Product Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Example: Lavender Oil"
              required
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              required
            >
              {categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700"
            >
              Stock Quantity
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700"
          >
            Product Image
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <p className="mt-2 text-sm text-gray-500">
            Upload a product image (max 5MB, JPG, PNG, GIF).
          </p>
          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="Describe the product features, benefits, and usage."
            required
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active product</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || uploading}
            className="inline-flex items-center px-6 py-2 rounded-md bg-[#68a300] text-white text-sm font-medium hover:bg-[#5f9600] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? "Uploading..."
              : isLoading
                ? "Saving..."
                : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
