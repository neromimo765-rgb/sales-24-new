// =====================================================================
// 📁 upload.js - إعداد رفع الملفات باحترافية وأمان مطلق (النسخة النووية النهائية)
// =====================================================================

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// إنشاء مجلد الرفع بخاصية الاستقرار الذاتي وتفادي الأخطاء
const uploadDir = path.join(__dirname, '../uploads'); // تم التعديل ليصبح في جذر المشروع بمسار دقيق
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

// قائمة الامتدادات المسموحة كطبقة حماية إضافية ضد التلاعب بالـ MimeTypes
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mov', '.avi', '.mpeg']);

// فلتر أنواع الملفات المسموحة (بأقصى سرعة وأمان)
const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`نوع الملف أو الامتداد (${file.mimetype}) غير مسموح به. يرجى رفع صور (JPEG, PNG, GIF, WebP) أو فيديو (MP4, WebM, MOV) فقط.`), false);
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

/**
 * 🛡️ دالة تغليف لمعالجة أخطاء Multer وتحويلها لاستجابة JSON دقيقة
 */
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'حجم الملف يتجاوز الحد الأقصى المسموح به وهو 50 ميجابايت' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'تجاوزت الحد الأقصى لعدد الملفات المسموح بها في الطلب (5 ملفات)' });
    }
    return res.status(400).json({ success: false, message: `خطأ في رفع الملف: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = {
  upload,
  handleUploadErrors
};
