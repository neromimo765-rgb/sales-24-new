// =====================================================================
// 🎯 marketingEngine.js - محرك التسويق الذكي الشامل (النسخة النووية المطورة)
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

// ---------- قاعدة بيانات الأنماط التسويقية (موسعة حسب السوق) ----------

const MARKET_DATABASE = {
  default: {
    strategy: "التركيز على حل مشكلة العميل مباشرة مع إبراز السعر التنافسي وضمان الجودة.",
    bestFormats: [
      "فيديو قصير (Reels/TikTok) يوضح قبل وبعد",
      "إعلان صورة احترافي مع آراء العملاء"
    ],
    targetHookEgypt: "هل تعاني من هذه المشكلة المتكررة؟ إليك الحل النهائي!",
    targetHookSaudi: "تعاني من هالمشكلة وتبغي الحل الأكيد؟ إليك الخلاصة!"
  },
  electronics: {
    strategy: "إبراز المواصفات الفنية والعمر الطويل مع فيديو تجريبي حقيقي (Unboxing).",
    bestFormats: [
      "فيديو Unboxing قريب للكاميرا",
      "فيديو مقارنة قبل/بعد"
    ],
    targetHookEgypt: "أغلب الناس بتشتري صح؟ جرّب الأقوى تقنياً!",
    targetHookSaudi: "تبي الأداء الأقوى والجودة اللي تعيش معك؟ لا تفوتك التقنية هذي!"
  },
  beauty: {
    strategy: "التأكيد على الأمان والنتيجة الظاهرة بآراء حقيقية قبل/بعد الاستخدام.",
    bestFormats: [
      "فيديو تجربة حقيقية على الوجه/البشرة",
      "مراجعة من مؤثرة موثوقة"
    ],
    targetHookEgypt: "نتايج حقيقية تبان من أول أسبوع — شوف بنفسك!",
    targetHookSaudi: "نتائج مضمونة وتبان من أول استخدام — شوفي بنفسك النقاء والجمال!"
  },
  home: {
    strategy: "إظهار سهولة الاستخدام وتوفير الوقت والجهد في الحياة اليومية.",
    bestFormats: [
      "فيديو تعريفي سريع بالاستخدام",
      "قبل/بعد ترتيب المنزل"
    ],
    targetHookEgypt: "توفير وقتك وجهدك في دقيقة واحدة يومياً!",
    targetHookSaudi: "وفّر وقتك وجهدك في ثوانٍ معدودة — ريح بيتك بكل سهولة!"
  },
  fashion: {
    strategy: "التركيز على الشياكة، جودة الخامات، وملاءمة الموضة الحالية.",
    bestFormats: [
      "فيديو عرض أزياء (Outfit Transition)",
      "تنسيق إطلالات مختلفة بقطعة واحدة"
    ],
    targetHookEgypt: "لوك العيد أو الخروجة وصل! خلي إطلالتك خطف للأضواء.",
    targetHookSaudi: "إطلالتك المميزة وصلت! كن محط الأنظار في كل مناسبة."
  }
};

function getMarketingPlan(category) {
  const key = String(category || 'default').toLowerCase();
  return MARKET_DATABASE[key] || MARKET_DATABASE.default;
}

// ---------- التحليل والخطة (المحدثة لتشمل السوق المستهدف: مصر أو السعودية) ----------

