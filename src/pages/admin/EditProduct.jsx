import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchProduct,
  fetchCategories,
  updateProduct,
  selectCategories,
  selectProduct,
  selectProductsStatus,
  selectProductsError,
  clearProduct,
} from "../../store/slices/productSlice";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";

const EditProduct = ({ onClose, onSuccess, product: productProp }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const product = productProp || useSelector(selectProduct);
  const isLoading = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);
  const categories = useSelector(selectCategories);
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    briefDescriptionPoints: [""],
    helpsTo: "",
    price: "",
    costPrice: "",
    category: "",
    sku: "",
    stock: "0",
    image: null,
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const descriptionWordCount = formData.description
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      if (onClose) {
        onClose();
      } else {
        navigate("/");
      }
      toast.error("Access denied. Admin privileges required.");
      return;
    }

    dispatch(fetchCategories());

    // If product is passed as prop (modal usage), use it directly
    // Otherwise fetch by id for standalone page usage
    if (!productProp && id) {
      dispatch(fetchProduct(id));
    }

    // Clear product state when component unmounts (only for standalone page)
    return () => {
      if (!productProp) {
        dispatch(clearProduct());
      }
    };
  }, [isAuthenticated, user, id, dispatch, navigate, onClose, productProp]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        briefDescriptionPoints:
          Array.isArray(product.briefDescriptionPoints) &&
          product.briefDescriptionPoints.length > 0
            ? product.briefDescriptionPoints
            : product.briefDescription
              ? String(product.briefDescription)
                  .split(/\r?\n/)
                  .map((point) => point.trim())
                  .filter(Boolean)
              : [""],
        helpsTo: product.helpsTo || "",
        price: product.price?.toString() || "",
        costPrice: product.costPrice?.toString() || "",
        category: product.category || categories[0]?.value || "",
        sku: product.sku || "",
        stock: product.stock?.toString() || "0",
        image: null, // Don't set image file, just use existing URL for preview
        isActive: product.isActive ?? true,
      });
      // Set image preview from existing product image
      if (product.images?.[0]?.url || product.images?.[0]) {
        setImagePreview(product.images[0].url || product.images[0]);
      }
    }
  }, [categories, product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBriefPointChange = (index, value) => {
    setFormData((prev) => {
      const updatedPoints = [...prev.briefDescriptionPoints];
      updatedPoints[index] = value;
      return { ...prev, briefDescriptionPoints: updatedPoints };
    });
  };

  const addBriefPoint = () => {
    setFormData((prev) => ({
      ...prev,
      briefDescriptionPoints: [...prev.briefDescriptionPoints, ""],
    }));
  };

  const removeBriefPoint = (index) => {
    setFormData((prev) => {
      if (prev.briefDescriptionPoints.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        briefDescriptionPoints: prev.briefDescriptionPoints.filter(
          (_, i) => i !== index,
        ),
      };
    });
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

    const {
      name,
      description,
      briefDescriptionPoints,
      helpsTo,
      price,
      costPrice,
      category,
      sku,
      stock,
      image,
      isActive,
    } = formData;

    if (
      !name ||
      !description ||
      !price ||
      !costPrice ||
      !category ||
      !sku ||
      stock === ""
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const costPriceNum = parseFloat(costPrice);
    if (Number.isNaN(costPriceNum) || costPriceNum < 0) {
      toast.error("Cost price must be a positive number.");
      return;
    }

    const normalizedSku = sku.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,64}$/.test(normalizedSku)) {
      toast.error(
        "SKU must be 3-64 characters and use letters, numbers, hyphen, or underscore.",
      );
      return;
    }

    if (description.trim().split(/\s+/).filter(Boolean).length > 50) {
      toast.error("Product preview description must be 50 words or fewer.");
      return;
    }

    const normalizedBriefPoints = (briefDescriptionPoints || [])
      .map((point) => point.trim())
      .filter(Boolean);

    if (normalizedBriefPoints.length === 0) {
      toast.error("Please add at least one brief description point.");
      return;
    }

    if (normalizedBriefPoints.some((point) => point.length > 300)) {
      toast.error("Each brief description point must be 300 characters or fewer.");
      return;
    }

    if ((helpsTo || "").trim().length > 600) {
      toast.error("Helps to content cannot be more than 600 characters.");
      return;
    }

    try {
      let finalImages = product?.images || [];
      let finalImage = product?.image || "";

      if (image) {
        setUploading(true);
        toast.loading("Uploading image...", { id: "upload" });
        try {
          const imageData = await uploadImage(image);
          toast.success("Image uploaded successfully", { id: "upload" });
          finalImage = imageData.url;
          finalImages = [imageData];
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error(
            "Image upload failed, product will be updated without new image",
            {
              id: "upload",
            },
          );
        } finally {
          setUploading(false);
        }
      }

      const productData = {
        name,
        description,
        briefDescription: normalizedBriefPoints.join("\n"),
        briefDescriptionPoints: normalizedBriefPoints,
        helpsTo: helpsTo.trim(),
        price: Number(price),
        costPrice: Number(costPrice),
        category,
        sku: normalizedSku,
        stock: Number(stock),
        isActive,
        image: finalImage,
        images: finalImages,
      };

      const productId = productProp?._id || id;
      await dispatch(updateProduct({ id: productId, productData })).unwrap();
      toast.success("Product updated successfully.");
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/admin");
      }
    } catch (err) {
      setUploading(false);
      toast.error(err || "Failed to update product.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-2 text-gray-600">
              Update product information and settings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Admin
          </button>
        </div>

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
                  <option key={option._id || option.value} value={option.value}>
                    {option.name}
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
                htmlFor="costPrice"
                className="block text-sm font-medium text-gray-700"
              >
                Cost Price
              </label>
              <input
                id="costPrice"
                name="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
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

            <div>
              <label
                htmlFor="sku"
                className="block text-sm font-medium text-gray-700"
              >
                SKU
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                value={formData.sku}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="e.g. DH-ASH-60"
                minLength={3}
                maxLength={64}
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
              Upload a new product image (max 5MB, JPG, PNG, GIF). Leave empty
              to keep current image.
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
              Description (Products Preview)
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Write a short preview for product listing (max 50 words)."
              required
            />
            <p
              className={`mt-1 text-xs ${
                descriptionWordCount > 50 ? "text-red-600" : "text-gray-500"
              }`}
            >
              This appears in product listing cards. Max 50 words.
              {` (${descriptionWordCount}/50)`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Brief Description Points (Product Detail Page)
            </label>
            <div className="mt-2 space-y-2">
              {formData.briefDescriptionPoints.map((point, index) => (
                <div key={`brief-point-${index}`} className="flex gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleBriefPointChange(index, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder={`Point ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeBriefPoint(index)}
                    disabled={formData.briefDescriptionPoints.length <= 1}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addBriefPoint}
              className="mt-2 rounded-md border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              + Add Point
            </button>
            <p className="mt-1 text-xs text-gray-500">
              Add as many points as needed. Each point can be up to 300 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="helpsTo"
              className="block text-sm font-medium text-gray-700"
            >
              Helps To
            </label>
            <textarea
              id="helpsTo"
              name="helpsTo"
              rows="3"
              value={formData.helpsTo}
              onChange={handleChange}
              maxLength={600}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder={"Enter one point per line, for example:\n- Helps improve immunity\n- Supports digestion\n- Maintains daily energy"}
            />
            <p className="mt-1 text-xs text-gray-500">
              Add benefits as points, one per line (max 600 characters total).
            </p>
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
              onClick={onClose || (() => navigate(-1))}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || uploading}
              className="inline-flex items-center px-6 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading
                ? "Uploading..."
                : isLoading
                  ? "Saving..."
                  : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
