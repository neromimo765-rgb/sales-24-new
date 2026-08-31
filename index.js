// =====================================================================
// 🚀 Sales 24 Pro - النسخة النووية النهائية المتكاملة (تريليون في المية)
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

// الاستدعاءات الأساسية مع إصلاح خطأ استيراد connectDB
const logger = require('./logger');
const { connectDB } = require('./database'); 
const scriptGenerator = require('./scriptGenerator');
const marketingEngine = require('./marketingEngine');
const { calculateProfit } = require('./profitCalculator');
const { upload, handleUploadErrors } = require('./uploadConfig');
const Campaign = require('./models/Campaign');
const User = require('./models/User');

// Middlewares الأساسية والحماية
const { 
  requestId, 
  protect,
  notFoundHandler, 
  globalErrorHandler 
} = require('./middleware');

// Cache متطور وآمن للذاكرة مع آلية تنظيف تلقائية
const cacheStore = new Map();
const MAX_CACHE_SIZE = 300;

function cacheMiddleware(durationInSeconds = 60) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = `web_cache_${req.originalUrl || req.url}`;
    const cachedResponse = cacheStore.get(key);
    
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < durationInSeconds * 1000)) {
      return res.send(cachedResponse.data);
    }
    
    const originalSend = res.send.bind(res);
    res.send = (body) => {
      if (cacheStore.size >= MAX_CACHE_SIZE) {
        const firstKey = cacheStore.keys().next().value;
        cacheStore.delete(firstKey);
      }
      cacheStore.set(key, { data: body, timestamp: Date.now() });
      originalSend(body);
    };
    next();
  };
}

// Validators
const { marketingValidationRules, scriptValidationRules, validate } = require('./validators');

// Routes
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// =====================================================================
// 🛡️ الأمان والحماية المتقدمة (Security Shield)
// =====================================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 150,
  message: { success: false, message: 'طلبات كثيرة جداً من هذا النطاق، حاول لاحقاً.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// =====================================================================
// ⚡ الأداء والسرعة (Performance & Optimization)
// =====================================================================
app.use(compression({ level: 6, threshold: 1024 })); 
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(requestId);

// =====================================================================
// 📁 الملفات الثابتة (Static Files)
// =====================================================================
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', etag: true }));
app.use('/public', express.static(publicDir, { maxAge: '7d', etag: true }));

// =====================================================================
// 🗄️ الاتصال بقاعدة البيانات
// =====================================================================
connectDB();

// =====================================================================
// 🌐 الصفحات الرئيسية (HTML Views)
// =====================================================================
app.get('/', cacheMiddleware(30), (req, res) => {
  res.send(getMainDashboardHTML());
});

app.get('/login', cacheMiddleware(60), (req, res) => {
  res.send(getLoginHTML());
});

app.get('/campaigns', cacheMiddleware(10), (req, res) => {
  res.send(getCampaignsHTML());
});

app.get('/analytics', cacheMiddleware(10), (req, res) => {
  res.send(getAnalyticsHTML());
});

// =====================================================================
// 🔌 مسارات الـ API الأساسية
// =====================================================================
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);

