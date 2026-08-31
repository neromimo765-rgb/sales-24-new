// =====================================================================
// 📊 logger.js - نظام السجلات الاحترافي باستخدام Winston (النسخة النووية المطورة)
// =====================================================================

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد logs تلقائياً لتفادي أخطاء المسارات نهائياً
const logDir = path.join(__dirname, 'logs');
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  console.error('⚠️ تحذير: تعذر إنشاء مجلد السجلات محلياً، سيتم الاكتفاء بالكونسول:', error.message);
}

// تنسيق المخرجات المخصص للكونسول ليكون واضحاً ومقروءاً بعين واحدة
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `[${timestamp}] [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
    if (stack) {
      logMessage += `\nStack Trace:\n${stack}`;
    }
    return logMessage;
  })
);

// تكوين نظام السجلات الاحترافي
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sales-24-pro-nuclear' },
  transports: [
    // ملف خاص لتسجيل الأخطاء الحرجة فقط
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error', 
      maxsize: 5242880, // 5 ميجابايت كحد أقصى لكل ملف
      maxFiles: 5 
    }),
    // ملف لتسجيل كل العمليات العامة والتشغيل
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'), 
      maxsize: 5242880, 
      maxFiles: 5 
    })
  ]
});

// إضافة طباعة السجلات في الكونسول (ممتازة لمنصات النشر مثل Railway)
logger.add(new winston.transports.Console({
  format: consoleFormat
}));

/**
 * 🚀 إضافة جديدة: Middleware لـ Express لتسجيل حركة الطلبات تلقائياً (HTTP Request Logger)
 */
function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    };

    if (res.statusCode >= 500) {
      logger.error(`HTTP Request Error`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP Request Client Warning`, logData);
    } else {
      logger.info(`HTTP Request Success`, logData);
    }
  });

  next();
}

module.exports = logger;
module.exports.requestLoggerMiddleware = requestLoggerMiddleware;
