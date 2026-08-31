// =====================================================================
// 💰 profitCalculator.js - حاسبة الأرباح الاحترافية (النسخة النووية)
// =====================================================================

function calculateProfit(sellingPrice, costPrice, quantity = 1) {
  const sell = parseFloat(sellingPrice);
  const cost = parseFloat(costPrice);
  const qty = parseInt(quantity) || 1;

  // التحقق من صحة الأرقام بدقة تامة
  if (isNaN(sell) || isNaN(cost)) {
    return {
      valid: false,
      message: 'الأسعار المدخلة غير صالحة أو فارغة',
      profitPerUnit: 0,
      totalProfit: 0,
      profitMargin: '0%'
    };
  }

  if (sell <= 0) {
    return {
      valid: false,
      message: 'سعر البيع يجب أن يكون أكبر من صفر',
      profitPerUnit: 0,
      totalProfit: 0,
      profitMargin: '0%'
    };
  }

  if (cost < 0) {
    return {
      valid: false,
      message: 'التكلفة لا يمكن أن تكون بالسالب',
      profitPerUnit: 0,
      totalProfit: 0,
      profitMargin: '0%'
    };
  }

  // العمليات الحسابية بدقة متناهية
  const profitPerUnit = sell - cost;
  const totalProfit = profitPerUnit * qty;
  const profitMarginNum = (profitPerUnit / sell) * 100;
  const profitMarginStr = profitMarginNum.toFixed(1) + '%';

  // تقييم ذكي لحالة الربحية
  let status = 'ربح ✅';
  let recommendation = '🟢 هامش ربح ممتاز - استمر بقوة!';

  if (profitPerUnit === 0) {
    status = 'تعادل ⚖️';
    recommendation = '⚠️ المنتج لا يحقق أرباحاً (سعر البيع يساوي التكلفة).';
  } else if (profitPerUnit < 0) {
    status = 'خسارة ❌';
    recommendation = '🔴 تحذير خطير: هذا المنتج خسران، يجب تعديل السعر فوراً!';
  } else if (profitMarginNum < 15) {
    status = 'ربح ضعيف 🟡';
    recommendation = '⚠️ هامش الربح أقل من 15% - ننصح برفع السعر قليلاً أو خفض تكلفة الشحن.';
  } else if (profitMarginNum < 30) {
    status = 'ربح جيد 👍';
    recommendation = '🟡 هامش ربح مقبول، ولكن يمكن تحسينه لتحقيق عوائد أعلى.';
  }

  return {
    valid: true,
    sellingPrice: sell,
    costPrice: cost,
    profitPerUnit: Number(profitPerUnit.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    profitMargin: profitMarginStr,
    status,
    recommendation
  };
}

module.exports = { calculateProfit };
