// =====================================================================
// 🚀 Sales 24 Pro - النسخة النووية النهائية (تريليون في المية)
// =====================================================================
require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// الاستدعاءات الأساسية
const logger = require('./logger');
const connectDB = require('./database');
const scriptGenerator = require('./scriptGenerator');
const marketingEngine = require('./marketingEngine');
const { calculateProfit } = require('./profitCalculator');
const upload = require('./uploadConfig');
const Campaign = require('./models/Campaign');

// Middlewares
const { 
  requestId, 
  requestLogger, 
  cacheMiddleware,
  notFoundHandler, 
  globalErrorHandler 
} = require('./middleware');

// Validators
const { marketingValidationRules, scriptValidationRules, validate } = require('./validators');

// Routes
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// =====================================================================
// 🛡️ الأمان والحماية
// =====================================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(mongoSanitize()); // منع NoSQL Injection
app.use(xss());           // منع XSS Attacks
app.use(hpp());           // منع HTTP Parameter Pollution

// Rate Limiting (منع الهجمات)
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'طلبات كثيرة جداً، حاول لاحقاً' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// =====================================================================
// ⚡ الأداء والسرعة
// =====================================================================
app.use(compression({ level: 6, threshold: 1024 })); // 🚀 ضغط قوي
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(requestId);
app.use(requestLogger);

// =====================================================================
// 📁 الملفات الثابتة مع Cache قوي
// =====================================================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', etag: true }));
app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: '7d', etag: true }));

// =====================================================================
// 🗄️ الاتصال بقاعدة البيانات
// =====================================================================
connectDB();

// =====================================================================
// 🌐 الصفحات الرئيسية
// =====================================================================

// الصفحة الرئيسية (Landing Page + Dashboard)
app.get('/', (req, res) => {
  res.send(getMainDashboardHTML());
});

// صفحة تسجيل الدخول
app.get('/login', (req, res) => {
  res.send(getLoginHTML());
});

// صفحة الأرشيف
app.get('/campaigns', (req, res) => {
  res.send(getCampaignsHTML());
});

// صفحة الإحصائيات
app.get('/analytics', (req, res) => {
  res.send(getAnalyticsHTML());
});

// =====================================================================
// 🔌 مسارات الـ API
// =====================================================================
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);

