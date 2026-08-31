/**
 * =====================================================================
 * 🗄️ database.js - نظام الاتصال بقاعدة البيانات MongoDB (النسخة النووية المطورة)
 * =====================================================================
 */

const mongoose = require('mongoose');
const logger = require('./logger');

// إعدادات تتبع إعادة المحاولة وحالة الاتصال
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sales24';
  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    serverSelectionTimeoutMS: 5000, // مهلة الانتظار القصوى للاتصال (5 ثوانٍ)
    socketTimeoutMS: 45000,         // مهلة السوكت للعمليات الطويلة
    maxPoolSize: 50,                // زيادة السرعة عبر Connection Pool
    minPoolSize: 10,                // الحد الأدنى للاتصالات الجاهزة
    autoIndex: !isProduction,       // تعطيل بناء الفهارس تلقائياً في الإنتاج لتحسين الأداء
  };

  try {
    const conn = await mongoose.connect(mongoURI, options);
    
    isConnected = true;
    reconnectAttempts = 0; 
    
    logger.info(`✅ MongoDB متصل بنجاح: ${conn.connection.host} (${conn.connection.name})`);
    console.log(`✅ MongoDB متصل بنجاح على المضيف: ${conn.connection.host}`);

    // ==========================================
    // 📊 مراقبة أحداث الاتصال وإدارة الأخطاء
    // ==========================================

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      logger.error('❌ خطأ في اتصال MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('⚠️ تم انقطاع الاتصال بـ MongoDB - جاري مراقبة الحالة...');
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        logger.info(`🔄 محاولة إعادة الاتصال رقم (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      } else {
        logger.error('❌ تم تجاوز الحد الأقصى لمحاولات إعادة الاتصال بـ MongoDB.');
      }
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      reconnectAttempts = 0;
      logger.info('🔄 تمت استعادة الاتصال بـ MongoDB بنجاح.');
    });

  } catch (error) {
    isConnected = false;
    logger.warn('⚠️ تعذر الاتصال بقاعدة البيانات MongoDB - النظام يعمل في وضع الأمان الذاتي (Standalone Mode):', error.message);
    console.log('⚠️ ملاحظة: يعمل النظام بكفاءة ذاتية بدون قاعدة بيانات.');
  }
};

/**
 * دالة مساعدة لفحص حالة اتصال قاعدة البيانات (تفيد في الـ Health Check Endpoints)
 */
const getDBStatus = () => {
  const states = {
    0: 'مفصول (Disconnected)',
    1: 'متصل (Connected)',
    2: 'جاري الاتصال (Connecting)',
    3: 'جاري الفصل (Disconnecting)'
  };
  return {
    isConnected,
    readyState: states[mongoose.connection.readyState] || 'غير معروف'
  };
};

// ==========================================
// 🛡️ معالجة الإغلاق الآمن الشامل (Graceful Shutdown)
// ==========================================
const gracefulShutdown = async (signal) => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      logger.info(`🛑 تم إغلاق اتصال MongoDB بنجاح بسبب استقبال الإشارة (${signal}).`);
    }
    process.exit(0);
  } catch (err) {
    logger.error('❌ حدث خطأ أثناء إغلاق اتصال MongoDB الآمن:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = {
  connectDB,
  getDBStatus
};
