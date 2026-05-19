const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: {
    type: String,
    enum: ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Savings', 'Other'],
    required: true
  },
  merchant: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  note: { type: String, trim: true },
  tags: [{ type: String }],
  isRecurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['weekly', 'monthly', 'yearly', null], default: null },
  aiAnalyzed: { type: Boolean, default: false },
  anomalyScore: { type: Number, default: 0 },
  isAnomaly: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
