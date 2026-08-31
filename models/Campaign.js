const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  productName: { type: String, required: true, trim: true, index: true },
  category: { type: String, index: true, trim: true },
  price: { type: Number, default: 0, min: 0 },
  cost: { type: Number, default: 0, min: 0 },
  profitPerUnit: { type: Number, default: 0 },
  profitMargin: { type: String, default: '0%' },
  script: { type: String, trim: true },
  hashtags: [String],
  targetAudience: { type: String, trim: true },
  mediaUrl: { type: String, trim: true },
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  qualityScore: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active', index: true },
  views: { type: Number, default: 0, min: 0 },
  performance: {
    reach: { type: Number, default: 0, min: 0 },
    engagement: { type: Number, default: 0, min: 0 },
    conversions: { type: Number, default: 0, min: 0 }
  },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// 🚀 Indexes مركبة للبحث السريع
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ productName: 'text', category: 'text' });

// 🔄 حساب الأرباح وتحديث تاريخ التعديل تلقائياً قبل الحفظ
campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // حساب الربح للقطعة وهامش الربح تلقائياً
  if (this.price >= 0 && this.cost >= 0) {
    this.profitPerUnit = this.price - this.cost;
    if (this.price > 0) {
      const margin = (this.profitPerUnit / this.price) * 100;
      this.profitMargin = `${margin.toFixed(1)}%`;
    } else {
      this.profitMargin = '0%';
    }
  }
  
  next();
});

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
