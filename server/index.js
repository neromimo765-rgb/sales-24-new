// ملف التشغيل الرئيسي - Sales 24
const express = require('express');
const cors = require('cors');
const path = require('path');

// استدعاء محرك السكريبتات الخارجي باحترافية
const scriptGenerator = require('./scriptGenerator');

const app = express();

// تسجيل CORS والـ JSON
app.use(cors());
app.use(express.json());

// الصفحة الرئيسية - واجهة التحكم المدمجة مع مولد السكريبتات
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales 24 - Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { font-family: system-ui; box-sizing: border-box; }
        body { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          color: #333;
        }
        h1 { color: #667eea; text-align: center; margin-top: 0; }
        .status {
          background: #f0f0f0;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
          margin: 15px 0;
          color: #10b981;
          font-weight: bold;
        }
        .form-group { margin-bottom: 12px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #444; }
        input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 15px;
        }
        .btn {
          display: block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px;
          border-radius: 30px;
          text-align: center;
          border: none;
          width: 100%;
          cursor: pointer;
          font-weight: bold;
          font-size: 16px;
          margin-top: 15px;
        }
        .btn:hover { opacity: 0.9; }
        .result {
          background: #1e293b;
          color: #38bdf8;
          padding: 15px;
          border-radius: 10px;
          margin-top: 20px;
          font-size: 14px;
          white-space: pre-wrap;
          display: none;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Sales 24</h1>
        <p style="text-align:center; color:#666;">منصة إدارة التسويق والذكاء الاصطناعي</p>
        
        <div class="status">✅ النظام يعمل بكفاءة أونلاين 24 ساعة</div>
        
        <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
        
        <h3>🤖 مولد السكريبتات التسويقية الذكي:</h3>
        <div class="form-group">
          <label>اسم المنتج:</label>
          <input type="text" id="productName" placeholder="مثال: منظف عام قوي / جهاز تسخين..." />
        </div>
        <div class="form-group">
          <label>السعر:</label>
          <input type="text" id="productPrice" placeholder="مثال: 150 جنيه / 30 ريال" />
        </div>
        <div class="form-group">
          <label>الجمهور المستهدف:</label>
          <input type="text" id="targetAudience" placeholder="مثال: ربات البيوت / المهتمين بالسيارات" />
        </div>
        
        <button class="btn" onclick="generateScript()">توليد السكريبت والإعلان فوراً 🎬</button>
        
        <div id="resultBox" class="result"></div>
      </div>

      <script>
        async function generateScript() {
          const productName = document.getElementById('productName').value;
          const price = document.getElementById('productPrice').value;
          const targetAudience = document.getElementById('targetAudience').value;
          const box = document.getElementById('resultBox');
          
          if(!productName) {
            alert('من فضلك اكتب اسم المنتج الأول يا محمد!');
            return;
          }
          
          box.style.display = 'block';
          box.innerHTML = '⏳ جاري توليد المحتوى التسويقي عبر السيرفر...';
          
          try {
            const res = await fetch('/api/generate-script', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productName, price, targetAudience })
            });
            const responseData = await res.json();
            
            if(responseData.success) {
              const d = responseData.data;
              box.innerHTML = '✨ **السكريبت الإعلاني الجاهز:**\\n\\n' + 
                              '🔹 **الخطاف (Hook):** ' + d.hook + '\\n\\n' + 
                              '🔸 **التفاصيل:** ' + d.body + '\\n\\n' + 
                              '🎯 **دعوة الشراء (CTA):** ' + d.cta + '\\n\\n' + 
                              '🏷️ **الهاشتاجات:** ' + d.hashtags;
            } else {
              box.innerHTML = '❌ خطأ: ' + responseData.message;
            }
          } catch(e) {
            box.innerHTML = '❌ فشل الاتصال بالسيرفر، تأكد من الإنترنت.';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// مسار API لتوليد السكريبتات (ينادي على ملف scriptGenerator.js الخارجي)
app.post('/api/generate-script', (req, res) => {
  try {
    const result = scriptGenerator.generate(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء توليد المحتوى' });
  }
});

// اختبار API
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API يعمل بشكل ممتاز!',
    time: new Date()
  });
});

// حالة النظام
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    uptime: process.uptime(),
    platform: process.platform,
    time: new Date()
  });
});

// بدء الخادم
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Sales 24 يعمل على المنفذ ${PORT}`);
});
