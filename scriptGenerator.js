/**
 * محرك توليد السكريبتات التسويقية - النسخة النووية الصاروخية 🚀
 * تفعيل الذاكرة المؤقتة الذكية (In-Memory Caching) وتوسيع محركات الإبداع.
 */

// ذاكرة مؤقتة فائقة السرعة لمنع تكرار المعالجة لنفس المنتجات (Cache Rocket)
const scriptCache = new Map();
const MAX_CACHE_SIZE = 500; // حماية الذاكرة من الامتلاء

// ---------- دوال معالجة ونصوص محلية مسرعة ----------

function cleanText(text, maxLen = 60) {
  if (!text) return '';
  return String(text).trim().slice(0, maxLen);
}

function toHashtagSlug(text) {
  if (!text) return 'منتج';
  return String(text).trim().replace(/\s+/g, '_').replace(/[^\w\u0600-\u06FF]+/g, '');
}

// ---------- مكتبات محتوى نووية وموسعة لضمان إبداع لا ينتهي ----------

const HOOKS = [
  (p) => `🔥 لحظة واحدة! لو بتدور على حل نهائي ومجرب 100% لـ «${p}», فالفيديو ده ليك إنت بالذات!`,
  (p) => `⚡ استنى شوية! ناس كتير بتلف وتدور ومش بتلاقي النتيجة الصح — بس إنت لقيتها هنا في «${p}».`,
  (p) => `🚀 هسيبك مع اللي بيبيعك كلام فارغ، وأنا هديك الصافي: «${p}» اللي هيدمر المنافسة!`,
  (p) => `⏱️ دقيقة واحدة بس من وقتك — وبعدها هتفهم ليه «${p}» هو أحسن استثمار هتعمله في حياتك النهارده.`,
  (p) => `💎 الفرق بين اللي بيفشل واللي بينجح؟ واحد بيختار «${p}» الصحيح… وإنت خلاص اخترت!`,
  (p) => `🎯 أقوى عرض وصل مصر النهاردة لـ «${p}».. لو فوتّ الفيديو ده يبقى فوتّ نص عمرك!`
];

const BODIES = [
  (p, price, audience) => `مع «${p}» الجبار، هتحل كل مشاكلك وبأعلى معايير الجودة العالمية. سعره ${price} — ومدروس بعناية عشان يناسب ميزانيتك. النتيجة فورية قدام عينك، والتجربة مضمونة، وشغال بكفاءة تريليون في المية!`,
  (p, price, audience) => `«${p}» مش مجرد منتج عادي، ده استثمار حقيقي في راحتك. جودة أصلية، بـ ${price} فقط، مع شحن سريع جداً لحد باب البيت. ${audience} عارفين كويس إنهم محتاجين القطعة دي حالا.`,
  (p, price, audience) => `مش هتسمع كلامي وتصدق لوحدك — جرب «${p}» وشوف بنفسك الفرق. بـ ${price} بس، ومعاه ضمان كامل. ليه تستنى لحد ما الوقت يضيع والأسعار تغلى تاني؟`,
  (p, price, audience) => `لو إنت من ${audience} المميزين، فـ «${p}» اتصنع خصيصاً عشانك. خامات عالية الجودة، السعر ${price}، والنتيجة تظهر من أول استخدام. عرض تدمير الأسعار لفترة محدودة!`
];

const CTAS = [
  (p) => `💥 اطلب دلوقتي قبل نفاد الكمية، وابعتلنا رسالة بكلمة «${p}» عشان نحجز نسختك فوراً وبشحن مجاني أو مخفض!`,
  (p) => `🔥 عرض اليوم النووي محدود جداً — كلمنا حالا في رسالة وخد «${p}» قبل ما السعر يرجع للأصلي!`,
  (p) => `🎯 اضغط ابعتلنا رسالة دلوقتي واطلب «${p}»، ومتترددش لأن الكميات تخلص بسرعة البرق!`,
  (p) => `🚀 متخليش الفرصة تفوتك ديماً — ابعت «${p}» في رسالة وهنرد عليك فوراً بكل التفاصيل وسرعة التنفيذ!`
];

/** اختيار عشوائي سليم (آمن رياضيًا وسريع) من مصفوفة */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * يولد سكريبت تسويقي كامل ومخصص بسرعة الصاروخ مع كاش ذكي.
 * @param {object} input - { productName, targetAudience, price }
 * @returns {object} بيانات السكريبت المنظفة
 */
function generate(input) {
  // تنظيف المدخلات
  const product = cleanText(input.productName, 60);
  const price = cleanText(input.price || 'سعر تنافسي', 30);
  const audience = cleanText(input.targetAudience || 'الجمهور المستهدف', 80);

  // مفتاح الكاش الفريد لهذا الطلب
  const cacheKey = `${product}_${price}_${audience}`;
  
  // لو النتيجة موجودة في الكاش السريع، رجعها في جزء من الميكرو ثانية! ⚡
  if (scriptCache.has(cacheKey)) {
    return scriptCache.get(cacheKey);
  }

  // توليد أجزاء متنوعة وخارقة
  const hook = pick(HOOKS)(product);
  const body = pick(BODIES)(product, price, audience);
  const cta = pick(CTAS)(product);

  const hashtags = [
    '#تسويق_إلكتروني',
    '#Sales24Pro',
    `#${toHashtagSlug(product)}`,
    '#عروض_مصر_النووية',
    '#ترند_مبيعات',
    audience === 'الجمهور المستهدف' ? '#منتج_أصلي_معتمد' : '#عرض_مباشر'
  ].join(' ');

  const result = { product, price, audience, hook, body, cta, hashtags };

  // تخزين النتيجة في الكاش (مع التحقق من عدم تخطي الحجم الأقصى للذاكرة)
  if (scriptCache.size >= MAX_CACHE_SIZE) {
    const firstKey = scriptCache.keys().next().value;
    scriptCache.delete(firstKey);
  }
  scriptCache.set(cacheKey, result);

  return result;
}

module.exports = { generate };
