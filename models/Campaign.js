const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  productName: { type: String, required: true, trim: true, index: true },
  category: { type: String, index: true },
  price: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  profitPerUnit: { type: Number, default: 0 },
  profitMargin: { type: String, default: '0%' },
  script: String,
  hashtags: [String],
  targetAudience: String,
  mediaUrl: String,
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  qualityScore: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active', index: true },
  views: { type: Number, default: 0 },
  performance: {
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// 🚀 Indexes مركبة للبحث السريع
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ productName: 'text', category: 'text' });

campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
