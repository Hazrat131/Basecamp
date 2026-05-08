const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".pdf", ".txt", ".gif", ".webp"]);
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_ROOT);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const stamp = Date.now();
    const rand = crypto.randomBytes(8).toString("hex");
    cb(null, `${stamp}-${rand}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error("Yalniz png, jpg, jpeg, gif, webp, pdf ve txt formatlari qebul olunur."));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = { upload, UPLOAD_ROOT };
