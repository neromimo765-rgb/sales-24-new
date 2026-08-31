// =====================================================================
// 💰 profitCalculator.js - حاسبة الأرباح والجدوى (النسخة النووية النهائية)
// =====================================================================

/**
 * يحسب الأرباح، الهامش، وصافي الربح بدقة متناهية مع مصاريف الشحن والإعلانات وتحديد العملة (مصر/السعودية).
 * @param {object|number} inputData - إما كائن يحتوي البيانات أو سعر البيع مباشرة
 * @param {number} [costPrice] - سعر التكلفة
 * @param {number} [quantity=1] - الكمية المباعة
 * @param {object} [extraCosts={}] - مصاريف إضافية مثل الشحن والإعلانات لكل قطعة
 * @param {string} [market='egypt'] - السوق المستهدف ('egypt' أو 'saudi')
 */
function calculateProfit(inputData, costPrice, quantity = 1, extraCosts = {}, market = 'egypt') {
  let sell, cost, qty, shipping, ads, targetMarket;

  // دعم الاستدعاء المرن (سواء ككائن متكامل من الـ Frontend أو كبراميترات منفصلة)
  if (typeof inputData === 'object' && inputData !== null) {
    sell = parseFloat(inputData.sellingPrice);
    cost = parseFloat(inputData.costPrice);
    qty = parseInt(inputData.quantity) || 1;
    shipping = parseFloat(inputData.shippingCost || inputData.shipping) || 0;
    ads = parseFloat(inputData.adsCostPerUnit || inputData.ads) || 0;
    targetMarket = inputData.market || market;
  } else {
    sell = parseFloat(inputData);
    cost = parseFloat(costPrice);
    qty = parseInt(quantity) || 1;
    shipping = parseFloat(extraCosts.shippingCost || extraCosts.shipping) || 0;
    ads = parseFloat(extraCosts.adsCostPerUnit || extraCosts.ads) || 0;
    targetMarket = market;
  }

  // تحديد رمز العملة واسم السوق أوتوماتيكياً
  const isSaudi = targetMarket === 'saudi';
  const currencySymbol = isSaudi ? 'ر.س' : 'ج.م';
  const marketName = isSaudi ? 'السعودية 🇸🇦' : 'مصر 🇪🇬';

  // 1. التحقق التام من صحة الأرقام
  if (isNaN(sell) || isNaN(cost)) {
    return {
      valid: false,
      message: 'الأسعار المدخلة غير صالحة أو فارغة',
      currency: currencySymbol,
      grossProfitPerUnit: 0,
      netProfitPerUnit: 0,
      totalGrossProfit: 0,
      totalNetProfit: 0,
      profitMargin: '0%'
    };
  }

  if (sell <= 0) {
    return {
      valid: false,
      message: 'سعر البيع يجب أن يكون أكبر من صفر',
      currency: currencySymbol,
      grossProfitPerUnit: 0,
      netProfitPerUnit: 0,
      totalGrossProfit: 0,
      totalNetProfit: 0,
      profitMargin: '0%'
    };
  }

  if (cost < 0 || shipping < 0 || ads < 0) {
    return {
      valid: false,
      message: 'التكاليف أو المصاريف لا يمكن أن تكون بالسالب',
      currency: currencySymbol,
      grossProfitPerUnit: 0,
      netProfitPerUnit: 0,
      totalGrossProfit: 0,
      totalNetProfit: 0,
      profitMargin: '0%'
    };
  }

  // 2. العمليات الحسابية المتقدمة والدقيقة بالمللي
  const grossProfitPerUnit = sell - cost; // الربح الإجمالي قبل المصاريف
  const totalExpensesPerUnit = shipping + ads; // إجمالي المصاريف (شحن + إعلانات)
  const netProfitPerUnit = grossProfitPerUnit - totalExpensesPerUnit; // صافي الربح الفعلي للقطعة

  const totalGrossProfit = grossProfitPerUnit * qty;
  const totalNetProfit = netProfitPerUnit * qty;
  
  // حساب هامش صافي الربح بناءً على سعر البيع
  const profitMarginNum = sell > 0 ? (netProfitPerUnit / sell) * 100 : 0;
  const profitMarginStr = profitMarginNum.toFixed(1) + '%';

  // 3. تقييم ذكي وحكيم لحالة الربحية وتوليد التوصيات
  let status = 'ربح صافي ممتاز ✅';
  let recommendation = `🟢 هامش ربح رائع في سوق ${marketName} وصافي أرباحك مستقرة - استمر بقوة!`;

  if (netProfitPerUnit === 0) {
    status = 'تعادل ⚖️';
    recommendation = '⚠️ المنتج يغطي تكاليفه فقط ولا يحقق صافي أرباح (راجع مصاريف الشحن والإعلانات).';
  } else if (netProfitPerUnit < 0) {
    status = 'خسارة فادحة ❌';
    recommendation = '🔴 تحذير خطير: المنتج يحقق "خسارة" بعد خصم مصاريف الشحن والإعلانات، يجب رفع السعر أو تقليل المصاريف فوراً!';
  } else if (profitMarginNum < 15) {
    status = 'ربح ضعيف 🟡';
    recommendation = '⚠️ صافي الهامش أقل من 15% - ننصح بتحسين تكلفة المنتج أو تحسين العائد الإعلاني.';
  } else if (profitMarginNum < 30) {
    status = 'ربح جيد 👍';
    recommendation = '🟡 هامش ربح مقبول، ولكن يمكنك تحسين كفاءة الحملة لزيادة الأرباح.';
  }

  return {
    valid: true,
    market: targetMarket,
    currency: currencySymbol,
    sellingPrice: Number(sell.toFixed(2)),
    costPrice: Number(cost.toFixed(2)),
    shippingCost: Number(shipping.toFixed(2)),
    adsCostPerUnit: Number(ads.toFixed(2)),
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
 * حساب كمية المنتجات المطلوبة لتحقيق هدف ربحي معين (Break-even / Target Goal)
 */
function calculateTargetGoal(fixedMonthlyExpenses, netProfitPerUnit, currencySymbol = 'ج.م') {
  const expenses = parseFloat(fixedMonthlyExpenses);
  const profitPerUnit = parseFloat(netProfitPerUnit);

  if (isNaN(expenses) || isNaN(profitPerUnit) || profitPerUnit <= 0) {
    return {
      success: false,
      message: 'لا يمكن حساب الهدف لأن صافي ربح القطعة صفر أو سالب أو المصاريف الثابتة غير صالحة.'
    };
  }

  const requiredUnits = Math.ceil(expenses / profitPerUnit);
  return {
    success: true,
    fixedExpenses: expenses,
    netProfitPerUnit: profitPerUnit,
    requiredUnitsToCoverExpenses: requiredUnits,
    message: `تحتاج لبيع ${requiredUnits} قطعة شهرياً (بـ ${currencySymbol}) لتغطية المصاريف الثابتة والوصول لنقطة التعادل الربحي.`
  };
}

/**
 * 🌟 حساب العائد المستهدف على الإنفاق الإعلاني (Target ROAS)
 * يساعدك تعرف هل الحملة الإعلانية مربحة بناءً على سعر البيع وتكلفة المنتج.
 */
function calculateTargetROAS(sellingPrice, costPrice) {
  const sell = parseFloat(sellingPrice);
  const cost = parseFloat(costPrice);

  if (isNaN(sell) || isNaN(cost) || sell <= 0) {
    return { success: false, message: 'بيانات غير صالحة لحساب الـ ROAS' };
  }

  const maxAllowableAdSpend = sell - cost; // الحد الأقصى لصرف الإعلان قبل الخسارة
  if (maxAllowableAdSpend <= 0) {
    return { success: false, message: 'التكلفة تساوي أو تفوق سعر البيع، لا يمكن حساب الـ ROAS' };
  }

  const targetROAS = sell / maxAllowableAdSpend;

  return {
    success: true,
    maxAllowableAdSpendPerUnit: Number(maxAllowableAdSpend.toFixed(2)),
    breakEvenROAS: Number(targetROAS.toFixed(2)),
    recommendation: `لتحقيق أرباح حقيقية، يجب أن يكون الـ ROAS الإعلاني الخاص بك أعلى من ${Number((targetROAS * 1.3).toFixed(2))}x.`
  };
}

module.exports = { 
  calculateProfit, 
  calculateTargetGoal,
  calculateTargetROAS
};
