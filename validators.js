// validators.js - نظام التحقق من البيانات
const { body, validationResult } = require('express-validator');

// قواعد التحقق لإنشاء حساب جديد (Register)
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

// قواعد التحقق لتسجيل الدخول (Login)
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('بريد إلكتروني غير صالح')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
];

// قواعد التحقق للتحليل التسويقي
const marketingValidationRules = [
  body('productName')
    .trim()
    .notEmpty().withMessage('اسم المنتج مطلوب')
    .isLength({ min: 2, max: 200 }).withMessage('اسم المنتج لازم يكون بين 2 و 200 حرف')
    .escape(),

  body('category')
    .optional()
    .isIn(['default', 'electronics', 'beauty', 'home'])
    .withMessage('فئة المنتج غير صالحة'),

  body('lightingScore')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('تقييم الإضاءة لازم يكون بين 0 و 10')
    .toInt(),

  body('resolution')
    .optional()
    .isIn(['1080p', '720p', '480p'])
    .withMessage('دقة الفيديو غير صالحة'),

  body('market')
    .optional()
    .isIn(['egypt', 'saudi'])
    .withMessage('السوق لازم يكون مصر أو السعودية'),

  body('dialect')
    .optional()
    .isIn(['عامية محلية قوية', 'فصحى تسويقية مبسطة'])
    .withMessage('اللهجة غير صالحة'),

  body('price')
    .optional()
    .trim()
    .escape(),

  body('currency')
    .optional()
    .trim()
    .escape(),

  body('profit')
    .optional()
];

// قواعد التحقق لتوليد السكريبت
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

// دالة تنفيذ التحقق
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'بيانات غير صالحة',
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
