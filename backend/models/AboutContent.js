import mongoose from "mongoose";

const aboutContentSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    facilityHeading: {
      type: String,
      trim: true,
      default: "Pakistan's Largest Nutraceutical Manufacturing Facility",
      maxlength: [180, "Heading cannot be more than 180 characters"],
    },
    facilityDescription: {
      type: String,
      trim: true,
      default:
        "With over a decade of experience, Dot-Herbs specializes in manufacturing nutraceutical and natural healthcare products. Backed by modern laboratories, strict quality protocols, and scalable production systems, we continue to set standards in safety, consistency, and product innovation.",
      maxlength: [1200, "Description cannot be more than 1200 characters"],
    },
    facilityImages: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 3,
        message: "You can store up to 3 facility images",
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const AboutContent = mongoose.model("AboutContent", aboutContentSchema);

export default AboutContent;
