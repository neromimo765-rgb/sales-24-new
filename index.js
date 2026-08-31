// =====================================================================
// 🚀 Sales 24 Pro - النسخة النووية النهائية المتكاملة (تريليون في المية)
// =====================================================================
const express = require('express');
const mongoose = require('mongoose');
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
// 🗄️ قاعدة البيانات الذكية (MongoDB - Mongoose Schema لأرشيف الحملات)
// =====================================================================
const campaignSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: String,
  price: Number,
  cost: Number,
  profitPerUnit: Number,
  profitMargin: String,
  script: String,
  createdAt: { type: Date, default: Date.now }
});

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);

// محاولة الاتصال بقاعدة البيانات (مع نظام استقرار ذاتي لا يتعطل أبداً)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sales24';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ تم الاتصال بقاعدة البيانات MongoDB بنجاح تام!'))
  .catch(err => console.log('⚠️ ملاحظة: يعمل النظام بكفاءة ذاتية (لم يتم العثور على قاعدة بيانات محلية نشطة).'));

// =====================================================================
// 🖥️ واجهة التحكم الرئيسية (Dashboard Pro - النسخة النووية)
// =====================================================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <title>Sales 24 - Dashboard Pro (Nuclear Edition)</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; }
        body { 
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          color: #f8fafc;
          padding: 20px;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          max-width: 780px;
          margin: 20px auto;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        h1 { color: #38bdf8; text-align: center; margin-top: 0; font-size: 28px; }
        .status {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid #10b981;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
          margin: 15px 0;
          color: #34d399;
          font-weight: bold;
        }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 6px; font-weight: bold; color: #cbd5e1; font-size: 14px; }
        input, select {
          width: 100%;
          padding: 12px;
          border: 1px solid #334155;
          border-radius: 8px;
          font-size: 15px;
          background: #1e293b;
          color: #fff;
        }
        input:focus, select:focus { border-color: #38bdf8; outline: none; }
        .row { display: flex; gap: 10px; }
        .row .form-group { flex: 1; }
        .btn {
          display: block;
          background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%);
          color: white;
          padding: 14px;
          border-radius: 30px;
          text-align: center;
          border: none;
          width: 100%;
          cursor: pointer;
          font-weight: bold;
          font-size: 16px;
          margin-top: 20px;
          transition: 0.3s;
        }
        .btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .result {
          background: #090d16;
          border: 1px solid #334155;
          color: #38bdf8;
          padding: 20px;
          border-radius: 12px;
          margin-top: 20px;
          font-size: 14px;
          white-space: pre-wrap;
          display: none;
          line-height: 1.6;
          position: relative;
        }
        .copy-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          float: left;
          margin-bottom: 12px;
          font-weight: bold;
        }
        .copy-btn:hover { background: #059669; }
        .alert-box {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid #ef4444;
          color: #fca5a5;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Sales 24 Pro - الصاروخ النووي</h1>
        <p style="text-align:center; color:#94a3b8;">منصة ذكية متكاملة لإدارة التسويق، الأرباح، وحفظ الحملات</p>
        
        <div class="status">⚡ النظام يعمل بكفاءة تريليون في المية أونلاين</div>
        
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
        
        <button class="btn" id="analyzeBtn" onclick="runComprehensiveMarketing()">إطلاق التحليل الشامل وحفظ الحملة 🎯</button>
        
        <div id="resultBox" class="result">
          <button class="copy-btn" onclick="copyScriptText()">📋 نسخ السكريبت</button>
          <div id="resultContent" style="clear:both;"></div>
        </div>
      </div>

      <script>
        let latestScriptContent = '';

        async function runComprehensiveMarketing() {
          const productName = document.getElementById('productName').value.trim();
          const category = document.getElementById('productCategory').value;
          const lightingScore = document.getElementById('lightingScore').value;
          const resolution = document.getElementById('resolution').value;
          const price = document.getElementById('price').value;
          const cost = document.getElementById('cost').value;
          const fileInput = document.getElementById('mediaFile');
          const box = document.getElementById('resultBox');
          const contentDiv = document.getElementById('resultContent');
          const btn = document.getElementById('analyzeBtn');
          
          if(!productName) {
            alert('من فضلك اكتب اسم المنتج الأول يا بشمهندس محمد!');
            document.getElementById('productName').focus();
            return;
          }
          
          btn.disabled = true;
          btn.textContent = '⏳ جاري تشغيل الصاروخ النووي ومعالجة البيانات...';
          box.style.display = 'block';
          contentDiv.innerHTML = '⏳ جاري فحص الوسائط، حساب الأرباح بدقة، وحفظ الحملة...';
          
          try {
            let uploadedFileUrl = '';
            if (fileInput.files.length > 0) {
              const formData = new FormData();
              formData.append('mediaFile', fileInput.files[0]);
              const uploadRes = await fetch('/api/upload-media', { method: 'POST', body: formData });
              const uploadData = await uploadRes.json();
              if (uploadData.success) {
                uploadedFileUrl = uploadData.data.url;
              }
            }

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
              const saved = responseData.data.savedToDB;
              
              latestScriptContent = p.contentPackage.script;

              let alertHtml = '';
              if (profit && profit.valid && profit.profitMargin && parseInt(profit.profitMargin) < 15) {
                alertHtml = '<div class="alert-box">⚠️ تنبيه ذكي للأرباح: هامش الربح ضعيف (' + profit.profitMargin + ')، ننصح برفع سعر البيع قليلاً لتغطية تكاليف الإعلانات والشحن بأمان!</div>';
              }

              contentDiv.innerHTML = alertHtml +
                              '✨ <b>التقرير التسويقي الشامل (Sales 24 Pro):</b><br><br>' + 
                              '📦 <b>المنتج:</b> ' + p.product + '<br>' + 
                              '📊 <b>حالة التحليل:</b> ' + p.status + '<br>' + 
                              (saved ? '💾 <b>حالة الأرشيف:</b> تم الحفظ في قاعدة البيانات بنجاح ✅<br>' : '') +
                              (profit && profit.valid ? '💰 <b>حاسبة الأرباح:</b> ربح القطعة: ' + profit.profitPerUnit + ' جنيه | هامش الربح: ' + profit.profitMargin + ' (' + profit.status + ')<br><br>' : '<br>') +
                              '🔍 <b>ملخص دراسة السوق:</b><br>' + p.marketResearch.searchSummary + '<br>' + 
                              '👥 <b>الجمهور المستهدف:</b> ' + p.marketResearch.targetAudience + '<br><br>' + 
                              '🎬 <b>أفضل أشكال الإعلانات:</b><br>' + 
                              '1️⃣ ' + p.adFormats[0].type + ' (' + p.adFormats[0].concept + ')<br>' + 
                              '2️⃣ ' + p.adFormats[1].type + ' (' + p.adFormats[1].concept + ')<br><br>' + 
                              '📝 <b>السكريبت الإعلاني المقترح:</b><br><span style="color:#e2e8f0;">' + p.contentPackage.script + '</span><br><br>' + 
                              '🎵 <b>الموسيقى المقترحة:</b> ' + p.contentPackage.suggestedMusic + '<br><br>' + 
                              '📱 <b>تقييم جودة الوسائط:</b><br>' + 
                              '• الحالة: ' + m.qualityStatus + '<br>' + 
                              '• التوصيات: ' + m.recommendations.join(' | ') + '<br>' + 
                              (uploadedFileUrl ? '• رابط الملف المرفوع: ' + uploadedFileUrl + '<br><br>' : '<br><br>') +
                              '🏷️ <b>الهاشتاجات:</b> ' + p.contentPackage.hashtags;
            } else {
              contentDiv.innerHTML = '❌ خطأ: ' + (responseData.message || 'بيانات غير صالحة');
            }
          } catch(e) {
            contentDiv.innerHTML = '❌ فشل الاتصال بالسيرفر، تأكد من تشغيل Node.js ومن الإنترنت.';
          } finally {
            btn.disabled = false;
            btn.textContent = 'إطلاق التحليل الشامل وحفظ الحملة 🎯';
          }
        }

        function copyScriptText() {
          if (!latestScriptContent) return;
          navigator.clipboard.writeText(latestScriptContent).then(() => {
            alert('تم نسخ السكريبت بنجاح يا فنان! 📋✨');
          });
        }
      </script>
    </body>
    </html>
  `);
});

// =====================================================================
// 🔌 مسارات الـ API (المطورة والمؤمنة بالكامل)
// =====================================================================

app.post('/api/comprehensive-marketing', marketingValidationRules, validate, async (req, res) => {
  try {
    const { productName, category, lightingScore, resolution, price, cost } = req.body;
    
    const marketingPlan = marketingEngine.analyzeProductAndPlan(productName, category);
    const mediaCheck = marketingEngine.evaluateMediaQuality('فيديو', resolution || '1080p', lightingScore || 8);
    const profitDetails = calculateProfit(price || 0, cost || 0, 1);

    let savedToDB = false;
    try {
      const newCampaign = new Campaign({
        productName,
        category,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        profitPerUnit: profitDetails.valid ? profitDetails.profitPerUnit : 0,
        profitMargin: profitDetails.valid ? profitDetails.profitMargin : '0%',
        script: marketingPlan.contentPackage.script
      });
      await newCampaign.save();
      savedToDB = true;
    } catch (dbErr) {
      logger.warn('تعذر الحفظ في قاعدة البيانات مؤقتاً، واستمر التحليل بنجاح', { error: dbErr.message });
    }

    res.json({
      success: true,
      requestId: req.id,
      data: {
        marketingPlan,
        mediaCheck,
        profitDetails,
        savedToDB
      }
    });
  } catch (error) {
    logger.error('خطأ في مسار التحليل الشامل', { error: error.message, requestId: req.id });
    res.status(500).json({ success: false, message: error.message || 'حدث خطأ داخلي في السيرفر' });
  }
});

// مسار استعراض أرشيف الحملات السابقة
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'تعذر جلب أرشيف الحملات' });
  }
});

// مسار رفع الملفات (Images / Videos) عبر Multer
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

// مسار توليد السكريبتات الإعلانية
app.post('/api/generate-script', scriptValidationRules, validate, (req, res) => {
  try {
    const result = scriptGenerator.generate(req.body);
    res.json({ success: true, requestId: req.id, data: result });
  } catch (error) {
    logger.error('خطأ في توليد السكريبت', { error: error.message, requestId: req.id });
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء توليد السكريبت' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Sales 24 Pro (Nuclear Edition) يعمل بكفاءة تامة 100%! 🚀', requestId: req.id, time: new Date() });
});

app.get('/api/status', (req, res) => {
  res.json({ success: true, status: 'online', uptime: process.uptime(), requestId: req.id, time: new Date() });
});

// =====================================================================
// 🛡️ معالجة الأخطاء والمسارات غير الموجودة
// =====================================================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

// =====================================================================
// ⚡ تشغيل الخادم
// =====================================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`🚀 Sales 24 Pro (Nuclear Edition) يعمل على المنفذ ${PORT}`);
  console.log(`🚀 Sales 24 Pro (Nuclear Edition) يعمل بنجاح تام على المنفذ ${PORT}`);
  console.log(`🌐 افتح المتصفح الآن على الرابط: http://localhost:${PORT}`);
});