// التحليل الشامل
app.post('/api/comprehensive-marketing', marketingValidationRules, validate, async (req, res) => {
  try {
    const { productName, category, lightingScore, resolution, price, cost, uploadedFileUrl } = req.body;
    
    const marketingPlan = marketingEngine.analyzeProductAndPlan(productName, category);
    const mediaCheck = marketingEngine.evaluateMediaQuality('فيديو', resolution || '1080p', lightingScore || 8);
    const profitDetails = calculateProfit(price || 0, cost || 0, 1);

    let savedToDB = false;
    let campaignId = null;
    
    try {
      const newCampaign = new Campaign({
        productName,
        category,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        profitPerUnit: profitDetails.valid ? profitDetails.profitPerUnit : 0,
        profitMargin: profitDetails.valid ? profitDetails.profitMargin : '0%',
        script: marketingPlan.contentPackage.script,
        hashtags: marketingPlan.contentPackage.hashtags?.split(' ') || [],
        targetAudience: marketingPlan.marketResearch.targetAudience,
        mediaUrl: uploadedFileUrl || '',
        mediaType: uploadedFileUrl ? 'video' : 'none',
        qualityScore: parseInt(lightingScore) || 0
      });
      const saved = await newCampaign.save();
      savedToDB = true;
      campaignId = saved._id;
    } catch (dbErr) {
      logger.warn('تعذر الحفظ في DB:', { error: dbErr.message });
    }

    res.json({
      success: true,
      requestId: req.id,
      data: { marketingPlan, mediaCheck, profitDetails, savedToDB, campaignId }
    });
  } catch (error) {
    logger.error('خطأ في التحليل:', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

// رفع الملفات
app.post('/api/upload-media', upload.single('mediaFile'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });
    
    logger.info('تم رفع ملف', { filename: req.file.filename });
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// توليد السكريبت
app.post('/api/generate-script', scriptValidationRules, validate, (req, res) => {
  try {
    const result = scriptGenerator.generate(req.body);
    res.json({ success: true, requestId: req.id, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في توليد السكريبت' });
  }
});

// تصدير حملة PDF/JSON
app.get('/api/campaigns/:id/export', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ success: false, message: 'الحملة غير موجودة' });
    
    res.setHeader('Content-Disposition', `attachment; filename=campaign-${campaign._id}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في التصدير' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date()
  });
});

app.get('/api/status', (req, res) => {
  res.json({ success: true, status: 'online', uptime: process.uptime(), time: new Date() });
});

// =====================================================================
// 🛡️ معالجة الأخطاء
// =====================================================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

// =====================================================================
// ⚡ تشغيل الخادم
// =====================================================================
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Sales 24 Pro يعمل على المنفذ ${PORT}`);
  console.log(`
  ╔════════════════════════════════════════════╗
  ║  🚀 Sales 24 Pro - Nuclear Edition v2.0  ║
  ║  ⚡ Port: ${PORT}                              ║
  ║  🌐 http://localhost:${PORT}                    ║
  ║  💎 تريليون في المية جاهز!                ║
  ╚════════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received - إيقاف السيرفر بأمان');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// =====================================================================
// 📄 HTML Templates (Frontend كامل)
// =====================================================================
function getMainDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<title>Sales 24 Pro - النووي</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="منصة ذكية لإدارة التسويق والأرباح">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚀</text></svg>">
<style>
* { font-family: 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
body { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f8fafc; min-height: 100vh; }

/* Navbar */
.navbar { background: rgba(15,23,42,0.95); backdrop-filter: blur(10px); padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.1); }
.navbar-brand { font-size: 20px; font-weight: bold; color: #38bdf8; }
.navbar-links { display: flex; gap: 20px; align-items: center; }
.navbar-links a { color: #cbd5e1; text-decoration: none; padding: 8px 15px; border-radius: 8px; transition: 0.3s; font-size: 14px; }
.navbar-links a:hover { background: rgba(56,189,248,0.1); color: #38bdf8; }
.menu-toggle { display: none; background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }

/* Container */
.container { max-width: 900px; margin: 20px auto; padding: 20px; }
.card { background: rgba(15,23,42,0.9); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); margin-bottom: 20px; }
h1 { color: #38bdf8; text-align: center; font-size: 26px; margin-bottom: 10px; }
.subtitle { text-align: center; color: #94a3b8; margin-bottom: 20px; }

/* Stats Grid */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px; }
.stat-card { background: linear-gradient(135deg, rgba(56,189,248,0.1), rgba(37,99,235,0.1)); border: 1px solid rgba(56,189,248,0.3); padding: 20px; border-radius: 15px; text-align: center; }
.stat-value { font-size: 28px; font-weight: bold; color: #38bdf8; }
.stat-label { color: #94a3b8; font-size: 13px; margin-top: 5px; }

.status { background: rgba(16,185,129,0.1); border: 1px solid #10b981; padding: 12px; border-radius: 10px; text-align: center; margin: 15px 0; color: #34d399; font-weight: bold; }

/* Form */
.form-group { margin-bottom: 15px; }
label { display: block; margin-bottom: 6px; font-weight: bold; color: #cbd5e1; font-size: 14px; }
input, select, textarea { width: 100%; padding: 12px; border: 1px solid #334155; border-radius: 8px; font-size: 15px; background: #1e293b; color: #fff; transition: 0.3s; }
input:focus, select:focus { border-color: #38bdf8; outline: none; box-shadow: 0 0 0 3px rgba(56,189,248,0.2); }
.row { display: flex; gap: 10px; flex-wrap: wrap; }
.row .form-group { flex: 1; min-width: 150px; }

/* Buttons */
.btn { display: block; background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%); color: white; padding: 14px; border-radius: 12px; text-align: center; border: none; width: 100%; cursor: pointer; font-weight: bold; font-size: 16px; margin-top: 20px; transition: 0.3s; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(56,189,248,0.3); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: linear-gradient(135deg, #10b981, #059669); }

/* Result Box */
.result { background: #090d16; border: 1px solid #334155; color: #38bdf8; padding: 20px; border-radius: 12px; margin-top: 20px; font-size: 14px; white-space: pre-wrap; display: none; line-height: 1.8; }
.copy-btn { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; margin: 5px; font-weight: bold; }
.copy-btn:hover { background: #059669; }
.alert-box { background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-weight: bold; }

/* Loading */
.spinner { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #38bdf8; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 10px auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Toast */
.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 12px 25px; border-radius: 10px; font-weight: bold; z-index: 1000; animation: slideDown 0.3s; }
@keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 20px; opacity: 1; } }

/* Footer */
.footer { text-align: center; padding: 30px 20px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 40px; }
.footer a { color: #38bdf8; text-decoration: none; margin: 0 10px; }

/* Mobile */
@media (max-width: 768px) {
  .menu-toggle { display: block; }
  .navbar-links { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #0f172a; flex-direction: column; padding: 15px; }
  .navbar-links.active { display: flex; }
  .row { flex-direction: column; }
  h1 { font-size: 22px; }
  .card { padding: 20px; }
}

/* Progress Bar */
.progress-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin: 10px 0; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #2563eb); width: 0%; transition: width 0.3s; }
</style>
</head>
<body>

<!-- Navbar -->
<nav class="navbar">
  <div class="navbar-brand">🚀 Sales 24 Pro</div>
  <button class="menu-toggle" onclick="toggleMenu()">☰</button>
  <div class="navbar-links" id="navLinks">
    <a href="/">🏠 الرئيسية</a>
    <a href="/campaigns">📋 الحملات</a>
    <a href="/analytics">📊 الإحصائيات</a>
    <a href="/login">👤 دخول</a>
  </div>
</nav>

<div class="container">
  <!-- Stats -->
  <div class="stats-grid" id="statsGrid">
    <div class="stat-card"><div class="stat-value" id="stat-campaigns">0</div><div class="stat-label">إجمالي الحملات</div></div>
    <div class="stat-card"><div class="stat-value" id="stat-active">0</div><div class="stat-label">حملات نشطة</div></div>
    <div class="stat-card"><div class="stat-value" id="stat-profit">0 ج</div><div class="stat-label">إجمالي الأرباح</div></div>
    <div class="stat-card"><div class="stat-value">⚡</div><div class="stat-label">سرعة تريليون</div></div>
  </div>

  <div class="card">
    <h1>🚀 الصاروخ النووي للتسويق</h1>
    <p class="subtitle">منصة ذكية متكاملة لإدارة التسويق، الأرباح، وحفظ الحملات</p>
    <div class="status">⚡ النظام يعمل بكفاءة تريليون في المية أونلاين</div>
    
    <div class="form-group">
      <label>اسم المنتج: *</label>
      <input type="text" id="productName" placeholder="مثال: منظف الأصدقاء العام / جهاز تكنولوجي..." required />
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
        <option value="fashion">أزياء وموضة</option>
        <option value="food">طعام ومشروبات</option>
        <option value="fitness">رياضة ولياقة</option>
      </select>
    </div>

    <div class="row">
      <div class="form-group">
        <label>تقييم الإضاءة (0-10):</label>
        <input type="number" id="lightingScore" value="8" min="0" max="10" />
      </div>
      <div class="form-group">
        <label>دقة الفيديو/الصورة:</label>
        <select id="resolution">
          <option value="1080p">1080p (FHD - ممتاز)</option>
          <option value="720p">720p (HD - جيد)</option>
          <option value="480p">480p (ضعيف)</option>
          <option value="4k">4K (Ultra HD)</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>رفع ملف وسائط:</label>
      <input type="file" id="mediaFile" accept="image/*,video/*" />
      <div class="progress-bar" id="uploadProgress" style="display:none;"><div class="progress-fill" id="progressFill"></div></div>
    </div>
    
    <button class="btn" id="analyzeBtn" onclick="runAnalysis()">🎯 إطلاق التحليل الشامل وحفظ الحملة</button>
    
    <div id="resultBox" class="result">
      <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:12px;">
        <button class="copy-btn" onclick="copyScript()">📋 نسخ السكريبت</button>
        <button class="copy-btn" onclick="downloadReport()">💾 تحميل التقرير</button>
        <button class="copy-btn" onclick="shareResults()">📤 مشاركة</button>
      </div>
      <div id="resultContent"></div>
    </div>
  </div>
</div>

<!-- Footer -->
<div class="footer">
  <p>© 2024 Sales 24 Pro - الصاروخ النووي 🚀</p>
  <p style="margin-top:10px;">
    <a href="/">الرئيسية</a> |
    <a href="/campaigns">الحملات</a> |
    <a href="/analytics">الإحصائيات</a>
  </p>
</div>

<script>
let latestScript = '';
let latestReport = '';

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('active');
}

function showToast(msg, type='success') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.background = type === 'error' ? '#ef4444' : '#10b981';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// تحميل الإحصائيات
async function loadStats() {
  try {
    const res = await fetch('/api/analytics/dashboard');
    const data = await res.json();
    if (data.success) {
      document.getElementById('stat-campaigns').textContent = data.data.totalCampaigns || 0;
      document.getElementById('stat-active').textContent = data.data.activeCampaigns || 0;
      document.getElementById('stat-profit').textContent = (data.data.totalProfit || 0).toFixed(0) + ' ج';
    }
  } catch(e) {}
}
loadStats();

async function runAnalysis() {
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
  
  if (!productName) {
    showToast('اكتب اسم المنتج الأول!', 'error');
    document.getElementById('productName').focus();
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '⏳ جاري تشغيل الصاروخ النووي...';
  box.style.display = 'block';
  contentDiv.innerHTML = '<div class="spinner"></div><p style="text-align:center;">جاري المعالجة...</p>';
  
  try {
    let uploadedFileUrl = '';
    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('mediaFile', fileInput.files[0]);
      document.getElementById('uploadProgress').style.display = 'block';
      const uploadRes = await fetch('/api/upload-media', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.success) uploadedFileUrl = uploadData.data.url;
      document.getElementById('progressFill').style.width = '100%';
    }

    const res = await fetch('/api/comprehensive-marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, category, lightingScore, resolution, price, cost, uploadedFileUrl })
    });
    const responseData = await res.json();
    
    if (responseData.success) {
      const p = responseData.data.marketingPlan;
      const m = responseData.data.mediaCheck;
      const profit = responseData.data.profitDetails;
      const saved = responseData.data.savedToDB;
      
      latestScript = p.contentPackage.script;

      let alertHtml = '';
      if (profit?.valid && parseInt(profit.profitMargin) < 15) {
        alertHtml = '<div class="alert-box">⚠️ هامش الربح ضعيف (' + profit.profitMargin + ')، ننصح برفع سعر البيع!</div>';
      }

      latestReport = alertHtml +
        '✨ <b>التقرير التسويقي الشامل:</b><br><br>' + 
        '📦 <b>المنتج:</b> ' + p.product + '<br>' + 
        '📊 <b>الحالة:</b> ' + p.status + '<br>' + 
        (saved ? '💾 <b>تم الحفظ في قاعدة البيانات ✅</b><br>' : '') +
        (profit?.valid ? '💰 <b>الربح:</b> ' + profit.profitPerUnit + ' جنيه | هامش: ' + profit.profitMargin + '<br><br>' : '<br>') +
        '🔍 <b>دراسة السوق:</b><br>' + p.marketResearch.searchSummary + '<br>' + 
        '👥 <b>الجمهور:</b> ' + p.marketResearch.targetAudience + '<br><br>' + 
        '🎬 <b>الإعلانات:</b><br>1️⃣ ' + p.adFormats[0].type + '<br>2️⃣ ' + p.adFormats[1].type + '<br><br>' + 
        '📝 <b>السكريبت:</b><br>' + p.contentPackage.script + '<br><br>' + 
        '🎵 <b>الموسيقى:</b> ' + p.contentPackage.suggestedMusic + '<br><br>' + 
        '📱 <b>جودة الوسائط:</b> ' + m.qualityStatus + '<br>' + 
        '💡 ' + m.recommendations.join(' | ') + '<br>' +
        (uploadedFileUrl ? '🔗 <a href="' + uploadedFileUrl + '" target="_blank" style="color:#38bdf8;">عرض الملف</a><br><br>' : '<br>') +
        '🏷️ <b>الهاشتاجات:</b> ' + p.contentPackage.hashtags;
      
      contentDiv.innerHTML = latestReport;
      showToast('تم التحليل بنجاح! ✨');
      loadStats();
    } else {
      contentDiv.innerHTML = '❌ ' + (responseData.message || 'خطأ');
    }
  } catch(e) {
    contentDiv.innerHTML = '❌ فشل الاتصال بالسيرفر';
    showToast('فشل الاتصال!', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🎯 إطلاق التحليل الشامل وحفظ الحملة';
    document.getElementById('uploadProgress').style.display = 'none';
  }
}

function copyScript() {
  if (!latestScript) return showToast('لا يوجد سكريبت!', 'error');
  navigator.clipboard.writeText(latestScript).then(() => showToast('تم النسخ ✨'));
}

function downloadReport() {
  if (!latestReport) return;
  const blob = new Blob([latestReport.replace(/<[^>]*>/g, '')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report-' + Date.now() + '.txt';
  a.click();
  showToast('تم التحميل!');
}

function shareResults() {
  if (navigator.share) {
    navigator.share({ title: 'Sales 24 Pro', text: latestScript });
  } else {
    copyScript();
  }
}
</script>
</body>
</html>`;
}

function getLoginHTML() {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><title>تسجيل الدخول - Sales 24 Pro</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>*{font-family:system-ui,sans-serif;box-sizing:border-box;margin:0;padding:0}body{background:linear-gradient(135deg,#0f172a,#1e1b4b);color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px;max-width:400px;width:100%;box-shadow:0 25px 50px rgba(0,0,0,0.5)}h1{color:#38bdf8;text-align:center;margin-bottom:25px}.tabs{display:flex;margin-bottom:20px;border-bottom:1px solid #334155}.tab{flex:1;padding:12px;text-align:center;cursor:pointer;color:#94a3b8;font-weight:bold}.tab.active{color:#38bdf8;border-bottom:2px solid #38bdf8}.form-group{margin-bottom:15px}label{display:block;margin-bottom:6px;color:#cbd5e1;font-size:14px}input{width:100%;padding:12px;border:1px solid #334155;border-radius:8px;background:#1e293b;color:#fff;font-size:15px}input:focus{border-color:#38bdf8;outline:none}.btn{width:100%;padding:14px;background:linear-gradient(135deg,#38bdf8,#2563eb);color:#fff;border:none;border-radius:12px;font-weight:bold;font-size:16px;cursor:pointer;margin-top:15px}.btn:hover{transform:translateY(-2px)}.msg{padding:10px;border-radius:8px;text-align:center;margin:10px 0;font-weight:bold}.msg.success{background:rgba(16,185,129,0.2);color:#34d399}.msg.error{background:rgba(239,68,68,0.2);color:#fca5a5}.back{text-align:center;margin-top:20px}.back a{color:#38bdf8;text-decoration:none}</style></head><body>
<div class="card"><h1>🚀 Sales 24 Pro</h1>
<div class="tabs"><div class="tab active" onclick="switchTab('login')">تسجيل الدخول</div><div class="tab" onclick="switchTab('register')">حساب جديد</div></div>
<div id="loginForm"><div class="form-group"><label>البريد الإلكتروني</label><input type="email" id="loginEmail" placeholder="example@mail.com"></div><div class="form-group"><label>كلمة السر</label><input type="password" id="loginPass" placeholder="••••••"></div><button class="btn" onclick="login()">دخول</button></div>
<div id="registerForm" style="display:none"><div class="form-group"><label>الاسم</label><input type="text" id="regName" placeholder="اسمك"></div><div class="form-group"><label>البريد</label><input type="email" id="regEmail" placeholder="example@mail.com"></div><div class="form-group"><label>كلمة السر</label><input type="password" id="regPass" placeholder="6 أحرف على الأقل"></div><button class="btn" onclick="register()">إنشاء حساب</button></div>
<div id="msg"></div><div class="back"><a href="/">← العودة للرئيسية</a></div></div>
<script>
function switchTab(t){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));event.target.classList.add('active');document.getElementById('loginForm').style.display=t==='login'?'block':'none';document.getElementById('registerForm').style.display=t==='register'?'block':'none'}
function showMsg(m,t){document.getElementById('msg').innerHTML='<div class="msg '+t+'">'+m+'</div>'}
async function login(){const email=document.getElementById('loginEmail').value;const password=document.getElementById('loginPass').value;if(!email||!password)return showMsg('املأ الحقول!','error');try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();if(d.success){localStorage.setItem('token',d.token);showMsg('✅ '+d.message,'success');setTimeout(()=>location.href='/',1000)}else showMsg('❌ '+d.message,'error')}catch(e){showMsg('❌ خطأ اتصال','error')}}
async function register(){const name=document.getElementById('regName').value;const email=document.getElementById('regEmail').value;const password=document.getElementById('regPass').value;if(!name||!email||!password)return showMsg('املأ الحقول!','error');try{const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password})});const d=await r.json();if(d.success){localStorage.setItem('token',d.token);showMsg('✅ '+d.message,'success');setTimeout(()=>location.href='/',1000)}else showMsg('❌ '+d.message,'error')}catch(e){showMsg('❌ خطأ','error')}}
</script></body></html>`;
}

function getCampaignsHTML() {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><title>الحملات - Sales 24 Pro</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>*{font-family:system-ui,sans-serif;box-sizing:border-box;margin:0;padding:0}body{background:linear-gradient(135deg,#0f172a,#1e1b4b);color:#fff;min-height:100vh;padding:20px}.container{max-width:1200px;margin:0 auto}h1{color:#38bdf8;margin-bottom:20px;text-align:center}.search-bar{background:rgba(15,23,42,0.9);padding:15px;border-radius:12px;margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap}.search-bar input,.search-bar select{padding:10px;background:#1e293b;border:1px solid #334155;color:#fff;border-radius:8px;flex:1;min-width:150px}.card{background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:15px;padding:20px;margin-bottom:15px}.card h3{color:#38bdf8;margin-bottom:10px}.badge{display:inline-block;padding:4px 10px;border-radius:12px;font-size:12px;margin:2px}.badge-green{background:rgba(16,185,129,0.2);color:#34d399}.badge-blue{background:rgba(56,189,248,0.2);color:#38bdf8}.actions{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}.btn{padding:8px 15px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:bold}.btn-danger{background:#ef4444;color:#fff}.btn-primary{background:#38bdf8;color:#fff}.back{text-align:center;margin-top:20px}.back a{color:#38bdf8;text-decoration:none}.empty{text-align:center;padding:40px;color:#94a3b8}</style></head><body>
<div class="container"><h1>📋 أرشيف الحملات</h1>
<div class="search-bar"><input type="text" id="search" placeholder="🔍 ابحث عن حملة..." onkeyup="loadCampaigns()"><select id="filterCategory" onchange="loadCampaigns()"><option value="">كل الفئات</option><option value="electronics">إلكترونيات</option><option value="beauty">تجميل</option><option value="home">منزلية</option></select></div>
<div id="campaignsList"><p style="text-align:center;color:#94a3b8;">⏳ جاري التحميل...</p></div>
<div class="back"><a href="/">← الرئيسية</a></div></div>
<script>
async function loadCampaigns(){const s=document.getElementById('search').value;const c=document.getElementById('filterCategory').value;try{const r=await fetch('/api/campaigns?search='+s+'&category='+c);const d=await r.json();const list=document.getElementById('campaignsList');if(!d.success||d.data.length===0)return list.innerHTML='<div class="empty">لا توجد حملات بعد</div>';list.innerHTML=d.data.map(x=>'<div class="card"><h3>📦 '+x.productName+'</h3><span class="badge badge-blue">'+(x.category||'عام')+'</span><span class="badge badge-green">'+x.status+'</span><p style="margin:10px 0;color:#94a3b8;">💰 السعر: '+x.price+' ج | التكلفة: '+x.cost+' ج | الربح: '+x.profitPerUnit+' ج ('+x.profitMargin+')</p><p style="color:#cbd5e1;font-size:13px;">'+(x.script||'').substring(0,150)+'...</p><div class="actions"><button class="btn btn-primary" onclick="viewCampaign(\\''+x._id+'\\')">👁️ عرض</button><button class="btn btn-primary" onclick="duplicateCampaign(\\''+x._id+'\\')">📋 تكرار</button><button class="btn btn-danger" onclick="deleteCampaign(\\''+x._id+'\\')">🗑️ حذف</button></div></div>').join('')}catch(e){document.getElementById('campaignsList').innerHTML='<div class="empty">❌ فشل التحميل</div>'}}
async function deleteCampaign(id){if(!confirm('متأكد؟'))return;await fetch('/api/campaigns/'+id,{method:'DELETE'});loadCampaigns()}
async function duplicateCampaign(id){await fetch('/api/campaigns/'+id+'/duplicate',{method:'POST'});loadCampaigns()}
function viewCampaign(id){window.location.href='/api/campaigns/'+id+'/export'}
loadCampaigns();
</script></body></html>`;
}

