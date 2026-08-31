// =====================================================================
// 🛡️ middleware.js - طبقات الحماية والمعالجة (النسخة النووية المُحدثة)
// =====================================================================

const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // تأكد من صحة مسار نموذج المستخدم
const logger = require('./logger');

// تخزين مؤقت بسيط في الذاكرة (Memory Cache)
const cacheStore = new Map();

// 🚀 [مضاف حديثاً] دالة التخزين المؤقت (Cache Middleware) لحل مشكلة campaigns.js
function cacheMiddleware(durationInSeconds = 60) {
  return (req, res, next) => {
    // تخطي الـ Cache إذا لم تكن طلبات GET
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache_${req.originalUrl || req.url}`;
    const cachedResponse = cacheStore.get(key);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      return res.json(cachedResponse.data);
    }

    // حفظ النسخة الأصلية من res.json لاعتراض البيانات وتخزينها
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cacheStore.set(key, {
        data: body,
        expiry: Date.now() + durationInSeconds * 1000
      });
      return originalJson(body);
    };

    next();
  };
}

// إضافة Request ID لكل طلب للتتبع الدقيق
function requestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
}

// حماية المسارات والتحقق من التوكن (JWT)
async function protect(req, res, next) {
  try {
    let token;

    // التحقق من وجود التوكن في الـ Headers أو الـ Cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مسموح لك بالوصول، يرجى تسجيل الدخول أولاً 🚫',
        requestId: req.id
      });
    }

    // فك تشفير التوكن والتحقق منه
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // التحقق من أن المستخدم ما زال موجوداً في قاعدة البيانات
    const currentUser = await User.findById(decoded.id).lean();
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم المرتبط بهذا التوكن لم يعد موجوداً',
        requestId: req.id
      });
    }

    // إرفاق بيانات المستخدم بالطلب
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'التوكن غير صالح أو انتهت صلاحيته',
      requestId: req.id
    });
  }
}

// تسجيل تفاصيل كل طلب HTTP بذكاء واحترافية
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

// معالج المسارات غير الموجودة (404)
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود على السيرفر ❌',
    path: req.originalUrl,
    requestId: req.id
  });
}

// معالج الأخطاء العام والشامل (500)
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
      message: 'حجم الملف أكبر من المسموح (الحد الأقصى المسموح به 50MB)',
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
  cacheMiddleware, // تمت الإضافة هنا بنجاح
  requestId,
  protect,
  requestLogger,
  notFoundHandler,
  globalErrorHandler
};
