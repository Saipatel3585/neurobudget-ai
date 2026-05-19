const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['spending_pattern', 'anomaly', 'recommendation', 'prediction', 'budget_alert', 'savings_tip'],
    required: true
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  savingsPotential: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 }, // 0-100
  isRead: { type: Boolean, default: false },
  isDismissed: { type: Boolean, default: false },
  relatedCategory: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

aiInsightSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AIInsight', aiInsightSchema);
