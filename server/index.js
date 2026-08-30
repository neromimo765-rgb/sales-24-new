// ملف التشغيل الرئيسي - Sales 24 (المتكامل مع محرك التسويق الذكي)
const express = require('express');
const cors = require('cors');
const path = require('path');

// استدعاء محركات النظام الخارجية باحترافية
const scriptGenerator = require('./scriptGenerator');
const marketingEngine = require('./marketingEngine');

const app = express();

// تسجيل CORS والـ JSON
app.use(cors());
app.use(express.json());

// الصفحة الرئيسية - واجهة التحكم المتقدمة
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
          max-width: 650px;
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
        input, select {
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
        <p style="text-align:center; color:#666;">منصة إدارة التسويق والذكاء الاصطناعي الشامل</p>
        
        <div class="status">✅ النظام يعمل بكفاءة أونلاين 24 ساعة</div>
        
        <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
        
        <h3>🧠 محرك التسويق الشامل وتحليل المنتجات:</h3>
        <div class="form-group">
          <label>اسم المنتج:</label>
          <input type="text" id="productName" placeholder="مثال: منظف الأصدقاء العام / جهاز تكنولوجي..." />
        </div>
        <div class="form-group">
          <label>فئة المنتج:</label>
          <select id="productCategory">
            <option value="default">عام (Default)</option>
            <option value="electronics">إلكترونيات وأجهزة</option>
            <option value="beauty">تجميل وعناية شخصية</option>
            <option value="home">أدوات منزلية ومنظفات</option>
          </select>
        </div>
        <div class="form-group">
          <label>تقييم الإضاءة للفيديو (من 0 لـ 10):</label>
          <input type="number" id="lightingScore" value="8" min="0" max="10" />
        </div>
        <div class="form-group">
          <label>دقة الفيديو/الصورة:</label>
          <select id="resolution">
            <option value="1080p">1080p (FHD - ممتاز)</option>
            <option value="720p">720p (HD - جيد)</option>
            <option value="480p">480p (ضعيف)</option>
          </select>
        </div>
        
        <button class="btn" onclick="runComprehensiveMarketing()">تشغيل التحليل الشامل وخطة الإعلان 🎯</button>
        
        <div id="resultBox" class="result"></div>
      </div>

      <script>
        async function runComprehensiveMarketing() {
          const productName = document.getElementById('productName').value;
          const category = document.getElementById('productCategory').value;
          const lightingScore = document.getElementById('lightingScore').value;
          const resolution = document.getElementById('resolution').value;
          const box = document.getElementById('resultBox');
          
          if(!productName) {
            alert('من فضلك اكتب اسم المنتج الأول يا محمد!');
            return;
          }
          
          box.style.display = 'block';
          box.innerHTML = '⏳ جاري تشغيل التحليل الذكي وفحص الوسائط عبر السيرفر...';
          
          try {
            const res = await fetch('/api/comprehensive-marketing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productName, category, lightingScore, resolution })
            });
            const responseData = await res.json();
            
            if(responseData.success) {
              const p = responseData.data.marketingPlan;
              const m = responseData.data.mediaCheck;
              
              box.innerHTML = '✨ **التقرير التسويقي والشامل:**\\n\\n' + 
                              '📦 **المنتج:** ' + p.product + '\\n' + 
                              '📊 **حالة التحليل:** ' + p.status + '\\n\\n' + 
                              '🔍 **ملخص دراسة السوق:**\\n' + p.marketResearch.searchSummary + '\\n' + 
                              '👥 **الجمهور المستهدف:** ' + p.marketResearch.targetAudience + '\\n\\n' + 
                              '🎬 **أفضل أشكال الإعلانات:**\\n' + 
                              '1️⃣ ' + p.adFormats[0].type + ' (' + p.adFormats[0].concept + ')\\n' + 
                              '2️⃣ ' + p.adFormats[1].type + ' (' + p.adFormats[1].concept + ')\\n\\n' + 
                              '📝 **السكريبت الإعلاني المقترح:**\\n' + p.contentPackage.script + '\\n\\n' + 
                              '🎵 **الموسيقى المقترحة:** ' + p.contentPackage.suggestedMusic + '\\n\\n' + 
                              '📱 **تقييم جودة الوسائط (الفيديو/الصورة):**\\n' + 
                              '• الحالة: ' + m.qualityStatus + '\\n' + 
                              '• التوصيات: ' + m.recommendations.join(' | ') + '\\n\\n' + 
                              '🏷️ **الهاشتاجات:** ' + p.contentPackage.hashtags;
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

// مسار API التحليل الشامل التسويقي وفحص الوسائط
app.post('/api/comprehensive-marketing', (req, res) => {
  try {
    const { productName, category, lightingScore, resolution } = req.body;
    
    if (!productName) {
      return res.status(400).json({ success: false, message: 'اسم المنتج مطلوب' });
    }

    // استدعاء الدوال من الملف الخارجي marketingEngine.js
    const marketingPlan = marketingEngine.analyzeProductAndPlan(productName, category);
    const mediaCheck = marketingEngine.evaluateMediaQuality('فيديو', resolution || '1080p', lightingScore || 8);

    res.json({
      success: true,
      data: {
        marketingPlan,
        mediaCheck
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'حدث خطأ داخلي' });
  }
});

// مسار API القديم لتوليد السكريبتات
app.post('/api/generate-script', (req, res) => {
  try {
    const result = scriptGenerator.generate(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي' });
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
