// =====================================================================
// 👤 User.js - نموذج بيانات المستخدم (النسخة النووية المطورة والنهائية)
// =====================================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'الاسم مطلوب'], 
    trim: true,
    minlength: [2, 'الاسم يجب ألا يقل عن حرفين'],
    maxlength: [50, 'الاسم يجب ألا يزيد عن 50 حرفاً']
  },
  email: { 
    type: String, 
    required: [true, 'البريد الإلكتروني مطلوب'], 
    unique: true, 
    lowercase: true, 
    index: true,
    trim: true,
    // 🛠️ تعديل: تحسين تعبير التحقق من صحة البريد ليشمل النطاقات الحديثة
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'يرجى إدخال بريد إلكتروني صالح']
  },
  password: { 
    type: String, 
    required: [true, 'كلمة المرور مطلوبة'], 
    minlength: [6, 'كلمة المرور يجب ألا تقل عن 6 أحرف'], 
    select: false 
  },
  role: { 
    type: String, 
    enum: {
      values: ['user', 'admin', 'manager'],
      message: 'الدور الصلاحي غير صالح'
    }, 
    default: 'user',
    index: true // 🚀 إضافة فهرس لتحسين سرعة البحث حسب الصلاحية
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  plan: { 
    type: String, 
    enum: {
      values: ['free', 'basic', 'premium'],
      message: 'خطة الاشتراك غير صالحة'
    }, 
    default: 'free' 
  },
  campaignsCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  totalProfit: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true // 🚀 فهرس لتصفية المستخدمين النشطين بسرعة
  },
  // 🔑 حقول استعادة كلمة المرور
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true, // تفعيل createdAt و updatedAt تلقائياً
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// ⚡ Virtual Fields (حقول افتراضية محسوبة)
// ==========================================

// حظي أو اختصار الحرف الأول للاستخدام في الواجهات
userSchema.virtual('initials').get(function() {
  if (!this.name) return '';
  const parts = this.name.trim().split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
});

// ==========================================
// 🔐 الميدل وير والعمليات الحسابية
// ==========================================

// تشفير كلمة السر تلقائياً قبل الحفظ في حال تم تعديلها أو إنشاؤها
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12); // قوة تشفير عالية وآمنة
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 🛠️ الدوال المساعدة (Schema Methods)
// ==========================================

// 🔍 مقارنة كلمة المرور أثناء تسجيل الدخول
userSchema.methods.comparePassword = async function(candidatePassword) {
  // ملاحظة: بما أن حقل الـ password محدد بـ select: false، تأكد من جلبه باستخدام .select('+password') في الاستعلام
  return await bcrypt.compare(candidatePassword, this.password);
};

// 🧹 إرجاع بيانات المستخدم خالية من الحساسات (مناسبة للإرسال عبر الـ API)
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  delete userObject.__v; // إزالة نسخة الإصدار للتنظيف
  return userObject;
};

// ==========================================
// 🔍 دوال عامة للموديل (Static Methods)
// ==========================================

// البحث السريع عن مستخدم نشط بالبريد الإلكتروني مع جلب كلمة المرور المخفية
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
