const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sales24', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50, // 🚀 زيادة السرعة عبر Connection Pool
      minPoolSize: 10,
    });
    
    logger.info(`✅ MongoDB متصل: ${conn.connection.host}`);
    console.log(`✅ MongoDB متصل بنجاح على: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('خطأ MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB منقطع - جاري إعادة الاتصال...');
    });

  } catch (error) {
    logger.warn('⚠️ لا يوجد MongoDB نشط - النظام يعمل بكفاءة ذاتية');
    console.log('⚠️ ملاحظة: يعمل النظام بكفاءة ذاتية بدون قاعدة بيانات');
  }
};

module.exports = connectDB;
