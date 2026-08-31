// =====================================================================
// 🎯 campaigns.js - مسارات إدارة الحملات التسويقية (النسخة النووية النهائية)
// =====================================================================

const express = require('express');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const { protect, cacheMiddleware } = require('../middleware');
const { marketingValidationRules, validate } = require('../validators');
const logger = require('../logger');

const router = express.Router();

// دالة مساعدة للتحقق من صحة الـ MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. 🚀 إنشاء حملة تسويقية جديدة
router.post('/', protect, marketingValidationRules, validate, async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      user: req.user.id // ربط الحملة بالمستخدم الحالي
    };

    const newCampaign = await Campaign.create(campaignData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحملة بنجاح! 🎯',
      data: newCampaign
    });
  } catch (error) {
    logger.error('❌ خطأ في إنشاء الحملة:', { error: error.message });
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء إنشاء الحملة' });
  }
});

// 2. 📋 جلب كل الحملات مع Pagination والبحث والفلترة الآمنة
router.get('/', protect, cacheMiddleware(30), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const category = req.query.category;
    const status = req.query.status;

    const query = { user: req.user.id }; // جلب حملات المستخدم الحالي فقط
    
    // استخدام البحث المرن (Regex) لتجنب أخطاء الـ Text Index في المونجو
    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'default') {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }

    const [campaigns, total] = await Promise.all([
      Campaign.find(query).lean().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Campaign.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: campaigns.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: campaigns
    });
  } catch (error) {
    logger.error('❌ خطأ في جلب الحملات:', { error: error.message });
    res.status(500).json({ success: false, message: 'تعذر جلب الحملات' });
  }
});

// 3. 🔍 جلب حملة واحدة بالتفصيل
router.get('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'معرف الحملة غير صالح' });
    }

    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'الحملة غير موجودة أو لا تمتلك صلاحية الوصول إليها' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    logger.error('❌ خطأ في جلب تفاصيل الحملة:', { error: error.message });
    res.status(500).json({ success: false, message: 'خطأ في جلب الحملة' });
  }
});

// 4. ✏️ تحديث حملة
router.put('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'معرف الحملة غير صالح' });
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'الحملة غير موجودة لتحديثها' });
    }

    res.json({ success: true, message: 'تم التحديث بنجاح ✨', data: campaign });
  } catch (error) {
    logger.error('❌ خطأ في تحديث الحملة:', { error: error.message });
    res.status(500).json({ success: false, message: 'خطأ في تحديث البيانات' });
  }
});

// 5. 🗑️ حذف حملة
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'معرف الحملة غير صالح' });
    }

    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'الحملة غير موجودة للحذف' });
    }

    res.json({ success: true, message: 'تم حذف الحملة بنجاح 🗑️' });
  } catch (error) {
    logger.error('❌ خطأ في حذف الحملة:', { error: error.message });
    res.status(500).json({ success: false, message: 'خطأ في عملية الحذف' });
  }
});

// 6. 📄 تكرار حملة (Duplicate)
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'معرف الحملة غير صالح' });
    }

    const original = await Campaign.findOne({ _id: req.params.id, user: req.user.id }).lean();
    
    if (!original) {
      return res.status(404).json({ success: false, message: 'الحملة المراد تكرارها غير موجودة' });
    }
    
    delete original._id;
    delete original.__v;
    original.productName = `${original.productName} (نسخة)`;
    original.createdAt = new Date();
    original.user = req.user.id;
    
    const newCampaign = await Campaign.create(original);
    
    res.status(201).json({ success: true, message: 'تم تكرار الحملة بنجاح 📋', data: newCampaign });
  } catch (error) {
    logger.error('❌ خطأ في تكرار الحملة:', { error: error.message });
    res.status(500).json({ success: false, message: 'خطأ أثناء عملية التكرار' });
  }
});

module.exports = router;
