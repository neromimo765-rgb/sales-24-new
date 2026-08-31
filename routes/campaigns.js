const express = require('express');
const Campaign = require('../models/Campaign');
const { protect, cacheMiddleware } = require('../middleware');
const logger = require('../logger');

const router = express.Router();

// جلب كل الحملات مع Pagination والبحث والفلترة
router.get('/', cacheMiddleware(60), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category;
    const status = req.query.status;

    const query = {};
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
    res.status(500).json({ success: false, message: 'تعذر جلب الحملات' });
  }
});

// جلب حملة واحدة
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ success: false, message: 'الحملة غير موجودة' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب الحملة' });
  }
});

// تحديث حملة
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!campaign) return res.status(404).json({ success: false, message: 'الحملة غير موجودة' });
    res.json({ success: true, message: 'تم التحديث بنجاح', data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في التحديث' });
  }
});

// حذف حملة
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'الحملة غير موجودة' });
    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الحذف' });
  }
});

// تكرار حملة
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Campaign.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ success: false, message: 'الحملة غير موجودة' });
    
    delete original._id;
    original.productName += ' (نسخة)';
    original.createdAt = Date.now();
    
    const newCampaign = await Campaign.create(original);
    res.json({ success: true, message: 'تم التكرار بنجاح', data: newCampaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في التكرار' });
  }
});

module.exports = router;
