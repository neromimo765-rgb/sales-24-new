// =====================================================================
// 👤 User.js - نموذج بيانات المستخدم (النسخة النووية المحدثة)
// =====================================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    index: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 6, 
    select: false 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'manager'], 
    default: 'user' 
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  plan: { 
    type: String, 
    enum: ['free', 'basic', 'premium'], 
    default: 'free' 
  },
  campaignsCount: { 
    type: Number, 
    default: 0 
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
  lastLogin: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 🔐 تشفير كلمة السر تلقائياً قبل الحفظ في حال تم تعديلها
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔍 دالة مقارنة كلمة المرور أثناء تسجيل الدخول
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
