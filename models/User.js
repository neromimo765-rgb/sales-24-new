// =====================================================================
// 👤 User.js - نموذج بيانات المستخدم (النسخة النووية النهائية)
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
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'يرجى إدخال بريد إلكتروني صالح']
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
    default: 'user' 
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
    default: true 
  },
  // 🔑 حقول استعادة كلمة المرور الجديدة
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
  timestamps: true // تفعيل createdAt و updatedAt تلقائياً من Mongoose
});

// ==========================================
// 🔐 الميدل وير والعمليات الحسابية
// ==========================================

// تشفير كلمة السر تلقائياً قبل الحفظ في حال تم تعديلها أو إنشاؤها
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12); // قوة تشفير عالية وسريعة
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
  return await bcrypt.compare(candidatePassword, this.password);
};

// 🧹 إرجاع بيانات المستخدم خالية من الحساسات (مناسبة للإرسال عبر الـ API)
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  return userObject;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
