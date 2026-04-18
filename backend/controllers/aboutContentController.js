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
        scienceHeading: content?.scienceHeading || "We Are Backed By Science",
        scienceDescription:
          content?.scienceDescription ||
          "Dot-Herbs delivers high-quality, safe products crafted under expert supervision and aligned with global standards. Committed to GMP, HACCP, ISO systems, and compliance-driven quality controls, we ensure excellence at every stage.",
        scienceBadgeImages: content?.scienceBadgeImages || [],
        scienceImage: content?.scienceImage || "",
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
    const hasVideoUrl = Object.prototype.hasOwnProperty.call(
      req.body,
      "videoUrl",
    );
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
    const hasScienceHeading = Object.prototype.hasOwnProperty.call(
      req.body,
      "scienceHeading",
    );
    const hasScienceDescription = Object.prototype.hasOwnProperty.call(
      req.body,
      "scienceDescription",
    );
    const hasScienceBadgeImages = Object.prototype.hasOwnProperty.call(
      req.body,
      "scienceBadgeImages",
    );
    const hasScienceImage = Object.prototype.hasOwnProperty.call(
      req.body,
      "scienceImage",
    );

    if (
      !hasVideoUrl &&
      !hasFacilityHeading &&
      !hasFacilityDescription &&
      !hasFacilityImages &&
      !hasScienceHeading &&
      !hasScienceDescription &&
      !hasScienceBadgeImages &&
      !hasScienceImage
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

    if (hasScienceHeading) {
      content.scienceHeading = req.body.scienceHeading?.trim() || "";
    }

    if (hasScienceDescription) {
      content.scienceDescription = req.body.scienceDescription?.trim() || "";
    }

    if (hasScienceBadgeImages) {
      const rawBadgeImages = Array.isArray(req.body.scienceBadgeImages)
        ? req.body.scienceBadgeImages
        : [];
      const nextBadgeImages = rawBadgeImages
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 8);

      if (nextBadgeImages.length < 1) {
        return res.status(400).json({
          success: false,
          error: "Please upload at least one certification badge image",
        });
      }

      const previousBadgeImages = Array.isArray(content.scienceBadgeImages)
        ? content.scienceBadgeImages
        : [];

      previousBadgeImages
        .filter((oldImage) => oldImage && !nextBadgeImages.includes(oldImage))
        .forEach((oldImage) => deleteUploadedFileIfExists(oldImage));

      content.scienceBadgeImages = nextBadgeImages;
    }

    if (hasScienceImage) {
      const nextScienceImage = req.body.scienceImage?.trim() || "";

      if (!nextScienceImage) {
        return res.status(400).json({
          success: false,
          error: "Please upload one science section image",
        });
      }

      if (content.scienceImage && content.scienceImage !== nextScienceImage) {
        deleteUploadedFileIfExists(content.scienceImage);
      }

      content.scienceImage = nextScienceImage;
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
