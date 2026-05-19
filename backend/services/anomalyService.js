const Transaction = require('../models/Transaction');

/**
 * Simple statistical anomaly detection using Z-score method
 * Compares transaction amount against historical data for that category
 */
async function detectAnomalies(userId, newTransaction) {
  if (newTransaction.type !== 'expense') return;

  // Get last 30 transactions in same category
  const historical = await Transaction.find({
    user: userId,
    category: newTransaction.category,
    type: 'expense',
    _id: { $ne: newTransaction._id }
  }).sort({ date: -1 }).limit(30);

  if (historical.length < 5) return; // Not enough data

  const amounts = historical.map(t => t.amount);
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const variance = amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return;

  const zScore = Math.abs((newTransaction.amount - mean) / stdDev);
  const isAnomaly = zScore > 2.0; // More than 2 standard deviations

  await Transaction.findByIdAndUpdate(newTransaction._id, {
    anomalyScore: parseFloat(zScore.toFixed(2)),
    isAnomaly,
    aiAnalyzed: true
  });

  if (isAnomaly) {
    console.log(`⚠️ Anomaly detected: ${newTransaction.title} - $${newTransaction.amount} (z-score: ${zScore.toFixed(2)})`);
  }
}

module.exports = { detectAnomalies };
