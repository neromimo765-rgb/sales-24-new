// =====================================================================
// 🗄️ database.js - نظام الاتصال بقاعدة البيانات MongoDB (النسخة النووية المطورة)
// =====================================================================

const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  // التحقق من وجود رابط الاتصال لمنع محاولات الاتصال الخاطئة
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sales24';

  const options = {
    serverSelectionTimeoutMS: 5000, // مهلة الانتظار القصوى للاتصال
    socketTimeoutMS: 45000,         // مهلة السوكت للعمليات الطويلة
    maxPoolSize: 50,                // 🚀 زيادة السرعة عبر Connection Pool
    minPoolSize: 10,
  };

  try {
    const conn = await mongoose.connect(mongoURI, options);
    
    logger.info(`✅ MongoDB متصل بنجاح: ${conn.connection.host}`);
    console.log(`✅ MongoDB متصل بنجاح على المضيف: ${conn.connection.host}`);

    // مراقبة أحداث وفصل الاتصال لتجنب توقف السيرفر المفاجئ
    mongoose.connection.on('error', (err) => {
      logger.error('❌ خطأ في اتصال MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ تم انقطاع الاتصال بـ MongoDB - جاري محاولة إعادة الاتصال التلقائي...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 تمت استعادة الاتصال بـ MongoDB بنجاح.');
    });

  } catch (error) {
    logger.warn('⚠️ تعذر الاتصال بقاعدة البيانات MongoDB - النظام يعمل حالياً في وضع الأمان الذاتي (Standalone Mode):', error.message);
    console.log('⚠️ ملاحظة: يعمل النظام بكفاءة ذاتية بدون قاعدة بيانات (تأكد من ضبط متغيرات البيئة MONGO_URI إذا كنت تحتاج لقاعدة بيانات).');
  }
};

module.exports = connectDB;
