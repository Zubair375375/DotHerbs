import mongoose from "mongoose";

export const DEFAULT_CATEGORIES = [
  {
    name: "Herbs",
    value: "herbs",
    description: "Whole herbs and botanical essentials",
  },
  {
    name: "Teas",
    value: "teas",
    description: "Comforting blends for daily wellness",
  },
  {
    name: "Oils",
    value: "oils",
    description: "Pure oils with therapeutic benefits",
  },
  {
    name: "Supplements",
    value: "supplements",
    description: "Targeted support for your routine",
  },
  {
    name: "Other",
    value: "other",
    description: "Special wellness picks and more",
  },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 50,
    },
    value: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 140,
    },
    image: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.pre("validate", function (next) {
  if (!this.value && this.name) {
    this.value = slugify(this.name);
  }
  next();
});

export const ensureDefaultCategories = async () => {
  for (const category of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { value: category.value },
      { $setOnInsert: category },
      { upsert: true },
    );
  }
};

const Category = mongoose.model("Category", categorySchema);

export default Category;
