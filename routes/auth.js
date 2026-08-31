const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidationRules, loginValidationRules, validate } = require('../validators');
const { protect } = require('../middleware');
const logger = require('../logger');

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// تسجيل جديد
router.post('/register', registerValidationRules, validate, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'هذا البريد الإلكتروني مسجّل بالفعل' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user);
    
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.status(201).json({
      success: true,
      message: 'تم التسجيل بنجاح! 🎉',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan }
    });
  } catch (error) {
    logger.error('خطأ في التسجيل:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء التسجيل' });
  }
});

// تسجيل الدخول
router.post('/login', loginValidationRules, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'البريد أو كلمة السر غير صحيحة' });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح! ✨',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan }
    });
  } catch (error) {
    logger.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

// تسجيل الخروج
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// بيانات المستخدم الحالي
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    res.json({ success: true, user });
  } catch (error) {
    logger.error('خطأ في جلب بيانات المستخدم:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

// تحديث بيانات المستخدم
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan }
    });
  } catch (error) {
    logger.error('خطأ في تحديث البيانات:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحديث' });
  }
});

module.exports = router;