// 🎯 التحليل الشامل للمنتج والحملة التسويقية
app.post('/api/comprehensive-marketing', marketingValidationRules, validate, async (req, res) => {
  try {
    const { productName, category, lightingScore, resolution, price, cost, market, uploadedFileUrl } = req.body;
    
    const targetMarket = ['saudi', 'uae', 'gulf'].includes(market) ? market : 'egypt';
    const marketingPlan = marketingEngine.analyzeProductAndPlan(productName, category, targetMarket);
    const mediaCheck = marketingEngine.evaluateMediaQuality('فيديو', resolution || '1080p', lightingScore || 8);
    const profitDetails = calculateProfit(price || 0, cost || 0, 1);

    let savedToDB = false;
    let campaignId = null;
    
    try {
      const userId = req.user ? req.user._id : null;
      
      const campaignData = {
        productName,
        category,
        market: targetMarket,
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
      };

      if (userId) campaignData.userId = userId;

      const newCampaign = new Campaign(campaignData);
      const saved = await newCampaign.save();
      savedToDB = true;
      campaignId = saved._id;
    } catch (dbErr) {
      logger.warn('تعذر الحفظ التلقائي في قاعدة البيانات (وضع الأمان النشط):', { error: dbErr.message });
    }

    res.json({
      success: true,
      requestId: req.id,
      data: { marketingPlan, mediaCheck, profitDetails, savedToDB, campaignId, market: targetMarket }
    });
  } catch (error) {
    logger.error('خطأ في التحليل الشامل:', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

// 📁 رفع الوسائط
app.post('/api/upload-media', upload.single('mediaFile'), handleUploadErrors, (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });
    
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

// ✍️ توليد السكريبت الاحترافي
app.post('/api/generate-script', scriptValidationRules, validate, (req, res) => {
  try {
    const result = scriptGenerator.generate(req.body);
    res.json({ success: true, requestId: req.id, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في توليد السكريبت' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', uptime: process.uptime(), timestamp: new Date() });
});

// معالجة الأخطاء والمسارات غير الموجودة
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`🚀 Sales 24 Pro - Nuclear Edition v3.5 Working on Port ${PORT}`);
  logger.info(`🚀 Sales 24 Pro يعمل بنجاح على المنفذ ${PORT}`);
});

// =====================================================================
// 🛡️ حماية السيرفر من الـ Crashes المفاجئة
// =====================================================================
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ خطأ غير معالج (Unhandled Rejection):', reason);
  console.error('❌ خطأ غير معالج:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ استثناء غير مصطاد (Uncaught Exception):', error);
  console.error('❌ استثناء خطير:', error);
  server.close(() => {
    process.exit(1);
  });
});

