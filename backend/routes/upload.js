import express from "express";
import multer from "multer";
import { uploadImage, deleteImage } from "../controllers/uploadController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Routes
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  uploadImage,
);
router.delete("/:public_id", protect, authorize("admin"), deleteImage);

export default router;
