import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import AboutContent from "../models/AboutContent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deleteUploadedFileIfExists = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
    return;
  }

  const filename = path.basename(fileUrl);
  const filePath = path.join(__dirname, "..", "uploads", filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// @desc    Get About page content
// @route   GET /api/about-content
// @access  Public
export const getAboutContent = async (req, res) => {
  try {
    const content = await AboutContent.findOne().sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        videoUrl: content?.videoUrl || "",
        facilityHeading:
          content?.facilityHeading ||
          "Pakistan's Largest Nutraceutical Manufacturing Facility",
        facilityDescription:
          content?.facilityDescription ||
          "With over a decade of experience, Dot-Herbs specializes in manufacturing nutraceutical and natural healthcare products. Backed by modern laboratories, strict quality protocols, and scalable production systems, we continue to set standards in safety, consistency, and product innovation.",
        facilityImages: content?.facilityImages || [],
        updatedAt: content?.updatedAt || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Update About page video
// @route   PUT /api/about-content
// @access  Private/Admin
export const updateAboutContent = async (req, res) => {
  try {
    const hasVideoUrl = Object.prototype.hasOwnProperty.call(req.body, "videoUrl");
    const hasFacilityHeading = Object.prototype.hasOwnProperty.call(
      req.body,
      "facilityHeading",
    );
    const hasFacilityDescription = Object.prototype.hasOwnProperty.call(
      req.body,
      "facilityDescription",
    );
    const hasFacilityImages = Object.prototype.hasOwnProperty.call(
      req.body,
      "facilityImages",
    );

    if (
      !hasVideoUrl &&
      !hasFacilityHeading &&
      !hasFacilityDescription &&
      !hasFacilityImages
    ) {
      return res.status(400).json({
        success: false,
        error: "No updatable fields provided",
      });
    }

    let content = await AboutContent.findOne().sort({ updatedAt: -1 });

    if (!content) {
      content = new AboutContent();
    }

    if (hasVideoUrl) {
      const nextVideoUrl = req.body.videoUrl?.trim() || "";
      if (content.videoUrl && content.videoUrl !== nextVideoUrl) {
        deleteUploadedFileIfExists(content.videoUrl);
      }
      content.videoUrl = nextVideoUrl;
    }

    if (hasFacilityHeading) {
      content.facilityHeading = req.body.facilityHeading?.trim() || "";
    }

    if (hasFacilityDescription) {
      content.facilityDescription = req.body.facilityDescription?.trim() || "";
    }

    if (hasFacilityImages) {
      const nextImagesRaw = Array.isArray(req.body.facilityImages)
        ? req.body.facilityImages
        : [];
      const nextImages = nextImagesRaw
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 3);

      const previousImages = Array.isArray(content.facilityImages)
        ? content.facilityImages
        : [];

      previousImages
        .filter((oldImage) => oldImage && !nextImages.includes(oldImage))
        .forEach((oldImage) => deleteUploadedFileIfExists(oldImage));

      content.facilityImages = nextImages;
    }

    content.updatedBy = req.user?._id || null;
    await content.save();

    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Remove About page video
// @route   DELETE /api/about-content
// @access  Private/Admin
export const clearAboutContent = async (req, res) => {
  try {
    const content = await AboutContent.findOne().sort({ updatedAt: -1 });

    if (!content || !content.videoUrl) {
      return res.json({ success: true, message: "No video to remove" });
    }

    deleteUploadedFileIfExists(content.videoUrl);
    content.videoUrl = "";
    content.updatedBy = req.user?._id || null;
    await content.save();

    res.json({ success: true, message: "About video removed" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
