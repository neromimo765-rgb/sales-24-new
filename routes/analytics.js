const express = require('express');
const Campaign = require('../models/Campaign');
const { cacheMiddleware } = require('../middleware');

const router = express.Router();

// إحصائيات شاملة للـ Dashboard
router.get('/dashboard', cacheMiddleware(120), async (req, res) => {
  try {
    const [
      totalCampaigns,
      activeCampaigns,
      totalProfit,
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

    res.json({
      success: true,
      data: {
        totalCampaigns,
        activeCampaigns,
        totalProfit: totalProfit[0]?.total || 0,
        topCategories,
        recentCampaigns,
        monthlyStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب الإحصائيات' });
  }
});

module.exports = router;
