// =====================================================================
// 💰 profitCalculator.js - حاسبة الأرباح الاحترافية (النسخة النووية المطورة)
// =====================================================================

/**
 * يحسب الأرباح، الهامش، وصافي الربح بدقة متناهية مع مصاريف إضافية (شحن وإعلانات).
 * @param {object|number} inputData - إما كائن يحتوي البيانات أو سعر البيع مباشرة
 * @param {number} [costPrice] - سعر التكلفة
 * @param {number} [quantity=1] - الكمية المباعة
 * @param {object} [extraCosts={}] - مصاريف إضافية مثل الشحن والإعلانات لكل قطعة
 */
function calculateProfit(inputData, costPrice, quantity = 1, extraCosts = {}) {
  let sell, cost, qty, shipping, ads;

  // دعم الاستدعاء ككائن أو كباراميترات منفصلة لضمان مرونة الاستخدام
  if (typeof inputData === 'object' && inputData !== null) {
    sell = parseFloat(inputData.sellingPrice);
    cost = parseFloat(inputData.costPrice);
    qty = parseInt(inputData.quantity) || 1;
    shipping = parseFloat(inputData.shippingCost) || 0;
    ads = parseFloat(inputData.adsCostPerUnit) || 0;
  } else {
    sell = parseFloat(inputData);
    cost = parseFloat(costPrice);
    qty = parseInt(quantity) || 1;
    shipping = parseFloat(extraCosts.shippingCost) || 0;
    ads = parseFloat(extraCosts.adsCostPerUnit) || 0;
  }

  // 1. التحقق من صحة الأرقام بدقة تامة
  if (isNaN(sell) || isNaN(cost)) {
    return {
      valid: false,
      message: 'الأسعار المدخلة غير صالحة أو فارغة',
      profitPerUnit: 0,
      netProfitPerUnit: 0,
      totalProfit: 0,
      totalNetProfit: 0,
      profitMargin: '0%'
    };
  }

  if (sell <= 0) {
    return {
      valid: false,
      message: 'سعر البيع يجب أن يكون أكبر من صفر',
      profitPerUnit: 0,
      netProfitPerUnit: 0,
      totalProfit: 0,
      totalNetProfit: 0,
      profitMargin: '0%'
    };
  }

  if (cost < 0 || shipping < 0 || ads < 0) {
    return {
      valid: false,
      message: 'التكاليف أو المصاريف لا يمكن أن تكون بالسالب',
      profitPerUnit: 0,
      netProfitPerUnit: 0,
      totalProfit: 0,
      totalNetProfit: 0,
      profitMargin: '0%'
    };
  }

  // 2. العمليات الحسابية المتقدمة
  const grossProfitPerUnit = sell - cost; // الربح الإجمالي للقطعة قبل المصاريف
  const totalExpensesPerUnit = shipping + ads; // إجمالي المصاريف الإضافية للقطعة
  const netProfitPerUnit = grossProfitPerUnit - totalExpensesPerUnit; // صافي الربح الفعلي للقطعة

  const totalGrossProfit = grossProfitPerUnit * qty;
  const totalNetProfit = netProfitPerUnit * qty;
  
  // حساب هامش صافي الربح بناءً على سعر البيع
  const profitMarginNum = (netProfitPerUnit / sell) * 100;
  const profitMarginStr = profitMarginNum.toFixed(1) + '%';

  // 3. تقييم ذكي وحكيم لحالة الربحية
  let status = 'ربح صافي ممتاز ✅';
  let recommendation = '🟢 هامش ربح رائع وصافي أرباحك مستقرة - استمر بقوة!';

  if (netProfitPerUnit === 0) {
    status = 'تعادل ⚖️';
    recommendation = '⚠️ المنتج يغطي تكاليفه فقط ولا يحقق صافي أرباح (راجع مصاريف الشحن والإعلانات).';
  } else if (netProfitPerUnit < 0) {
    status = 'خسارة فادحة ❌';
    recommendation = '🔴 تحذير خطير: المنتج يحقق "خسارة" بعد خصم مصاريف الشحن والإعلانات، يجب رفع السعر فوراً!';
  } else if (profitMarginNum < 15) {
    status = 'ربح ضعيف 🟡';
    recommendation = '⚠️ صافي الهامش أقل من 15% - ننصح بتحسين تكلفة المنتج أو تقليل تكلفة الإعلانات.';
  } else if (profitMarginNum < 30) {
    status = 'ربح جيد 👍';
    recommendation = '🟡 هامش ربح مقبول، ولكن يمكن تحسين العائد الإعلاني (ROAS) لزيادة الأرباح.';
  }

  return {
    valid: true,
    sellingPrice: sell,
    costPrice: cost,
    shippingCost: shipping,
    adsCostPerUnit: ads,
    grossProfitPerUnit: Number(grossProfitPerUnit.toFixed(2)),
    netProfitPerUnit: Number(netProfitPerUnit.toFixed(2)),
    totalGrossProfit: Number(totalGrossProfit.toFixed(2)),
    totalNetProfit: Number(totalNetProfit.toFixed(2)),
    profitMargin: profitMarginStr,
    status,
    recommendation
  };
}

/**
 * إضافة جديدة: حساب كمية المنتجات المطلوبة لتحقيق هدف ربحي معين (Break-even / Target Goal)
 */
function calculateTargetGoal(fixedMonthlyExpenses, netProfitPerUnit) {
  if (netProfitPerUnit <= 0) {
    return {
      success: false,
      message: 'لا يمكن حساب الهدف لأن صافي ربح القطعة صفر أو سالب.'
    };
  }

  const requiredUnits = Math.ceil(fixedMonthlyExpenses / netProfitPerUnit);
  return {
    success: true,
    fixedExpenses: fixedMonthlyExpenses,
    netProfitPerUnit,
    requiredUnitsToCoverExpenses: requiredUnits,
    message: `تحتاج لبيع ${requiredUnits} قطعة شهرياً لتغطية المصاريف الثابتة والوصول لنقطة التعادل الربحي.`
  };
}

module.exports = { 
  calculateProfit, 
  calculateTargetGoal 
};