// =====================================================================
// 📄 HTML Templates (مصححة بالكامل مع أزرار الحفظ والنسخ الاحتياطي للموبايل)
// =====================================================================
function getMainDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<title>Sales 24 Pro - النسخة النووية</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { font-family: 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
body { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f8fafc; min-height: 100vh; }
.navbar { background: rgba(15,23,42,0.95); backdrop-filter: blur(10px); padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.1); }
.navbar-brand { font-size: 20px; font-weight: bold; color: #38bdf8; }
.navbar-links { display: flex; gap: 20px; align-items: center; }
.navbar-links a { color: #cbd5e1; text-decoration: none; padding: 8px 15px; border-radius: 8px; transition: 0.3s; font-size: 14px; }
.navbar-links a:hover { background: rgba(56,189,248,0.1); color: #38bdf8; }
.container { max-width: 900px; margin: 20px auto; padding: 20px; }
.card { background: rgba(15,23,42,0.9); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); margin-bottom: 20px; }
h1 { color: #38bdf8; text-align: center; font-size: 26px; margin-bottom: 10px; }
.subtitle { text-align: center; color: #94a3b8; margin-bottom: 20px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px; }
.stat-card { background: linear-gradient(135deg, rgba(56,189,248,0.1), rgba(37,99,235,0.1)); border: 1px solid rgba(56,189,248,0.3); padding: 20px; border-radius: 15px; text-align: center; }
.stat-value { font-size: 28px; font-weight: bold; color: #38bdf8; }
.stat-label { color: #94a3b8; font-size: 13px; margin-top: 5px; }
.status { background: rgba(16,185,129,0.1); border: 1px solid #10b981; padding: 12px; border-radius: 10px; text-align: center; margin: 15px 0; color: #34d399; font-weight: bold; }
.form-group { margin-bottom: 15px; }
label { display: block; margin-bottom: 6px; font-weight: bold; color: #cbd5e1; font-size: 14px; }
input, select, textarea { width: 100%; padding: 12px; border: 1px solid #334155; border-radius: 8px; font-size: 15px; background: #1e293b; color: #fff; transition: 0.3s; }
input:focus, select:focus { border-color: #38bdf8; outline: none; box-shadow: 0 0 0 3px rgba(56,189,248,0.2); }
.row { display: flex; gap: 10px; flex-wrap: wrap; }
.row .form-group { flex: 1; min-width: 150px; }
.btn { display: block; background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%); color: white; padding: 14px; border-radius: 12px; text-align: center; border: none; width: 100%; cursor: pointer; font-weight: bold; font-size: 16px; margin-top: 20px; transition: 0.3s; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(56,189,248,0.3); }
.backup-section { display: flex; gap: 10px; margin-top: 15px; }
.backup-btn { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #38bdf8; background: rgba(56,189,248,0.1); color: #38bdf8; font-weight: bold; cursor: pointer; transition: 0.3s; font-size: 13px; }
.backup-btn:hover { background: #38bdf8; color: #0f172a; }
.result { background: #090d16; border: 1px solid #334155; color: #38bdf8; padding: 20px; border-radius: 12px; margin-top: 20px; font-size: 14px; white-space: pre-wrap; display: none; line-height: 1.8; }
.copy-btn { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; margin: 5px; font-weight: bold; }
.spinner { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #38bdf8; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 10px auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 12px 25px; border-radius: 10px; font-weight: bold; z-index: 1000; }
.footer { text-align: center; padding: 30px 20px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 40px; }
</style>
</head>
<body>
<nav class="navbar">
  <div class="navbar-brand">🚀 Sales 24 Pro</div>
  <div class="navbar-links">
    <a href="/">🏠 الرئيسية</a>
    <a href="/campaigns">📋 الحملات</a>
    <a href="/analytics">📊 الإحصائيات</a>
    <a href="/login">👤 دخول</a>
  </div>
</nav>

<div class="container">
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value" id="stat-campaigns">0</div><div class="stat-label">إجمالي الحملات</div></div>
    <div class="stat-card"><div class="stat-value" id="stat-active">0</div><div class="stat-label">حملات نشطة</div></div>
    <div class="stat-card"><div class="stat-value" id="stat-profit">0</div><div class="stat-label">إجمالي الأرباح</div></div>
    <div class="stat-card"><div class="stat-value">⚡</div><div class="stat-label">سرعة تريليون</div></div>
  </div>

  <div class="card">
    <h1>🚀 الصاروخ النووي للتسويق والسوق المستهدف</h1>
    <p class="subtitle">منصة ذكية متكاملة لإدارة التسويق بمصر والسعودية</p>
    <div class="status">⚡ النظام يعمل بكفاءة تريليون في المية أونلاين</div>
    
    <!-- أزرار النسخ الاحتياطي وحفظ الملفات محلياً على التليفون -->
    <div class="backup-section">
      <button class="backup-btn" onclick="exportProjectsBackup()">💾 حفظ نسخة للمشاريع (تنزيل ملف)</button>
      <button class="backup-btn" onclick="document.getElementById('importFile').click()">📂 استرجاع نسخة من ملف</button>
      <input type="file" id="importFile" style="display:none" accept=".json" onchange="importProjectsBackup(event)" />
    </div>

    <div class="form-group" style="margin-top: 15px;">
      <label>🌍 السوق المستهدف والجمهور:</label>
      <select id="market" onchange="updateCurrencyLabels()">
        <option value="egypt">مصر 🇪🇬 (الجمهور المصري - بالجنيه المصري ج.م)</option>
        <option value="saudi">السعودية 🇸🇦 (الجمهور السعودي - بالريال السعودي ر.س)</option>
      </select>
    </div>

    <div class="form-group">
      <label>اسم المنتج: *</label>
      <input type="text" id="productName" placeholder="مثال: منظف الأصدقاء العام / عطور فاخرة..." />
    </div>
    
    <div class="row">
      <div class="form-group">
        <label id="priceLabel">سعر البيع (بالجنيه المصري):</label>
        <input type="number" id="price" placeholder="مثال: 250" />
      </div>
      <div class="form-group">
        <label id="costLabel">التكلفة (بالجنيه المصري):</label>
        <input type="number" id="cost" placeholder="مثال: 150" />
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
    </div>
    
    <button class="btn" id="analyzeBtn" onclick="runAnalysis()">🎯 إطلاق التحليل الشامل وحفظ الحملة</button>
    
    <div id="resultBox" class="result">
      <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:12px;">
        <button class="copy-btn" onclick="copyScript()">📋 نسخ السكريبت</button>
        <button class="copy-btn" onclick="downloadReport()">💾 تحميل التقرير</button>
      </div>
      <div id="resultContent"></div>
    </div>
  </div>
</div>

<div class="footer">
  <p>© 2026 Sales 24 Pro - الصاروخ النووي 🚀</p>
</div>

<script>
let latestScript = '';
let latestReport = '';

function updateCurrencyLabels() {
  const market = document.getElementById('market').value;
  const priceLabel = document.getElementById('priceLabel');
  const costLabel = document.getElementById('costLabel');
  
  if (market === 'saudi') {
    priceLabel.textContent = 'سعر البيع (بالريال السعودي ر.س):';
    costLabel.textContent = 'التكلفة (بالريال السعودي ر.س):';
  } else {
    priceLabel.textContent = 'سعر البيع (بالجنيه المصري ج.م):';
    costLabel.textContent = 'التكلفة (بالجنيه المصري ج.م):';
  }
}

function showToast(msg, type='success') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.background = type === 'error' ? '#ef4444' : '#10b981';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// تخزين المشاريع محلياً على تليفونك
function saveProjectLocally(projectData) {
  let projects = JSON.parse(localStorage.getItem('sales24_local_projects') || '[]');
  projects.unshift(projectData);
  localStorage.setItem('sales24_local_projects', JSON.stringify(projects));
  updateLocalStats();
}

function updateLocalStats() {
  const projects = JSON.parse(localStorage.getItem('sales24_local_projects') || '[]');
  document.getElementById('stat-campaigns').textContent = projects.length;
  document.getElementById('stat-active').textContent = projects.length > 0 ? projects.length : 0;
  let totalProfit = projects.reduce((sum, p) => sum + (p.profitPerUnit || 0), 0);
  document.getElementById('stat-profit').textContent = totalProfit.toFixed(0);
}

function exportProjectsBackup() {
  const projects = localStorage.getItem('sales24_local_projects') || '[]';
  const blob = new Blob([projects], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sales24-backup-' + Date.now() + '.json';
  a.click();
  showToast('تم حفظ نسخة المشاريع على التليفون بنجاح! 💾');
}

function importProjectsBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        localStorage.setItem('sales24_local_projects', JSON.stringify(importedData));
        updateLocalStats();
        showToast('تم استرجاع جميع المشاريع بنجاح! 🚀');
      } else {
        showToast('ملف غير صالح!', 'error');
      }
    } catch(err) {
      showToast('خطأ في قراءة الملف!', 'error');
    }
  };
  reader.readAsText(file);
}

async function loadStats() {
  updateLocalStats();
  try {
    const res = await fetch('/api/analytics/dashboard');
    const data = await res.json();
    if (data.success && data.data.totalCampaigns > 0) {
      document.getElementById('stat-campaigns').textContent = data.data.totalCampaigns;
      document.getElementById('stat-active').textContent = data.data.activeCampaigns || 0;
      document.getElementById('stat-profit').textContent = (data.data.totalProfit || 0).toFixed(0);
    }
  } catch(e) {}
}
loadStats();

async function runAnalysis() {
  const productName = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const market = document.getElementById('market').value;
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
      const uploadRes = await fetch('/api/upload-media', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.success) uploadedFileUrl = uploadData.data.url;
    }

    const res = await fetch('/api/comprehensive-marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, category, market, lightingScore, resolution, price, cost, uploadedFileUrl })
    });
    const responseData = await res.json();
    
    if (responseData.success) {
      const p = responseData.data.marketingPlan;
      const profit = responseData.data.profitDetails;
      const currencySymbol = market === 'saudi' ? 'ر.س' : 'ج.م';
      
      latestScript = p.contentPackage.script;

      latestReport = '✨ <b>التقرير التسويقي الشامل (' + (market === 'saudi' ? 'السوق السعودي 🇸🇦' : 'السوق المصري 🇪🇬') + '):</b><br><br>' + 
        '📦 <b>المنتج:</b> ' + p.product + '<br>' + 
        '🌍 <b>السوق المستهدف:</b> ' + (market === 'saudi' ? 'المملكة العربية السعودية' : 'جمهورية مصر العربية') + '<br>' + 
        (profit?.valid ? '💰 <b>الربح للوحدة:</b> ' + profit.profitPerUnit + ' ' + currencySymbol + ' | هامش الربح: ' + profit.profitMargin + '<br><br>' : '<br>') +
        '🔍 <b>دراسة السوق والجمهور:</b><br>' + p.marketResearch.targetAudience + '<br><br>' + 
        '📝 <b>السكريبت الموجه للجمهور:</b><br>' + p.contentPackage.script + '<br><br>' + 
        '🏷️ <b>الهاشتاجات الدعائية:</b> ' + p.contentPackage.hashtags;
      
      contentDiv.innerHTML = latestReport;
      
      // حفظ المشروع محلياً في تليفونك
      saveProjectLocally({
        productName: p.product,
        market,
        profitPerUnit: profit?.valid ? profit.profitPerUnit : 0,
        date: new Date().toLocaleDateString('ar-EG')
      });

      showToast('تم التحليل وحفظ المشروع على تليفونك بنجاح! ✨');
      loadStats();
    } else {
      contentDiv.innerHTML = '❌ ' + (responseData.message || 'خطأ غير معروف');
    }
  } catch(e) {
    contentDiv.innerHTML = '❌ فشل الاتصال بالسيرفر';
    showToast('فشل الاتصال!', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🎯 إطلاق التحليل الشامل وحفظ الحملة';
  }
}

function copyScript() {
  if (!latestScript) return showToast('لا يوجد سكريبت!', 'error');
  navigator.clipboard.writeText(latestScript).then(() => showToast('تم النسخ ✨'));
}
function downloadReport() {
  if (!latestReport) return;
  const blob = new Blob([latestReport.replace(/<[^>]*>/g, '')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'report-' + Date.now() + '.txt';
  a.click();
  showToast('تم التحميل!');
}
</script>
</body>
</html>`;
}

function getLoginHTML() {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><title>دخول</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{background:#0f172a;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui}.card{background:rgba(15,23,42,0.9);padding:30px;border-radius:15px;width:100%;max-width:380px;border:1px solid #334155}input{width:100%;padding:10px;margin:10px 0;background:#1e293b;border:1px solid #475569;color:#fff;border-radius:6px}button{width:100%;padding:12px;background:#38bdf8;border:none;color:#000;font-weight:bold;border-radius:6px;cursor:pointer}</style></head><body><div class="card"><h2>تسجيل الدخول</h2><input type="email" id="email" placeholder="البريد"><input type="password" id="pass" placeholder="كلمة المرور"><button onclick="login()">دخول</button></div><script>async function login(){const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value,password:document.getElementById('pass').value})});const d=r.json();if(d.success){localStorage.setItem('token',d.token);location.href='/';}else alert(d.message);}</script></body></html>`;
}

function getCampaignsHTML() {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><title>الحملات</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{background:#0f172a;color:#fff;padding:20px;font-family:system-ui}h1{color:#38bdf8;text-align:center}.card{background:rgba(15,23,42,0.9);border:1px solid #334155;padding:15px;border-radius:10px;margin-bottom:10px}.back{text-align:center;margin-top:20px}.back a{color:#38bdf8}</style></head><body><h1>📋 الحملات</h1><div id="list">جاري التحميل...</div><div class="back"><a href="/">← الرئيسية</a></div><script>async function load(){const r=await fetch('/api/campaigns');const d=await r.json();document.getElementById('list').innerHTML=d.data.map(x=>'<div class="card"><h3>'+x.productName+' ('+(x.market === 'saudi' ? 'السعودية 🇸🇦' : 'مصر 🇪🇬')+')</h3><p>الربح: '+x.profitPerUnit+'</p></div>').join('');}load();</script></body></html>`;
}

function getAnalyticsHTML() {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><title>الإحصائيات</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{background:#0f172a;color:#fff;padding:20px;font-family:system-ui}h1{color:#38bdf8;text-align:center}.back{text-align:center;margin-top:20px}.back a{color:#38bdf8}</style></head><body><h1>📊 الإحصائيات</h1><div style="text-align:center;margin-top:30px;"><p>لوحة التحليلات المتقدمة تعمل بكفاءة تريليونية 🚀</p></div><div class="back"><a href="/">← الرئيسية</a></div></body></html>`;
}
