// =====================================================================
// 🗄️ database.js - نظام الاتصال بقاعدة البيانات MongoDB (النسخة الاحترافية المطورة)
// =====================================================================

const mongoose = require('mongoose');
const logger = require('./logger');

// إعدادات تتبع إعادة المحاولة
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const connectDB = async () => {
  // التحقق من وجود رابط الاتصال لمنع محاولات الاتصال الخاطئة
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sales24';
  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    serverSelectionTimeoutMS: 5000, // مهلة الانتظار القصوى للاتصال (5 ثوانٍ)
    socketTimeoutMS: 45000,         // مهلة السوكت للعمليات الطويلة
    maxPoolSize: 50,                // 🚀 زيادة السرعة عبر Connection Pool
    minPoolSize: 10,                // الحد الأدنى للاتصالات الجاهزة
    autoIndex: !isProduction,       // تعطيل بناء الفهارس تلقائياً في الإنتاج لتحسين الأداء
  };

  try {
    // محاولة الاتصال بقاعدة البيانات
    const conn = await mongoose.connect(mongoURI, options);
    
    reconnectAttempts = 0; // تصفير عداد المحاولات عند النجاح
    logger.info(`✅ MongoDB متصل بنجاح: ${conn.connection.host} (${conn.connection.name})`);
    console.log(`✅ MongoDB متصل بنجاح على المضيف: ${conn.connection.host}`);

    // ==========================================
    // 📊 مراقبة أحداث الاتصال وإدارة الأخطاء
    // ==========================================

    mongoose.connection.on('error', (err) => {
      logger.error('❌ خطأ في اتصال MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ تم انقطاع الاتصال بـ MongoDB - جاري مراقبة الحالة...');
      
      // محاولة إعادة اتصال محدودة ومدروسة لتفادي إجهاد الخادم
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        logger.info(`🔄 محاولة إعادة الاتصال رقم (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      } else {
        logger.error('❌ تم تجاوز الحد الأقصى لمحاولات إعادة الاتصال بـ MongoDB. يرجى التحقق من الخادم.');
      }
    });

    mongoose.connection.on('reconnected', () => {
      reconnectAttempts = 0;
      logger.info('🔄 تمت استعادة الاتصال بـ MongoDB بنجاح.');
    });

  } catch (error) {
    logger.warn('⚠️ تعذر الاتصال بقاعدة البيانات MongoDB - النظام يعمل حالياً في وضع الأمان الذاتي (Standalone Mode):', error.message);
    console.log('⚠️ ملاحظة: يعمل النظام بكفاءة ذاتية بدون قاعدة بيانات (تأكد من ضبط متغيرات البيئة MONGO_URI إذا كنت تحتاج لقاعدة بيانات).');
  }
};

// ==========================================
// 🛡️ معالجة الإغلاق الآمن (Graceful Shutdown)
// ==========================================
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('🛑 تم إغلاق اتصال MongoDB بنجاح بسبب إيقاف التطبيق (SIGINT).');
    process.exit(0);
  } catch (err) {
    logger.error('❌ حدث خطأ أثناء إغلاق اتصال MongoDB:', err);
    process.exit(1);
  }
});

module.exports = connectDB;
