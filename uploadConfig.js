// uploadConfig.js - إعداد رفع الملفات باحترافية
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// إنشاء مجلد الرفع لو مش موجود
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// إعداد التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// فلتر أنواع الملفات المسموحة
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'image/webp', 'image/svg+xml'
  ];
  const allowedVideoTypes = [
    'video/mp4', 'video/webm', 'video/quicktime',
    'video/x-msvideo', 'video/mpeg'
  ];

  const allAllowed = [...allowedImageTypes, ...allowedVideoTypes];

  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`نوع الملف ${file.mimetype} غير مسموح. الأنواع المسموحة: صور (JPEG, PNG, GIF, WebP) وفيديو (MP4, WebM, MOV)`), false);
  }
};

// إعداد Multer النهائي
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5 // أقصى عدد ملفات
  }
});

module.exports = upload;
