// ملف التشغيل الرئيسي
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// تسجيل CORS
app.use(cors());
app.use(express.json());

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sales 24 API يعمل بشكل ممتاز من تطبيق Termux!',
    time: new Date()
  });
});

// صفحة التحكم
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales 24 - Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { font-family: system-ui; }
        body { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          max-width: 600px;
          margin: 50px auto;
          background: rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #667eea; text-align: center; }
        .status {
          background: #f0f0f0;
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          margin: 15px 0;
        }
        .success { color: #10b981; font-weight: bold; }
        .info { color: #666; margin: 10px 0; }
        .btn {
          display: block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-radius: 50px;
          text-align: center;
          text-decoration: none;
          margin: 10px 0;
          font-weight: bold;
        }
        .btn:hover {
          transform: scale(1.05);
          transition: transform 0.3s;
        }
        .feature {
          display: flex;
          align-items: center;
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .feature:last-child { border-bottom: none; }
        .feature-icon { font-size: 24px; margin-left: 10px; }
        .feature-text { flex: 1; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Sales 24</h1>
        <p style="text-align:center; color:#666;">منصة إدارة التسويق الذكية للأندرويد</p>
        
        <div class="status">
          <span class="success">✅ النظام يعمل بشكل ممتاز</span>
        </div>
        
        <div class="info">
          <strong>📊 إحصاءات سريعة:</strong>
        </div>
        
        <div class="feature">
          <span class="feature-icon">📱</span>
          <span class="feature-text">متصل من جهاز أندرويد</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🔗</span>
          <span class="feature-text">الرابط يعمل 24 ساعة</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🤖</span>
          <span class="feature-text">ذكاء اصطناعي متكامل</span>
        </div>
        <div class="feature">
          <span class="feature-icon">💳</span>
          <span class="feature-text">دعم الريال والجنيه</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🎬</span>
          <span class="feature-text">مونتاج تلقائي</span>
        </div>
        
        <a href="/api/test" class="btn">🧪 اختبار API</a>
        <a href="/api/status" class="btn">📈 حالة النظام</a>
        
        <p style="text-align:center; color:#999; font-size:12px; margin-top:20px;">
          تم التشغيل من هاتف الأندرويد - Termux
        </p>
      </div>
    </body>
    </html>
  `);
});

// اختبار API
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'الف API يعمل بشكل ممتاز!',
    endpoints: [
      '/api/auth - تسجيل الدخول',
      '/api/products - المنتجات',
      '/api/analytics - التحليلات',
      '/api/publish - النشر'
    ],
    platform: 'أندرويد',
    time: new Date()
  });
});

// حالة النظام
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    version: process.version,
    time: new Date()
  });
});

// بدء الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sales 24 يعمل على: http://localhost:${PORT}`);
  console.log('📊 يمكنك الوصول من الهاتف الأن');
});
