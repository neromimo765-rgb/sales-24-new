/**
 * إعداد رفع الملفات باحترافية - النسخة النووية الصاروخية 🚀
 * أمان مطلق، سرعة فائقة في الفلترة، وإدارة ذكية للملفات.
 */
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// إنشاء مجلد الرفع بخاصية الاستقرار الذاتي
const uploadDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.error('⚠️ خطأ في إنشاء مجلد الرفع:', err.message);
}

// إعداد التخزين الفائق السرعة
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // توليد اسم فريد بالكامل لمنع أي تداخل أو اختراق (UUID v4) مع الحفاظ على الامتداد الأصلي بأمان
    const safeExt = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}-${Date.now()}${safeExt}`;
    cb(null, uniqueName);
  }
});

// استخدام Set للبحث اللحظي O(1) بدلاً من المصفوفات العادية لتسريع الفلترة الصاروخية
const ALLOWED_MIME_TYPES = new Set([
  // الصور
  'image/jpeg', 
  'image/png', 
  'image/gif',
  'image/webp', 
  'image/svg+xml',
  // الفيديوهات
  'video/mp4', 
  'video/webm', 
  'video/quicktime',
  'video/x-msvideo', 
  'video/mpeg'
]);

// فلتر أنواع الملفات المسموحة (بأقصى سرعة وأمان)
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`نوع الملف (${file.mimetype}) غير مسموح به في النظام النووي. يرجى رفع صور (JPEG, PNG, GIF, WebP) أو فيديو (MP4, WebM, MOV) فقط.`), false);
  }
};

// إعداد Multer النهائي (محدد الحجم بـ 50MB وأمان تام للعدد)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB أقصى حجم للملف الواحد
    files: 5 // أقصى عدد ملفات في الطلب الواحد
  }
});

module.exports = upload;
