// =====================================================================
// 🎯 campaign.js - نموذج بيانات الحملات التسويقية (النسخة النووية النهائية)
// =====================================================================

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    index: true, 
    required: [true, 'معرف المستخدم مطلوب'] 
  },
  productName: { 
    type: String, 
    required: [true, 'اسم المنتج مطلوب'], 
    trim: true, 
    index: true,
    maxlength: [200, 'اسم المنتج يجب ألا يتجاوز 200 حرف']
  },
  category: { 
    type: String, 
    index: true, 
    trim: true,
    default: 'general'
  },
  
  // 🌍 السوق المستهدف والعملة (محدث ليدعم أسواق أوسع)
  market: { 
    type: String, 
    enum: {
      values: ['egypt', 'saudi', 'uae', 'gulf'],
      message: 'السوق المستهدف غير صالح'
    }, 
    default: 'egypt', 
    index: true 
  },
  currency: { 
    type: String, 
    default: 'ج.م' 
  },

  // 💰 البيانات المالية
  price: { type: Number, default: 0, min: [0, 'السعر لا يمكن أن يكون سالباً'] },
  cost: { type: Number, default: 0, min: [0, 'التكلفة لا يمكن أن تكون سالبة'] },
  profitPerUnit: { type: Number, default: 0 },
  profitMargin: { type: String, default: '0%' },
  
  // 🚀 الميزانية والإنفاق المالي
  budget: { type: Number, default: 0, min: [0, 'الميزانية لا يمكن أن تكون سالبة'] },
  spent: { type: Number, default: 0, min: [0, 'الإنفاق لا يمكن أن يكون سالباً'] },
  roi: { type: Number, default: 0 }, // Return on Investment (عائد الاستثمار)

  // 📝 المحتوى والتسويق
  script: { type: String, trim: true },
  hashtags: [String],
  targetAudience: { type: String, trim: true },
  mediaUrl: { type: String, trim: true },
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  qualityScore: { type: Number, default: 0, min: 0, max: 100 },
  
  // 📊 حالة الأداء والمشاهدات
  status: { 
    type: String, 
    enum: {
      values: ['active', 'paused', 'completed'],
      message: 'حالة الحملة غير صالحة'
    }, 
    default: 'active', 
    index: true 
  },
  views: { type: Number, default: 0, min: 0 },
  performance: {
    reach: { type: Number, default: 0, min: 0 },
    engagement: { type: Number, default: 0, min: 0 },
    conversions: { type: Number, default: 0, min: 0 },
    ctr: { type: Number, default: 0 } // Click-Through Rate
  }
}, {
  timestamps: true // تفعيل createdAt و updatedAt تلقائياً من Mongoose
});

// ==========================================
// 🚀 Indexes مركبة للبحث السريع وتحسين الأداء
// ==========================================
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ userId: 1, market: 1 });
campaignSchema.index({ productName: 'text', category: 'text' });

// ==========================================
// 🔄 حساب الأرباح، هامش الربح، وعائد الاستثمار تلقائياً
// ==========================================
campaignSchema.pre('save', function(next) {
  // 1. ضبط العملة تلقائياً بناءً على السوق المستهدف
  switch (this.market) {
    case 'saudi':
      this.currency = 'ر.س';
      break;
    case 'uae':
    case 'gulf':
      this.currency = 'د.إ';
      break;
    default:
      this.currency = 'ج.م';
      this.market = 'egypt';
  }

  // 2. حساب الربح للقطعة وهامش الربح مع حماية من القسمة على صفر
  if (this.price >= 0 && this.cost >= 0) {
    this.profitPerUnit = Number((this.price - this.cost).toFixed(2));
    if (this.price > 0) {
      const margin = (this.profitPerUnit / this.price) * 100;
      this.profitMargin = `${margin.toFixed(1)}%`;
    } else {
      this.profitMargin = '0%';
    }
  }

  // 3. حساب العائد على الاستثمار (ROI) إذا وُجد إنفاق
  if (this.spent > 0 && this.profitPerUnit > 0) {
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
