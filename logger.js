// =====================================================================
// 📊 logger.js - نظام السجلات الاحترافي باستخدام Winston (النسخة النووية)
// =====================================================================

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد logs تلقائياً عشان تفادي أخطاء المسارات نهائياً
const logDir = path.join(__dirname, 'logs');
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  console.error('⚠️ تحذير: تعذر إنشاء مجلد السجلات محلياً، سيتم الاكتفاء بالكونسول:', error.message);
}

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
      maxsize: 5242880, // 5 ميجابايت كحد maximum لكل ملف
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

// إضافة طباعة السجلات في الكونسول (دائماً مفيدة لرؤية اللوجز على Railway مباشرة)
logger.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

module.exports = logger;
