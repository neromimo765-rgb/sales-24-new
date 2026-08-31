// profitCalculator.js - حاسبة الأرباح الاحترافية (سيرفر فقط)

function calculateProfit(sellingPrice, costPrice, quantity = 1) {
  const sell = parseFloat(sellingPrice);
  const cost = parseFloat(costPrice);

  // التحقق من صحة الأرقام
  if (isNaN(sell) || isNaN(cost)) {
    return {
      valid: false,
      message: 'الأسعار غير صالحة',
      profitPerUnit: 0,
      totalProfit: 0,
      profitMargin: 0
    };
  }

  if (sell <= 0) {
    return {
      valid: false,
      message: 'سعر البيع لازم يكون أكبر من صفر',
      profitPerUnit: 0,
      totalProfit: 0,
      profitMargin: 0
    };
  }

  if (cost < 0) {
    return {
      valid: false,
      message: 'التكلفة مش ممكن تكون بالسالب',
      profitPerUnit: 0,
      totalProfit: 0,
      profitMargin: 0
    };
  }

  const profitPerUnit = sell - cost;
  const totalProfit = profitPerUnit * quantity;
  const profitMargin = ((profitPerUnit / sell) * 100).toFixed(1);

  return {
    valid: true,
    sellingPrice: sell,
    costPrice: cost,
    profitPerUnit: profitPerUnit,
    totalProfit: totalProfit,
    profitMargin: `${profitMargin}%`,
    status: profitPerUnit > 0 ? 'ربح ✅' : profitPerUnit === 0 ? 'تعادل ⚖️' : 'خسارة ❌',
    recommendation: profitPerUnit > 0
      ? (parseFloat(profitMargin) >= 30
        ? '🟢 هامش ربح ممتاز - استمر!'
        : parseFloat(profitMargin) >= 15
          ? '🟡 هامش ربح مقبول - حاول تقلل التكلفة'
          : '🔴 هامش ربح ضعيف - راجع التسعير')
      : '🔴 المنتج ده خسران - لازم تعيد التسعير فوراً'
  };
}

module.exports = { calculateProfit };
