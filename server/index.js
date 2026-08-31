// =====================================================================
// 🚀 Sales 24 Pro - ملف التشغيل الرئيسي المتكامل والنهائي 100%
// =====================================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 1. استدعاء كافة وحدات النظام ومحركاته الخارجية
const logger = require('./logger');
const scriptGenerator = require('./scriptGenerator');
const marketingEngine = require('./marketingEngine');
const { calculateProfit } = require('./profitCalculator');
const upload = require('./uploadConfig');
const { marketingValidationRules, scriptValidationRules, validate } = require('./validators');
const { requestId, requestLogger, notFoundHandler, globalErrorHandler } = require('./middleware');

const app = express();

// 2. إعدادات السيرفر والـ Middlewares الأساسية
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تفعيل نظام تتبع الطلبات واللوجز
app.use(requestId);
app.use(requestLogger);

// إتاحة مجلد الرفع (Uploads) للملفات والصور محلياً
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// =====================================================================
// 🖥️ واجهة التحكم الرئيسية (Dashboard Pro)
// =====================================================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <title>Sales 24 - Dashboard Pro</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; }
        body { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          max-width: 720px;
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
        .form-group { margin-bottom: 14px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #444; font-size: 14px; }
        input, select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 15px;
          background: #fff;
          color: #333;
        }
        .row { display: flex; gap: 10px; }
        .row .form-group { flex: 1; }
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
          padding: 18px;
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
        <h1>🚀 Sales 24 Pro</h1>
        <p style="text-align:center; color:#666;">منصة إدارة التسويق والذكاء الاصطناعي الشاملة</p>
        
        <div class="status">✅ النظام يعمل بكفاءة أونلاين 24 ساعة</div>
        
        <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
        
        <h3>🧠 محرك التسويق الشامل وحاسبة الأرباح وفحص الوسائط:</h3>
        
        <div class="form-group">
          <label>اسم المنتج:</label>
          <input type="text" id="productName" placeholder="مثال: منظف الأصدقاء العام / جهاز تكنولوجي..." />
        </div>
        
        <div class="row">
          <div class="form-group">
            <label>سعر البيع (جنيه):</label>
            <input type="number" id="price" placeholder="مثال: 250" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>التكلفة (جنيه):</label>
            <input type="number" id="cost" placeholder="مثال: 150" min="0" step="0.01" />
          </div>
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

        <div class="row">
          <div class="form-group">
            <label>تقييم الإضاءة (من 0 لـ 10):</label>
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
        </div>

        <div class="form-group">
          <label>رفع ملف وسائط (فيديو أو صورة للاختبار):</label>
          <input type="file" id="mediaFile" accept="image/*,video/*" />
        </div>
        
        <button class="btn" id="analyzeBtn" onclick="runComprehensiveMarketing()">تشغيل التحليل الشامل وخطة الإعلان 🎯</button>
        
        <div id="resultBox" class="result"></div>
      </div>

      <script>
        async function runComprehensiveMarketing() {
          const productName = document.getElementById('productName').value.trim();
          const category = document.getElementById('productCategory').value;
          const lightingScore = document.getElementById('lightingScore').value;
          const resolution = document.getElementById('resolution').value;
          const price = document.getElementById('price').value;
          const cost = document.getElementById('cost').value;
          const fileInput = document.getElementById('mediaFile');
          const box = document.getElementById('resultBox');
          const btn = document.getElementById('analyzeBtn');
          
          if(!productName) {
            alert('من فضلك اكتب اسم المنتج الأول يا محمد!');
            document.getElementById('productName').focus();
            return;
          }
          
          btn.disabled = true;
          btn.textContent = '⏳ جاري المعالجة والتحليل...';
          box.style.display = 'block';
          box.innerHTML = '⏳ جاري تشغيل محرك التسويق، فحص الوسائط، وحساب الأرباح عبر السيرفر...';
          
          try {
            // لو المستخدم رفع ملف، نرفعه الأول عبر مسار الـ upload
            let uploadedFileUrl = '';
            if (fileInput.files.length > 0) {
              const formData = new FormData();
              formData.append('mediaFile', fileInput.files[0]);
              const uploadRes = await fetch('/api/upload-media', {
                method: 'POST',
                body: formData
              });
              const uploadData = await uploadRes.json();
              if (uploadData.success) {
                uploadedFileUrl = uploadData.data.url;
              }
            }

            // إرسال بيانات التحليل الشامل
            const res = await fetch('/api/comprehensive-marketing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productName, category, lightingScore, resolution, price, cost, uploadedFileUrl })
            });
            const responseData = await res.json();
            
            if(responseData.success) {
              const p = responseData.data.marketingPlan;
              const m = responseData.data.mediaCheck;
              const profit = responseData.data.profitDetails;
              
              box.innerHTML = '✨ <b>التقرير التسويقي الشامل (Sales 24):</b>\n\n' + 
                              '📦 <b>المنتج:</b> ' + p.product + '\n' + 
                              '📊 <b>حالة التحليل:</b> ' + p.status + '\n' + 
                              (profit && profit.valid ? '💰 <b>حاسبة الأرباح:</b> ربح القطعة: ' + profit.profitPerUnit + ' جنيه | هامش الربح: ' + profit.profitMargin + ' (' + profit.status + ')\n\n' : '\n') +
                              '🔍 <b>ملخص دراسة السوق:</b>\n' + p.marketResearch.searchSummary + '\n' + 
                              '👥 <b>الجمهور المستهدف:</b> ' + p.marketResearch.targetAudience + '\n\n' + 
                              '🎬 <b>أفضل أشكال الإعلانات:</b>\n' + 
                              '1️⃣ ' + p.adFormats[0].type + ' (' + p.adFormats[0].concept + ')\n' + 
                              '2️⃣ ' + p.adFormats[1].type + ' (' + p.adFormats[1].concept + ')\n\n' + 
                              '📝 <b>السكريبت الإعلاني المقترح:</b>\n' + p.contentPackage.script + '\n\n' + 
                              '🎵 <b>الموسيقى المقترحة:</b> ' + p.contentPackage.suggestedMusic + '\n\n' + 
                              '📱 <b>تقييم جودة الوسائط:</b>\n' + 
                              '• الحالة: ' + m.qualityStatus + '\n' + 
                              '• التوصيات: ' + m.recommendations.join(' | ') + '\n' + 
                              (uploadedFileUrl ? '• رابط الملف المرفوع: ' + uploadedFileUrl + '\n\n' : '\n\n') +
                              '🏷️ <b>الهاشتاجات:</b> ' + p.contentPackage.hashtags;
            } else {
              box.innerHTML = '❌ خطأ: ' + (responseData.message || 'بيانات غير صالحة');
            }
          } catch(e) {
            box.innerHTML = '❌ فشل الاتصال بالسيرفر، تأكد من تشغيل Node.js ومن الإنترنت.';
          } finally {
            btn.disabled = false;
            btn.textContent = 'تشغيل التحليل الشامل وخطة الإعلان 🎯';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// =====================================================================
// 🔌 مسارات الـ API (مؤمنة بالكامل بالـ Validators والـ Middleware)
// =====================================================================

// 1. مسار التحليل الشامل التسويقي + حاسبة الأرباح + فحص الوسائط
app.post('/api/comprehensive-marketing', marketingValidationRules, validate, (req, res) => {
  try {
    const { productName, category, lightingScore, resolution, price, cost } = req.body;
    
    // استدعاء محرك التسويق
    const marketingPlan = marketingEngine.analyzeProductAndPlan(productName, category);
    
    // تقييم جودة الوسائط
    const mediaCheck = marketingEngine.evaluateMediaQuality('فيديو', resolution || '1080p', lightingScore || 8);
    
    // حساب الأرباح عبر الحاسبة الخارجية
    const profitDetails = calculateProfit(price || 0, cost || 0, 1);

    res.json({
      success: true,
      requestId: req.id,
      data: {
        marketingPlan,
        mediaCheck,
        profitDetails
      }
    });
  } catch (error) {
    logger.error('خطأ في مسار التحليل الشامل', { error: error.message, requestId: req.id });
    res.status(500).json({ success: false, message: error.message || 'حدث خطأ داخلي في السيرفر' });
  }
});

// 2. مسار رفع الملفات (Images / Videos) عبر Multer و uploadConfig
app.post('/api/upload-media', upload.single('mediaFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });
    }
    logger.info('تم رفع ملف بنجاح', { filename: req.file.filename, requestId: req.id });
    res.json({
      success: true,
      requestId: req.id,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
        url: `/uploads/${req.file.filename}`
      }
    });
  } catch (error) {
    logger.error('خطأ أثناء رفع الملف', { error: error.message, requestId: req.id });
    res.status(500).json({ success: false, message: error.message || 'خطأ في معالجة رفع الملف' });
  }
});

// 3. مسار توليد السكريبتات الإعلانية
app.post('/api/generate-script', scriptValidationRules, validate, (req, res) => {
  try {
    const result = scriptGenerator.generate(req.body);
    res.json({ success: true, requestId: req.id, data: result });
  } catch (error) {
    logger.error('خطأ في توليد السكريبت', { error: error.message, requestId: req.id });
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء توليد السكريبت' });
  }
});

// 4. مسار اختبار الاتصال
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Sales 24 API يعمل بكفاءة تامة 100%! 🚀',
    requestId: req.id,
    time: new Date()
  });
});

// 5. مسار فحص حالة السيرفر
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    uptime: process.uptime(),
    requestId: req.id,
    time: new Date()
  });
});

// =====================================================================
// 🛡️ معالجة الأخطاء والمسارات غير الموجودة (404 & Global Error Handler)
// =====================================================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

// =====================================================================
// ⚡ تشغيل الخادم (Server Listen)
// =====================================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`🚀 Sales 24 Pro يعمل على المنفذ ${PORT}`);
  console.log(`🚀 Sales 24 Pro يعمل بنجاح تام على المنفذ ${PORT}`);
  console.log(`🌐 افتح المتصفح الآن على الرابط: http://localhost:${PORT}`);
});
