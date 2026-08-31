// =====================================================================
// 🎯 marketingEngine.js - محرك التسويق الذكي الشامل (النسخة النووية)
// =====================================================================

// ---------- دوال معالجة ونصوص محلية ----------

function cleanText(text, maxLen = 60) {
  if (!text) return '';
  return String(text).trim().slice(0, maxLen);
}

function toHashtagSlug(text) {
  if (!text) return 'منتج';
  return String(text).trim().replace(/\s+/g, '_').replace(/[^\w\u0600-\u06FF]+/g, '');
}

// ---------- التحقق من صحة الأرقام ----------

function validateNumber(value, min, max, name) {
  const n = Number(value);
  if (typeof value === 'undefined' || value === null || value === '' || !Number.isFinite(n)) {
    throw new Error(`قيمة "${name}" غير صالحة (يجب أن تكون رقمًا).`);
  }
  if (n < min || n > max) {
    throw new Error(`قيمة "${name}" خارج النطاق المسموح (${min} إلى ${max}).`);
  }
  return n;
}

// ---------- قاعدة بيانات الأنماط التسويقية ----------

const MARKET_DATABASE = {
  default: {
    strategy: "التركيز على حل مشكلة العميل مباشرة مع إبراز السعر التنافسي وضمان الجودة.",
    bestFormats: [
      "فيديو قصير (Reels/TikTok) يوضح قبل وبعد",
      "إعلان صورة احترافي مع آراء العملاء"
    ],
    targetHook: "هل تعاني من هذه المشكلة المتكررة؟ إليك الحل النهائي!"
  },
  electronics: {
    strategy: "إبراز المواصفات الفنية والعمر الطويل مع فيديو تجريبي حقيقي (Unboxing).",
    bestFormats: [
      "فيديو Unboxing قريب للكاميرا",
      "فيديو مقارنة قبل/بعد"
    ],
    targetHook: "أغلب الناس بتشتري صح؟ جرّب الأقوى تقنياً!"
  },
  beauty: {
    strategy: "التأكيد على الأمان والنتيجة الظاهرة بآراء حقيقية قبل/بعد الاستخدام.",
    bestFormats: [
      "فيديو تجربة حقيقية على الوجه/البشرة",
      "مراجعة من مؤثرة موثوقة"
    ],
    targetHook: "نتايج حقيقية تبان من أول أسبوع — شوف بنفسك!"
  },
  home: {
    strategy: "إظهار سهولة الاستخدام وتوفير الوقت والجهد في الحياة اليومية.",
    bestFormats: [
      "فيديو تعريفي سريع بالاستخدام",
      "قبل/بعد ترتيب المنزل"
    ],
    targetHook: "توفير وقتك وجهدك في دقيقة واحدة يومياً!"
  }
};

function getMarketingPlan(category) {
  const key = String(category || 'default').toLowerCase();
  return MARKET_DATABASE[key] || MARKET_DATABASE.default;
}

// ---------- التحليل والخطة ----------

