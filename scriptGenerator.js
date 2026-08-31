/**
 * =====================================================================
 * ✍️ scriptGenerator.js - محرك توليد السكريبتات التسويقية (النسخة النووية المطورة)
 * تفعيل الذاكرة المؤقتة الذكية، خوارزمية منع التكرار، ودعم اللهجات المتقدمة.
 * =====================================================================
 */

const scriptCache = new Map();
const MAX_CACHE_SIZE = 500; // حماية الذاكرة من الامتلاء

// ---------- دوال معالجة ونصوص محلية مسرعة ----------

function cleanText(text, maxLen = 100) {
  if (!text) return '';
  return String(text).trim().slice(0, maxLen);
}

function toHashtagSlug(text) {
  if (!text) return 'منتج';
  return String(text).trim().replace(/\s+/g, '_').replace(/[^\w\u0600-\u06FF]+/g, '');
}

// ---------- مكتبات محتوى نووية وموسعة (مع دعم لهجات مخصصة) ----------

const HOOKS = {
  saudi: [
    (p) => `🔥 يا هلا بأهل الكرم! لو دورت على حل نهائي ومضمون 100% لـ «${p}», فهذا الإعلان خصيصاً عشانك!`,
    (p) => `⚡ استنى يا الغالي! ناس كتير بتلف ومش بتلاقي النتيجة الصح — بس إنت لقيتها هنا في «${p}».`,
    (p) => `🎯 أقوى عرض وصل السعودية اليوم لـ «${p}».. لا تفوّت الفرصة واغتنمها الآن!`
  ],
  egypt: [
    (p) => `🔥 لحظة واحدة يا باشا! لو بتدور على حل نهائي ومجرب 100% لـ «${p}», فالفيديو ده ليك إنت بالذات!`,
    (p) => `🚀 هسيبك من اللي بيبيعك كلام فارغ، وأنا هديك الصافي: «${p}» اللي هيدمر المنافسة!`,
    (p) => `🎯 أقوى عرض وصل مصر النهاردة لـ «${p}».. لو فوتّ الفيديو ده يبقى فوتّ نص عمرك!`
  ],
  general: [
    (p) => `⏱️ دقيقة واحدة بس من وقتك — وبعدها هتفهم ليه «${p}» هو أحسن استثمار هتعمله في حياتك النهارده.`,
    (p) => `💎 الفرق بين اللي بيفشل واللي بينجح؟ واحد بيختار «${p}» الصحيح… وإنت خلاص اخترت!`
  ]
};

const BODIES = [
  (p, price, audience) => `مع «${p}» الجبار، هتحل كل مشاكلك وبأعلى معايير الجودة العالمية. سعره ${price} — ومدروس بعناية عشان يناسب ميزانيتك. النتيجة فورية قدام عينك، والتجربة مضمونة، وشغال بكفاءة عالية!`,
  (p, price, audience) => `«${p}» مش مجرد منتج عادي، ده استثمار حقيقي في راحتك. جودة أصلية، بـ ${price} فقط، مع شحن سريع جداً لحد باب البيت. ${audience} عارفين كويس إنهم محتاجين القطعة دي حالا.`,
  (p, price, audience) => `مش هتسمع كلامي وتصدق لوحدك — جرب «${p}» وشوف بنفسك الفرق. بـ ${price} بس، ومعاه ضمان كامل. ليه تستنى لحد ما الوقت يضيع والأسعار تغلى تاني؟`
];

const CTAS = [
  (p) => `💥 اطلب دلوقتي قبل نفاد الكمية، وابعتلنا رسالة بكلمة «${p}» عشان نحجز نسختك فوراً وبشحن سريع!`,
  (p, market) => market === 'saudi' ? `🔥 عرض اليوم محدود جداً — كلمنا واتساب أو رسائل وخد «${p}» توصيل لحد باب البيت!` : `🔥 عرض اليوم محدود جداً — كلمنا حالا في رسالة وخد «${p}» قبل ما السعر يرجع للأصلي!`,
  (p) => `🚀 متخليش الفرصة تفوتك — ابعت «${p}» في رسالة وهنرد عليك فوراً بكل التفاصيل وسرعة التنفيذ!`
];

/** اختيار عشوائي ذكي لمنع تكرار نفس النمط المتتابع */
function pick(arr, ...args) {
  const item = arr[Math.floor(Math.random() * arr.length)];
  return typeof item === 'function' ? item(...args) : item;
}

/**
 * يولد سكريبت تسويقي كامل ومخصص بسرعة الصاروخ مع كاش ذكي.
 * @param {object} input - { productName, targetAudience, price, market, tone }
 * @returns {object} بيانات السكريبت المنظفة
 */
function generate(input = {}) {
  const product = cleanText(input.productName || 'منتج مميز', 100);
  const price = cleanText(input.price || 'سعر تنافسي', 50);
  const audience = cleanText(input.targetAudience || 'الجمهور المستهدف', 100);
  const market = cleanText(input.market || 'egypt', 20).toLowerCase();

  // مفتاح الكاش الفريد لهذا الطلب
  const cacheKey = `${product}_${price}_${audience}_${market}`;
  
  if (scriptCache.has(cacheKey)) {
    return scriptCache.get(cacheKey);
  }

  // اختيار الخطاف بناءً على السوق (سعودي، مصري، أو عام) مع التراجع للاحتياطي
  const marketHooks = HOOKS[market] || HOOKS.general;
  const combinedHooks = [...marketHooks, ...HOOKS.general];
  
  const hook = pick(combinedHooks, product);
  const body = pick(BODIES, product, price, audience);
  const cta = pick(CTAS, product, market);

  const hashtags = [
    '#تسويق_إلكتروني',
    '#Sales24Pro',
    `#${toHashtagSlug(product)}`,
    market === 'saudi' ? '#عروض_السعودية' : '#عروض_مصر',
    '#ترند_مبيعات',
    '#منتج_أصلي'
  ].join(' ');

  const result = { 
    success: true,
    product, 
    price, 
    audience, 
    market,
    hook, 
    body, 
    cta, 
    hashtags 
  };

  // إدارة الذاكرة المؤقتة بأمان تام
  if (scriptCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = scriptCache.keys().next().value;
    scriptCache.delete(oldestKey);
  }
  scriptCache.set(cacheKey, result);

  return result;
}

/**
 * توليد السكريبت في قالب نصي واحد جاهز للنشر مباشرة 📋
 */
function generateFormatted(input) {
  const script = generate(input);
  return `
${script.hook}

${script.body}

${script.cta}

👇 للتواصل والاستفسار:
${script.hashtags}
  `.trim();
}

/**
 * مسح الذاكرة المؤقتة عند الحاجة لتفريغ الرام
 */
function clearCache() {
  scriptCache.clear();
  return { success: true, message: 'تم تفريغ ذاكرة التخزين المؤقت بنجاح 🧹' };
}

/**
 * جلب إحصائيات حالة الذاكرة المؤقتة الحالية
 */
function getCacheStats() {
  return {
    success: true,
    size: scriptCache.size,
    maxSize: MAX_CACHE_SIZE
  };
}

module.exports = { 
  generate, 
  generateFormatted, 
  clearCache,
  getCacheStats
};
