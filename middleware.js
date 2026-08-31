// =====================================================================
// 🛡️ middleware.js - طبقات الحماية والمعالجة (النسخة النووية الآمنة بالكامل)
// =====================================================================

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// 1️⃣ تخزين مؤقت متطور للـ Cache مع حماية الذاكرة (Memory Guard)
const cacheStore = new Map();
const MAX_CACHE_SIZE = 500;

function cacheMiddleware(durationInSeconds = 60) {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache_${req.originalUrl || req.url}`;
    const cachedResponse = cacheStore.get(key);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      return res.json(cachedResponse.data);
    }

    if (cachedResponse) {
      cacheStore.delete(key);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
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

// 2️⃣ حماية ضد الإغراق (Local Rate Limiter) بدون الحاجة لحزم خارجية معقدة
const requestCounts = new Map();
// تنظيف الذاكرة كل دقيقة لمنع تراكم الـ IP القديمة
setInterval(() => {
  requestCounts.clear();
}, 60 * 1000);

function localRateLimiter(maxRequests = 100, windowMs = 60 * 1000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const current = requestCounts.get(ip) || { count: 0, startTime: Date.now() };

    if (Date.now() - current.startTime > windowMs) {
      current.count = 1;
      current.startTime = Date.now();
    } else {
      current.count++;
    }

    requestCounts.set(ip, current);

    if (current.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'لقد تجاوزت الحد الأقصى للطلبات، يرجى المحاولة لاحقاً ⏳',
        requestId: req.id
      });
    }

    next();
  };
}

// 3️⃣ إضافة Request ID لكل طلب للتتبع والدقة في اللوجات
function requestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
}

// 4️⃣ تسجيل تفاصيل كل طلب HTTP بذكاء واحترافية
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

// 5️⃣ معالج المسارات غير الموجودة (404)
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود على السيرفر ❌',
    path: req.originalUrl,
    requestId: req.id
  });
}

// 6️⃣ معالج الأخطاء العام والشامل (500 وأخطاء النظام)
function globalErrorHandler(err, req, res, next) {
  logger.error('حدث خطأ غير متوقع في السيرفر', {
    requestId: req.id,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'البيانات المرسلة غير صالحة (صيغة JSON غير صحيحة)',
      requestId: req.id
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'حجم الملف أكبر من المسموح (الحد الأقصى المسموح به 10MB)',
      requestId: req.id
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'نوع الملف المرسل غير مسموح به',
      requestId: req.id
    });
  }

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
  localRateLimiter,
  requestId,
  requestLogger,
  notFoundHandler,
  globalErrorHandler
};
