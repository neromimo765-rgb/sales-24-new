// =====================================================================
// 🔐 auth.js - مسارات المصادقة وإدارة المستخدمين (النسخة النووية النهائية)
// =====================================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const { 
  registerValidationRules, 
  loginValidationRules, 
  validate 
} = require('../validators');
const { protect } = require('../middleware');
const logger = require('../logger');

const router = express.Router();

// دالة مساعدة للتحقق من صحة الـ MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// 🎟️ دالة مساعدة لإنشاء التوكن
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 🍪 إعدادات الكوكي الموحدة والأمان العالي
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' مفيدة لو الـ Frontend منفصل تماماً في الإنتاج
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 أيام
};

// 1. 🚀 تسجيل حساب جديد
router.post('/register', registerValidationRules, validate, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'هذا البريد الإلكتروني مسجّل بالفعل' });
    }

    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });
    const token = generateToken(user);
    
    res.cookie('token', token, cookieOptions);
    
    res.status(201).json({
      success: true,
      message: 'تم التسجيل بنجاح! 🎉',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan }
    });
  } catch (error) {
    logger.error('❌ خطأ في التسجيل:', { error: error.message });
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء التسجيل' });
  }
});

// 2. 🔑 تسجيل الدخول
router.post('/login', loginValidationRules, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.cookie('token', token, cookieOptions);
    
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح! ✨',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan }
    });
  } catch (error) {
    logger.error('❌ خطأ في تسجيل الدخول:', { error: error.message });
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء تسجيل الدخول' });
  }
});

// 3. 🚪 تسجيل الخروج
router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// 4. 👤 جلب بيانات المستخدم الحالي
router.get('/me', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.user.id)) {
      return res.status(400).json({ success: false, message: 'معرف المستخدم غير صالح' });
    }

    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    res.json({ success: true, user });
  } catch (error) {
    logger.error('❌ خطأ في جلب بيانات المستخدم:', { error: error.message });
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

// 5. 🔄 تحديث بيانات المستخدم
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const formattedEmail = email.toLowerCase().trim();
      const emailExists = await User.findOne({ email: formattedEmail });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر' });
      }
      user.email = formattedEmail;
    }

    if (name) user.name = name.trim();

    await user.save();

    res.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan }
    });
  } catch (error) {
    logger.error('❌ خطأ في تحديث البيانات:', { error: error.message });
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحديث' });
  }
});

// 6. 🔒 تغيير كلمة المرور
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    logger.error('❌ خطأ في تغيير كلمة المرور:', { error: error.message });
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور' });
  }
});

// 7. 📬 طلب استعادة كلمة المرور (Forgot Password)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال البريد الإلكتروني' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على مستخدم بهذا البريد الإلكتروني' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 دقائق

    await user.save();

    res.json({ 
      success: true, 
      message: 'تم إنشاء رمز استعادة كلمة المرور بنجاح',
      resetToken // يُرسل مؤقتاً للتطوير المحلي
    });
  } catch (error) {
    logger.error('❌ خطأ في طلب استعادة كلمة المرور:', { error: error.message });
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء طلب استعادة كلمة المرور' });
  }
});

// 8. 🔄 إعادة تعيين كلمة المرور باستخدام الرمز (Reset Password)
router.put('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'رابط إعادة التعيين غير صالح أو انتهت صلاحيته' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة مرور جديدة لا تقل عن 6 أحرف' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن' });
  } catch (error) {
    logger.error('❌ خطأ في إعادة تعيين كلمة المرور:', { error: error.message });
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' });
  }
});

module.exports = router;
