// =====================================================================
// 📊 analytics.js - مسارات التحليلات والإحصائيات (النسخة النووية المطورة)
// =====================================================================

const express = require('express');
const Campaign = require('../models/Campaign');
const { protect } = require('../middleware');
const logger = require('../logger');

const router = express.Router();

// 📈 إحصائيات شاملة للـ Dashboard (مع الحماية والتسجيل اللحظي)
router.get('/dashboard', protect, async (req, res) => {
  try {
    const [
      totalCampaigns,
      activeCampaigns,
      totalProfitResult,
      topCategories,
      recentCampaigns,
      monthlyStats
    ] = await Promise.all([
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'active' }),
      Campaign.aggregate([{ $group: { _id: null, total: { $sum: '$profitPerUnit' } } }]),
      Campaign.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Campaign.find().lean().sort({ createdAt: -1 }).limit(5),
      Campaign.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
            profit: { $sum: '$profitPerUnit' }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 12 }
      ])
    ]);

    const totalProfit = totalProfitResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalCampaigns,
        activeCampaigns,
        totalProfit,
        topCategories,
        recentCampaigns,
        monthlyStats
      }
    });
  } catch (error) {
    logger.error('❌ خطأ في جلب إحصائيات الـ Dashboard:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء جلب الإحصائيات والتحليلات' });
  }
});

module.exports = router;
