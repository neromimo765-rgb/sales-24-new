// =====================================================================
// 🛡️ validators.js - نظام التحقق من البيانات (النسخة النووية المطورة والنهائية)
// =====================================================================
const { body, validationResult } = require('express-validator');

// 👤 قواعد التحقق لإنشاء حساب جديد (Register)
const registerValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 50 }).withMessage('الاسم يجب أن يكون بين 2 و 50 حرف')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('بريد إلكتروني غير صالح')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور يجب ألا تقل عن 6 أحرف')
];

// 🔑 قواعد التحقق لتسجيل الدخول (Login)
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('بريد إلكتروني غير صالح')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
];

// 🎯 قواعد التحقق للتحليل التسويقي والحملات وحاسبة الأرباح
const marketingValidationRules = [
  body('productName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('اسم المنتج يجب أن يكون بين 2 و 200 حرف')
    .escape(),

  body('category')
    .optional()
    .trim()
    .isIn(['default', 'cleaning', 'electronics', 'beauty', 'home', 'fashion', 'food', 'fitness', 'general'])
    .withMessage('فئة المنتج غير صالحة'),

  body('lightingScore')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('تقييم الإضاءة يجب أن يكون بين 0 و 10')
    .toInt(),

  body('resolution')
    .optional()
    .isIn(['1080p', '720p', '480p', '4k'])
    .withMessage('دقة الفيديو غير صالحة'),

  body('market')
    .optional()
    .trim()
    .isIn(['egypt', 'saudi', 'uae', 'gulf'])
    .withMessage('السوق المستهدف غير صالح'),

  body('dialect')
    .optional()
    .trim()
    .escape(),

  // دعم سعر البيع بصيغتي price و sellingPrice
  body(['price', 'sellingPrice'])
    .optional()
    .isNumeric().withMessage('سعر البيع يجب أن يكون رقماً')
    .toFloat(),

  // دعم التكلفة بصيغتي cost و costPrice
  body(['cost', 'costPrice'])
    .optional()
    .isNumeric().withMessage('التكلفة يجب أن تكون رقماً')
    .toFloat(),

  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('الكمية يجب أن تكون رقماً صحيحاً أكبر من الصفر')
    .toInt(),

  body(['shippingCost', 'shipping'])
    .optional()
    .isNumeric().withMessage('تكلفة الشحن يجب أن تكون رقماً')
    .toFloat(),

  body(['adsCostPerUnit', 'ads'])
    .optional()
    .isNumeric().withMessage('تكلفة الإعلانات يجب أن تكون رقماً')
    .toFloat(),

  // ⚠️ تم إزالة escape() هنا حصراً لتجنب إفساد الروابط الحقيقية (URLs)
  body('uploadedFileUrl')
    .optional()
    .trim()
    .isURL().withMessage('رابط الملف المرفوع غير صالح')
];

// ✍️ قواعد التحقق لتوليد السكريبت
const scriptValidationRules = [
  body('productName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .escape(),

  body('tone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .escape()
];

// 🚦 دالة تنفيذ التحقق وإرجاع الأخطاء بصيغة موحدة
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'بيانات غير صالحة، يرجى مراجعة الحقول المدخلة',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
}

module.exports = {
  registerValidationRules,
  loginValidationRules,
  marketingValidationRules,
  scriptValidationRules,
  validate
};