function analyzeProductAndPlan(productName, category, targetMarket = 'egypt', platform = 'general') {
  if (!productName || typeof productName !== 'string' || !productName.trim()) {
    throw new Error('برجاء إدخال اسم المنتج أولاً!');
  }

  const cleanName = cleanText(productName, 60);
  const plan = getMarketingPlan(category);
  const slug = toHashtagSlug(cleanName);
  
  // تحديد اللهجة والسوق (مصر أو السعودية)
  const isSaudi = targetMarket === 'saudi';
  const marketName = isSaudi ? 'المملكة العربية السعودية 🇸🇦' : 'جمهورية مصر العربية 🇪🇬';
  const currency = isSaudi ? 'ريال سعودي' : 'جنيه مصري';
  
  const targetHook = isSaudi ? plan.targetHookSaudi : plan.targetHookEgypt;
  
  const categoryLabel = category && category !== 'default'
    ? `للمنتجات الفاخرة من فئة "${category}"`
    : 'لمختلف فئات المنتجات';

  const platformTarget = platform === 'tiktok' 
    ? 'مخصص لجمهور تيك توك السريع (إيقاع سريع وإبهار بصري)' 
    : platform === 'facebook' 
    ? 'مخصص لجمهور فيسبوك المهتم بالتفاصيل والعروض' 
    : 'خطة تسويقية شاملة لكافة المنصات';

  const scriptText = isSaudi 
    ? `مع "${cleanName}" بتنتهي المشكلة نهائياً من أول استخدام. جودة عالية وتناسب ذوقك الرفيع ${categoryLabel}. لا تفوت الفرصة واطلبها الحين قبل نفاد الكمية والتوصيل لحد باب البيت!`
    : `مع "${cleanName}" هتنتهي المشكلة تماماً من أول استخدام. جودة عالية وسعر تنافسي ${categoryLabel}. متخليش الفرصة تفوتك وابعتلنا فوراً لاغتنام العرض والشحن لحد باب البيت.`;

  return {
    product: cleanName,
    market: marketName,
    platform: platformTarget,
    status: "خطة تسويقية ذكية جاهزة ومخصصة للسوق المستهدف 🚀",
    marketResearch: {
      searchSummary: `تم تحليل السوق في ${marketName} للمنتج "${cleanName}" - مؤشرات الطلب عالية والمنافسة متوسطة. أفضل أوقات النشر المقترحة: من 7 إلى 11 مساءً.`,
      baseStrategy: plan.strategy,
      bestFormats: plan.bestFormats,
      targetAudience: isSaudi ? "فئة المستهلكين في السعودية المهتمين بالحلول السريعة والجودة العالية (18-45 سنة)." : "فئة المستهلكين في مصر المهتمين بالحلول العملية والعروض القوية (18-45 سنة).",
      pricingAdvice: `سعر تنافسي مدعوم بالـ ${currency} مع عرض خاص (شحن مجاني أو خصم لفترة محدودة).`,
      disclaimer: "ملاحظة: هذا تحليل متقدم مدعوم بالقوالب الذكية لإدارة الحملات بفاعلية وتوجيه اللهجة."
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
      hook: targetHook + ` لو دورت كتير ومش لاقي حل لـ "${cleanName}"، فالفيديو ده عشانك أنت!`,
      script: scriptText,
      cta: isSaudi ? "اطلب نسختك الحين واستفيد من عرض اليوم!" : "اطلب نسختك دلوقتي واغتنم عرض اليوم المحدود!",
      hashtags: isSaudi ? `#Sales24 #تسويق_إلكتروني #${slug} #عروض_السعودية #متجر_ترند` : `#Sales24 #تسويق_إلكتروني #${slug} #عروض_مصر #منتج_أصلي`,
      suggestedMusic: "موسيقى تحفيزية سريعة (Upbeat Commercial Beat) لخلق حماس الشراء."
    }
  };
}

// ---------- إضافة جديدة: حاسبة تقدير الميزانية للحملات ----------

function estimateAdsBudget(dailyBudget, expectedCPA = 50) {
  const budget = validateNumber(dailyBudget, 1, 100000, 'dailyBudget');
  const cpa = validateNumber(expectedCPA, 1, 10000, 'expectedCPA');

  const estimatedConversionsPerDay = Math.floor(budget / cpa);
  const estimatedWeeklyConversions = estimatedConversionsPerDay * 7;

  return {
    dailyBudget: budget,
    expectedCostPerAcquisition: cpa,
    estimatedConversionsPerDay,
    estimatedWeeklyConversions,
    recommendation: estimatedConversionsPerDay > 0 
      ? `🟢 ميزانية جيدة متوقعة لتحقيق حوالي ${estimatedConversionsPerDay} طلبات يومياً.`
      : `⚠️ الميزانية اليومية منخفضة مقارنة بتكلفة الاستحواذ المستهدفة (CPA).`
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

module.exports = { 
  analyzeProductAndPlan, 
  evaluateMediaQuality, 
  getMarketingPlan, 
  parseResolution, 
  estimateAdsBudget 
};
