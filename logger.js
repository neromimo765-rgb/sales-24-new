// logger.js - نظام السجلات الاحترافي باستخدام Winston
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد logs تلقائياً عشان مديش أخطاء مسارات
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.existsSync(logDir) || fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sales24-pro' },
  transports: [
    // سجل الأخطاء فقط
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error', 
      maxsize: 5242880, // 5MB
      maxFiles: 5 
    }),
    // كل السجلات العامة
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'), 
      maxsize: 5242880, 
      maxFiles: 5 
    })
  ]
});

// في بيئة التطوير نطبع في الكونسول كمان بشكل ملون وواضح
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
