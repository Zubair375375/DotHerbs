import path from "path";
import fs from "fs";

// @desc    Upload image to local /uploads folder
// @route   POST /api/upload
// @access  Private/Admin
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url: imageUrl,
        public_id: req.file.filename,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Image upload failed" });
  }
};

// @desc    Delete image from /uploads folder
// @route   DELETE /api/upload/:filename
// @access  Private/Admin
export const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join("uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Image deletion failed" });
  }
};