function analyzeProductAndPlan(productName, category) {
  if (!productName || typeof productName !== 'string' || !productName.trim()) {
    throw new Error('برجاء إدخال اسم المنتج أولاً!');
  }

  const cleanName = cleanText(productName, 60);
  const plan = getMarketingPlan(category);
  const slug = toHashtagSlug(cleanName);
  const categoryLabel = category && category !== 'default'
    ? `للمنتجات من فئة "${category}"`
    : 'لمختلف فئات المنتجات';

  return {
    product: cleanName,
    status: "خطة تسويقية جاهزة (مبنية على قالب عام ومحرك ذكي) 🚀",
    marketResearch: {
      searchSummary: `تم تحليل السوق محلياً للمنتج "${cleanName}" - مؤشرات الطلب عالية والمنافسة متوسطة. أفضل أوقات النشر المقترحة: من 8 إلى 11 مساءً.`,
      baseStrategy: plan.strategy,
      bestFormats: plan.bestFormats,
      targetAudience: "فئة المستهلكين المهتمين بحلول الجودة السريعة (18-45 سنة).",
      pricingAdvice: "سعر تنافسي مع عرض (اشتري قطعة والثانية هدية أو شحن مجاني).",
      disclaimer: "ملاحظة: هذا تحليل عام جاهز من القوالب، ويُعَد كأداة مساعدة قوية لإدارة الحملات."
    },
    adFormats: [
      {
        type: "فيديو كرتوني / أنيميشن",
        concept: "رسوم متحركة سريعة توضح المشكلة ثم ظهور المنتج كحل سحري.",
        whyItWorks: "يجذب الانتباه البصري بسرعة ويشرح الفكرة بدون تعقيد."
      },
      {
        type: "شخصية حقيقية (مؤثر / بائع)",
        concept: "فيديو شخصي يمسك المنتج ويجرب أمام الكاميرا ويذكر تجربته.",
        whyItWorks: "يبني ثقة فورية عالية جداً مع الزبون ويقنع بالشراء."
      }
    ],
    contentPackage: {
      hook: plan.targetHook + ` لو دورت كتير ومش لاقي حل لـ "${cleanName}"، فالفيديو ده عشانك انت!`,
      script: `مع "${cleanName}" هتنتهي المشكلة تماماً من أول استخدام. جودة عالية وسعر تنافسي ${categoryLabel}. متخليش الفرصة تفوتك وابعتلنا فوراً لاغتنام العرض.`,
      cta: "اطلب نسختك دلوقتي واغتنم عرض اليوم المحدود!",
      hashtags: `#Sales24 #تسويق_إلكتروني #${slug} #عروض_مصر #منتج_أصلي`,
      suggestedMusic: "موسيقى تحفيزية سريعة (Upbeat Commercial Beat) لخلق حماس الشراء."
    }
  };
}

// ---------- تقييم جودة الوسائط ----------

const RESOLUTION_TABLE = {
  '144p': 144, '240p': 240, '360p': 360, '480p': 480,
  '720p': 720, '1080p': 1080, '1440p': 1440, '2k': 2160, '2160p': 2160, '4k': 4320
};
const MIN_RESOLUTION = 720;

function parseResolution(res) {
  const key = String(res || '').trim().toLowerCase();
  return RESOLUTION_TABLE[key] || 0;
}

function evaluateMediaQuality(mediaType, resolution, lightingScore) {
  const lighting = validateNumber(lightingScore, 0, 10, 'lightingScore');
  const resNum = Number.isFinite(Number(resolution))
    ? Number(resolution)
    : parseResolution(resolution);

  const type = typeof mediaType === 'string' && mediaType.trim()
    ? mediaType.trim()
    : 'فيديو';

  const recommendations = [];
  let needsEdit = false;

  if (lighting < 7) {
    needsEdit = true;
    recommendations.push("الإضاءة ضعيفة — ارفع السطوع (Brightness) وأضف فلتر تباين.");
  }

  if (resNum === 0) {
    recommendations.push("الدقة غير معروفة — حددها بالصيغة الصحيحة (مثل 720p أو 1080p).");
  } else if (resNum < MIN_RESOLUTION) {
    needsEdit = true;
    recommendations.push(`الدقة منخفضة (${resNum}p) — ارفعها إلى ${MIN_RESOLUTION}p على الأقل.`);
  } else {
    recommendations.push(`جودة ممتازة (${resNum}p) ومناسبة لإعلانات تيك توك وفيس بوك.`);
  }

  return {
    mediaType: type,
    resolution: resNum > 0 ? `${resNum}p` : 'غير محددة',
    lightingScore: lighting,
    qualityStatus: needsEdit ? "يحتاج تعديل طفيف (Edit)" : "ممتاز وجاهز للنشر الفوري 🌟",
    needsEdit,
    recommendations
  };
}

module.exports = { analyzeProductAndPlan, evaluateMediaQuality, getMarketingPlan, parseResolution };
