// =====================================================================
// 🛡️ middleware.js - طبقات الحماية والمعالجة (نسخة التخزين المحلي)
// =====================================================================

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// تخزين مؤقت متطور في الذاكرة مع نظام حماية للذاكرة (Memory Guard)
const cacheStore = new Map();
const MAX_CACHE_SIZE = 500; // أقصى عدد عناصر مخزنة لتجنب استهلاك الذاكرة

/**
 * 🚀 دالة التخزين المؤقت (Cache Middleware) مع تنظيف تلقائي للذاكرة
 * @param {number} durationInSeconds - مدة الصلاحية بالثواني
 */
function cacheMiddleware(durationInSeconds = 60) {
  return (req, res, next) => {
    // تخطي الـ Cache تماماً إذا لم تكن طلبات GET
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache_${req.originalUrl || req.url}`;
    const cachedResponse = cacheStore.get(key);

    // التحقق من صلاحية الكاش
    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      return res.json(cachedResponse.data);
    }

    // إذا انتهت صلاحيته، احذفه لتوفير الذاكرة
    if (cachedResponse) {
      cacheStore.delete(key);
    }

    // حفظ النسخة الأصلية من res.json لاعتراض البيانات وتخزينها
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // إدارة حجم الكاش لمنع امتلاء الذاكرة
      if (cacheStore.size >= MAX_CACHE_SIZE) {
        const firstKey = cacheStore.keys().next().value;
        cacheStore.delete(firstKey);
      }

      cacheStore.set(key, {
        data: body,
        expiry: Date.now() + (durationInSeconds * 1000)
      });

      return originalJson(body);
    };

    next();
  };
}

// 🆔 إضافة Request ID لكل طلب للتتبع والدقة في اللوجات
function requestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
}

// 📊 تسجيل تفاصيل كل طلب HTTP بذكاء واحترافية
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('طلب HTTP وارد', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });

  next();
}

// ❌ معالج المسارات غير الموجودة (404)
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود على السيرفر ❌',
    path: req.originalUrl,
    requestId: req.id
  });
}

// ⚠️ معالج الأخطاء العام والشامل (500 وأخطاء النظام)
function globalErrorHandler(err, req, res, next) {
  logger.error('حدث خطأ غير متوقع في السيرفر', {
    requestId: req.id,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // معالجة أخطاء تحليل البيانات (JSON parsing error)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'البيانات المرسلة غير صالحة (صيغة JSON غير صحيحة)',
      requestId: req.id
    });
  }

  // معالجة أخطاء حجم الملفات الكبيرة
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'حجم الملف أكبر من المسموح (الحد الأقصى المسموح به 10MB)',
      requestId: req.id
    });
  }

  // معالجة أخطاء صيغ الملفات غير المسموحة
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'نوع الملف المرسل غير مسموح به',
      requestId: req.id
    });
  }

  // الرد ببيانات الخطأ المناسبة بناءً على بيئة التشغيل
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً'
      : err.message,
    requestId: req.id
  });
}

module.exports = {
  cacheMiddleware,
  requestId,
  requestLogger,
  notFoundHandler,
  globalErrorHandler
};
