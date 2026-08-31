// middleware.js - طبقات الحماية والمعالجة
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// إضافة Request ID لكل طلب (للتتبع)
function requestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
}

// تسجيل كل طلب
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('طلب HTTP', {
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

// معالج الأخطاء العام (404)
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود',
    path: req.originalUrl,
    requestId: req.id
  });
}

// معالج الأخطاء العام (500)
function globalErrorHandler(err, req, res, next) {
  logger.error('خطأ غير متوقع', {
    requestId: req.id,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // لو خطأ في JSON parsing
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'البيانات المرسلة غير صالحة (JSON غير صحيح)',
      requestId: req.id
    });
  }

  // لو حجم الملف كبير
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'حجم الملف أكبر من المسموح (الحد الأقصى 50MB)',
      requestId: req.id
    });
  }

  // لو نوع الملف مش مسموح
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'نوع الملف غير مسموح',
      requestId: req.id
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'حدث خطأ داخلي، يرجى المحاولة لاحقاً'
      : err.message,
    requestId: req.id
  });
}

module.exports = {
  requestId,
  requestLogger,
  notFoundHandler,
  globalErrorHandler
};
