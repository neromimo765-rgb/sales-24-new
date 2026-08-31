// =====================================================================
// 🚀 Sales 24 Pro - النسخة المحلية الخالصة (تخزين على التليفون 100%)
// =====================================================================
require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const logger = require('./logger');
const scriptGenerator = require('./scriptGenerator');
const marketingEngine = require('./marketingEngine');
const { calculateProfit } = require('./profitCalculator');
const { upload, handleUploadErrors } = require('./uploadConfig');

const { 
  requestId, 
  notFoundHandler, 
  globalErrorHandler 
} = require('./middleware');

const app = express();

// =====================================================================
// 🛡️ الأمان والحماية
// =====================================================================
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression({ level: 6, threshold: 1024 }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(requestId);

// =====================================================================
// 📁 الملفات الثابتة
// =====================================================================
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', etag: true }));
app.use('/public', express.static(publicDir, { maxAge: '7d', etag: true }));

// =====================================================================
// 🌐 الصفحات الرئيسية
// =====================================================================
app.get('/', (req, res) => {
  res.send(getMainDashboardHTML());
});

// =====================================================================
// 🔌 مسارات الـ API (تعمل بالكامل وتعتمد على محرك التسويق والأرباح)
// =====================================================================

// التحليل التسويقي الشامل وحساب الأرباح
app.post('/api/comprehensive-marketing', (req, res) => {
  try {
    const { productName, category, lightingScore, resolution, price, cost, market } = req.body;
    
    const targetMarket = ['saudi', 'uae', 'gulf'].includes(market) ? market : 'egypt';
    const marketingPlan = marketingEngine.analyzeProductAndPlan(productName, category, targetMarket);
    const mediaCheck = marketingEngine.evaluateMediaQuality('فيديو', resolution || '1080p', lightingScore || 8);
    const profitDetails = calculateProfit(price || 0, cost || 0, 1);

    res.json({
      success: true,
      requestId: req.id,
      data: { marketingPlan, mediaCheck, profitDetails, market: targetMarket }
    });
  } catch (error) {
    logger.error('خطأ في التحليل الشامل:', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

// رفع الوسائط
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

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', mode: 'Local Storage Only', uptime: process.uptime() });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Sales 24 Pro - Local Storage Edition Running on Port ${PORT}`);
  logger.info(`🚀 Sales 24 Pro (محلي) يعمل على المنفذ ${PORT}`);
});

// =====================================================================
// 📄 واجهة المستخدم (HTML & LocalStorage Management)
// =====================================================================
function getMainDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<title>Sales 24 Pro - التخزين المحلي</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { font-family: 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
body { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f8fafc; min-height: 100vh; padding: 15px; }
.container { max-width: 800px; margin: 0 auto; }
.card { background: rgba(15,23,42,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); margin-bottom: 20px; }
h1 { color: #38bdf8; text-align: center; font-size: 22px; margin-bottom: 5px; }
.subtitle { text-align: center; color: #94a3b8; margin-bottom: 15px; font-size: 13px; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
.stat-card { background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.2); padding: 15px; border-radius: 12px; text-align: center; }
.stat-value { font-size: 24px; font-weight: bold; color: #38bdf8; }
.stat-label { color: #94a3b8; font-size: 12px; margin-top: 3px; }
.form-group { margin-bottom: 12px; }
label { display: block; margin-bottom: 5px; font-weight: bold; color: #cbd5e1; font-size: 13px; }
input, select, textarea { width: 100%; padding: 10px; border: 1px solid #334155; border-radius: 8px; font-size: 14px; background: #1e293b; color: #fff; }
input:focus, select:focus { border-color: #38bdf8; outline: none; }
.row { display: flex; gap: 10px; }
.row .form-group { flex: 1; }
.btn { display: block; background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%); color: white; padding: 12px; border-radius: 10px; text-align: center; border: none; width: 100%; cursor: pointer; font-weight: bold; font-size: 15px; margin-top: 15px; }
.backup-section { display: flex; gap: 8px; margin-top: 15px; }
.backup-btn { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #38bdf8; background: rgba(56,189,248,0.1); color: #38bdf8; font-weight: bold; cursor: pointer; font-size: 12px; text-align: center; }
.result { background: #090d16; border: 1px solid #334155; color: #38bdf8; padding: 15px; border-radius: 10px; margin-top: 15px; font-size: 13px; white-space: pre-wrap; display: none; line-height: 1.6; }
.copy-btn { background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-top: 8px; font-weight: bold; }
.toast { position: fixed; top: 15px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; z-index: 1000; font-size: 13px; }
.spinner { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #38bdf8; border-radius: 50%; width: 25px; height: 25px; animation: spin 1s linear infinite; margin: 10px auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <h1>🚀 Sales 24 Pro</h1>
    <p class="subtitle">نسخة التخزين المحلي على التليفون (بدون قواعد بيانات)</p>
    
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value" id="stat-campaigns">0</div><div class="stat-label">المشاريع المحفوظة</div></div>
      <div class="stat-card"><div class="stat-value" id="stat-profit">0</div><div class="stat-label">إجمالي الأرباح</div></div>
    </div>

    <!-- أزرار النسخ الاحتياطي وحفظ الملفات محلياً على التليفون -->
    <div class="backup-section">
      <button class="backup-btn" onclick="exportProjectsBackup()">💾 تنزيل نسخة المشاريع</button>
      <button class="backup-btn" onclick="document.getElementById('importFile').click()">📂 استرجاع من ملف</button>
      <input type="file" id="importFile" style="display:none" accept=".json" onchange="importProjectsBackup(event)" />
    </div>

    <div class="form-group" style="margin-top: 15px;">
      <label>🌍 السوق المستهدف:</label>
      <select id="market" onchange="updateCurrencyLabels()">
        <option value="egypt">مصر 🇪🇬 (بالجنيه المصري ج.م)</option>
        <option value="saudi">السعودية 🇸🇦 (بالريال السعودي ر.س)</option>
      </select>
    </div>

    <div class="form-group">
      <label>اسم المنتج: *</label>
      <input type="text" id="productName" placeholder="مثال: منظف الأصدقاء العام..." />
    </div>
    
    <div class="row">
      <div class="form-group">
        <label id="priceLabel">سعر البيع:</label>
        <input type="number" id="price" placeholder="250" />
      </div>
      <div class="form-group">
        <label id="costLabel">التكلفة:</label>
        <input type="number" id="cost" placeholder="150" />
      </div>
    </div>

    <div class="form-group">
      <label>فئة المنتج:</label>
      <select id="productCategory">
        <option value="default">عام (Default)</option>
        <option value="cleaning">منظفات ومنتجات منزلية</option>
        <option value="electronics">إلكترونيات وأجهزة</option>
        <option value="beauty">تجميل وعناية</option>
      </select>
    </div>

    <div class="row">
      <div class="form-group">
        <label>الإضاءة (0-10):</label>
        <input type="number" id="lightingScore" value="8" min="0" max="10" />
      </div>
      <div class="form-group">
        <label>دقة الفيديو:</label>
        <select id="resolution">
          <option value="1080p">1080p (FHD)</option>
          <option value="720p">720p (HD)</option>
        </select>
      </div>
    </div>
    
    <button class="btn" id="analyzeBtn" onclick="runAnalysis()">🎯 إطلاق التحليل وحفظ على التليفون</button>
    
    <div id="resultBox" class="result">
      <div id="resultContent"></div>
      <button class="copy-btn" onclick="copyScript()">📋 نسخ السكريبت</button>
    </div>
  </div>
</div>

<script>
let latestScript = '';

function updateCurrencyLabels() {
  const market = document.getElementById('market').value;
  document.getElementById('priceLabel').textContent = market === 'saudi' ? 'سعر البيع (ر.س):' : 'سعر البيع (ج.م):';
  document.getElementById('costLabel').textContent = market === 'saudi' ? 'التكلفة (ر.س):' : 'التكلفة (ج.م):';
}

function showToast(msg, type='success') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.background = type === 'error' ? '#ef4444' : '#10b981';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function updateLocalStats() {
  const projects = JSON.parse(localStorage.getItem('sales24_local_projects') || '[]');
  document.getElementById('stat-campaigns').textContent = projects.length;
  let totalProfit = projects.reduce((sum, p) => sum + (p.profitPerUnit || 0), 0);
  document.getElementById('stat-profit').textContent = totalProfit.toFixed(0);
}
updateLocalStats();

function saveProjectLocally(projectData) {
  let projects = JSON.parse(localStorage.getItem('sales24_local_projects') || '[]');
  projects.unshift(projectData);
  localStorage.setItem('sales24_local_projects', JSON.stringify(projects));
  updateLocalStats();
}

function exportProjectsBackup() {
  const projects = localStorage.getItem('sales24_local_projects') || '[]';
  const blob = new Blob([projects], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sales24-backup-' + Date.now() + '.json';
  a.click();
  showToast('تم تحميل نسخة المشاريع على تليفونك! 💾');
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
        showToast('تم استرجاع المشاريع بنجاح! 🚀');
      } else {
        showToast('ملف غير صالح!', 'error');
      }
    } catch(err) {
      showToast('خطأ في قراءة الملف!', 'error');
    }
  };
  reader.readAsText(file);
}

async function runAnalysis() {
  const productName = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const market = document.getElementById('market').value;
  const lightingScore = document.getElementById('lightingScore').value;
  const resolution = document.getElementById('resolution').value;
  const price = document.getElementById('price').value;
  const cost = document.getElementById('cost').value;
  const box = document.getElementById('resultBox');
  const contentDiv = document.getElementById('resultContent');
  const btn = document.getElementById('analyzeBtn');
  
  if (!productName) {
    showToast('اكتب اسم المنتج الأول!', 'error');
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '⏳ جاري المعالجة...';
  box.style.display = 'block';
  contentDiv.innerHTML = '<div class="spinner"></div><p style="text-align:center;">جاري الحساب...</p>';
  
  try {
    const res = await fetch('/api/comprehensive-marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, category, market, lightingScore, resolution, price, cost })
    });
    const responseData = await res.json();
    
    if (responseData.success) {
      const p = responseData.data.marketingPlan;
      const profit = responseData.data.profitDetails;
      const currencySymbol = market === 'saudi' ? 'ر.س' : 'ج.م';
      
      latestScript = p.contentPackage.script;

      contentDiv.innerHTML = '✨ <b>التقرير التسويقي:</b><br><br>' + 
        '📦 <b>المنتج:</b> ' + p.product + '<br>' + 
        (profit?.valid ? '💰 <b>الربح للوحدة:</b> ' + profit.profitPerUnit + ' ' + currencySymbol + ' (هامش: ' + profit.profitMargin + ')<br><br>' : '<br>') +
        '📝 <b>السكريبت:</b><br>' + p.contentPackage.script + '<br><br>' + 
        '🏷️ <b>الهاشتاجات:</b> ' + p.contentPackage.hashtags;
      
      // حفظ محلي في التليفون
      saveProjectLocally({
        productName: p.product,
        market,
        profitPerUnit: profit?.valid ? profit.profitPerUnit : 0,
        date: new Date().toLocaleDateString('ar-EG')
      });

      showToast('تم الحفظ على التليفون بنجاح! ✨');
    } else {
      contentDiv.innerHTML = '❌ ' + (responseData.message || 'خطأ');
    }
  } catch(e) {
    contentDiv.innerHTML = '❌ فشل الاتصال بالسيرفر الداخلي';
    showToast('فشل الاتصال!', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🎯 إطلاق التحليل وحفظ على التليفون';
  }
}

function copyScript() {
  if (!latestScript) return showToast('لا يوجد سكريبت!', 'error');
  navigator.clipboard.writeText(latestScript).then(() => showToast('تم نسخ السكريبت ✨'));
}
</script>
</body>
</html>`;
}
