// =====================================================================
// 🎯 campaigns.js - مسارات إدارة الحملات التسويقية (النسخة النووية المطورة)
// =====================================================================

const express = require('express');
const Campaign = require('../models/Campaign');
const { protect, cacheMiddleware } = require('../middleware');
const { marketingValidationRules, validate } = require('../validators');
const logger = require('../logger');

const router = express.Router();

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
    logger.error('❌ خطأ في إنشاء الحملة:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء إنشاء الحملة' });
  }
});

// 2. 📋 جلب كل الحملات مع Pagination والبحث والفلترة
router.get('/', protect, cacheMiddleware(60), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category;
    const status = req.query.status;

    const query = { user: req.user.id }; // جلب حملات المستخدم الحالي فقط
    
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (status) query.status = status;

    const [campaigns, total] = await Promise.all([
      Campaign.find(query).lean().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Campaign.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: campaigns.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: campaigns
    });
  } catch (error) {
    logger.error('❌ خطأ في جلب الحملات:', error.message);
    res.status(500).json({ success: false, message: 'تعذر جلب الحملات' });
  }
});

// 3. 🔍 جلب حملة واحدة بالتفصيل
router.get('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'الحملة غير موجودة أو لا تمتلك صلاحية الوصول إليها' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    logger.error('❌ خطأ في جلب تفاصيل الحملة:', error.message);
    res.status(500).json({ success: false, message: 'خطأ في جلب الحملة' });
  }
});

// 4. ✏️ تحديث حملة
router.put('/:id', protect, async (req, res) => {
  try {
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
    logger.error('❌ خطأ في تحديث الحملة:', error.message);
    res.status(500).json({ success: false, message: 'خطأ في تحديث البيانات' });
  }
});

// 5. 🗑️ حذف حملة
router.delete('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'الحملة غير موجودة للحذف' });
    }

    res.json({ success: true, message: 'تم حذف الحملة بنجاح 🗑️' });
  } catch (error) {
    logger.error('❌ خطأ في حذف الحملة:', error.message);
    res.status(500).json({ success: false, message: 'خطأ في عملية الحذف' });
  }
});

// 6. 📄 تكرار حملة (Duplicate)
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const original = await Campaign.findOne({ _id: req.params.id, user: req.user.id }).lean();
    
    if (!original) {
      return res.status(404).json({ success: false, message: 'الحملة المراد تكرارها غير موجودة' });
    }
    
    delete original._id;
    original.productName += ' (نسخة)';
    original.createdAt = Date.now();
    original.user = req.user.id;
    
    const newCampaign = await Campaign.create(original);
    
    res.status(201).json({ success: true, message: 'تم تكرار الحملة بنجاح 📋', data: newCampaign });
  } catch (error) {
    logger.error('❌ خطأ في تكرار الحملة:', error.message);
    res.status(500).json({ success: false, message: 'خطأ أثناء عملية التكرار' });
  }
});

module.exports = router;