function getAnalyticsHTML() {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><title>الإحصائيات - Sales 24 Pro</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>*{font-family:system-ui,sans-serif;box-sizing:border-box;margin:0;padding:0}body{background:linear-gradient(135deg,#0f172a,#1e1b4b);color:#fff;min-height:100vh;padding:20px}.container{max-width:1200px;margin:0 auto}h1{color:#38bdf8;text-align:center;margin-bottom:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:20px}.stat{background:rgba(15,23,42,0.9);padding:20px;border-radius:15px;text-align:center;border:1px solid rgba(56,189,248,0.3)}.stat h2{color:#38bdf8;font-size:32px}.stat p{color:#94a3b8;margin-top:5px}.chart-box{background:rgba(15,23,42,0.9);padding:20px;border-radius:15px;margin-bottom:20px}.back{text-align:center;margin-top:20px}.back a{color:#38bdf8;text-decoration:none}</style></head><body>
<div class="container"><h1>📊 الإحصائيات والتحليلات</h1>
<div class="grid" id="statsGrid"><div class="stat"><h2 id="total">0</h2><p>إجمالي الحملات</p></div><div class="stat"><h2 id="active">0</h2><p>حملات نشطة</p></div><div class="stat"><h2 id="profit">0</h2><p>إجمالي الأرباح</p></div><div class="stat"><h2 id="avg">0</h2><p>متوسط الربح</p></div></div>
<div class="chart-box"><h3 style="color:#38bdf8;margin-bottom:15px;">📈 الأداء الشهري</h3><canvas id="chart1"></canvas></div>
<div class="chart-box"><h3 style="color:#38bdf8;margin-bottom:15px;">🏆 أفضل الفئات</h3><canvas id="chart2"></canvas></div>
<div class="back"><a href="/">← الرئيسية</a></div></div>
<script>
async function load(){try{const r=await fetch('/api/analytics/dashboard');const d=await r.json();if(!d.success)return;document.getElementById('total').textContent=d.data.totalCampaigns;document.getElementById('active').textContent=d.data.activeCampaigns;document.getElementById('profit').textContent=d.data.totalProfit.toFixed(0)+' ج';document.getElementById('avg').textContent=(d.data.totalCampaigns?d.data.totalProfit/d.data.totalCampaigns:0).toFixed(0)+' ج';
const m=d.data.monthlyStats||[];new Chart(document.getElementById('chart1'),{type:'line',data:{labels:m.map(x=>x._id).reverse(),datasets:[{label:'الحملات',data:m.map(x=>x.count).reverse(),borderColor:'#38bdf8',backgroundColor:'rgba(56,189,248,0.1)',tension:0.4}]},options:{plugins:{legend:{labels:{color:'#fff'}}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'}}}}});
const c=d.data.topCategories||[];new Chart(document.getElementById('chart2'),{type:'doughnut',data:{labels:c.map(x=>x._id||'عام'),datasets:[{data:c.map(x=>x.count),backgroundColor:['#38bdf8','#10b981','#f59e0b','#ef4444','#8b5cf6']}]},options:{plugins:{legend:{labels:{color:'#fff'}}}}})}catch(e){}}
load();
</script></body></html>`;
}
