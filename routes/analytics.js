// =====================================================================
// 📊 analytics.js - مسارات التحليلات والإحصائيات (النسخة النووية النهائية)
// =====================================================================

const express = require('express');
const Campaign = require('../models/Campaign');
const { protect } = require('../middleware');
const logger = require('../logger');

const router = express.Router();

// 📈 إحصائيات شاملة للـ Dashboard (مع عزل بيانات المستخدم والحماية القصوى)
router.get('/dashboard', protect, async (req, res) => {
  try {
    // تحديد نطاق البحث: هل هو المدير يطلب إحصائيات عامة أم مستخدم عادي؟
    const isGlobalAdmin = req.query.global === 'true' && req.user.role === 'admin';
    const matchQuery = isGlobalAdmin ? {} : { user: req.user.id };

    const [
      totalCampaigns,
      activeCampaigns,
      totalProfitResult,
      topCategories,
      recentCampaigns,
      monthlyStats
    ] = await Promise.all([
      Campaign.countDocuments(matchQuery),
      Campaign.countDocuments({ ...matchQuery, status: 'active' }),
      Campaign.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$profitPerUnit' } } }
      ]),
      Campaign.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Campaign.find(matchQuery).lean().sort({ createdAt: -1 }).limit(5),
      Campaign.aggregate([
        { $match: matchQuery },
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
      scope: isGlobalAdmin ? 'global_admin' : 'user_personalized',
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
    logger.error('❌ خطأ في جلب إحصائيات الـ Dashboard:', { error: error.message });
    res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء جلب الإحصائيات والتحليلات' });
  }
});

module.exports = router;
