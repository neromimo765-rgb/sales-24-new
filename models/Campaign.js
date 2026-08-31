const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  productName: { type: String, required: true, trim: true, index: true },
  category: { type: String, index: true, trim: true },
  
  // 💰 البيانات المالية
  price: { type: Number, default: 0, min: 0 },
  cost: { type: Number, default: 0, min: 0 },
  profitPerUnit: { type: Number, default: 0 },
  profitMargin: { type: String, default: '0%' },
  
  // 🚀 [مضاف حديثاً] الميزانية والإنفاق المالي
  budget: { type: Number, default: 0, min: 0 },
  spent: { type: Number, default: 0, min: 0 },
  roi: { type: Number, default: 0 }, // Return on Investment (عائد الاستثمار)

  // 📝 المحتوى والتسويق
  script: { type: String, trim: true },
  hashtags: [String],
  targetAudience: { type: String, trim: true },
  mediaUrl: { type: String, trim: true },
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  qualityScore: { type: Number, default: 0, min: 0, max: 100 },
  
  // 📊 حالة الأداء والمشاهدات
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active', index: true },
  views: { type: Number, default: 0, min: 0 },
  performance: {
    reach: { type: Number, default: 0, min: 0 },
    engagement: { type: Number, default: 0, min: 0 },
    conversions: { type: Number, default: 0, min: 0 },
    ctr: { type: Number, default: 0 } // Click-Through Rate
  },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// 🚀 Indexes مركبة للبحث السريع وتحسين الأداء
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ productName: 'text', category: 'text' });

// 🔄 حساب الأرباح، هامش الربح، وعائد الاستثمار تلقائياً قبل الحفظ
campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // 1. حساب الربح للقطعة وهامش الربح
  if (this.price >= 0 && this.cost >= 0) {
    this.profitPerUnit = this.price - this.cost;
    if (this.price > 0) {
      const margin = (this.profitPerUnit / this.price) * 100;
      this.profitMargin = `${margin.toFixed(1)}%`;
    } else {
      this.profitMargin = '0%';
    }
  }

  // 2. 🚀 [مضاف حديثاً] حساب العائد على الاستثمار (ROI) إذا وُجد إنفاق
  if (this.spent > 0 && this.profitPerUnit > 0) {
    // معادلة تقريبية مبنية على التحويلات والأرباح
    const totalRevenue = this.profitPerUnit * (this.performance.conversions || 0);
    this.roi = Number((((totalRevenue - this.spent) / this.spent) * 100).toFixed(2));
  } else {
    this.roi = 0;
  }
  
  next();
});

// تحديث خانة updatedAt تلقائياً عند استخدام findOneAndUpdate
campaignSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
