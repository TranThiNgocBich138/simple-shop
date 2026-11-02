const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = (path.extname(file.originalname) || ".jpg").toLowerCase();
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF, SVG)."), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// POST /api/upload - Upload file ảnh (Admin)
router.post("/", requireAdmin, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file ảnh để tải lên." });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return res.status(201).json({
      message: "Tải ảnh lên thành công.",
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    console.error("UPLOAD_FILE_ERROR:", error);
    return res.status(500).json({ message: "Lỗi trong quá trình tải ảnh." });
  }
});

module.exports = router;
