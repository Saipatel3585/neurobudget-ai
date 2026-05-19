const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

// Dashboard summary
router.get('/dashboard', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [monthlyTxns, allTxns] = await Promise.all([
      Transaction.find({ user: req.userId, date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Transaction.find({ user: req.userId }).sort({ date: -1 }).limit(5)
    ]);

    const totalIncome = monthlyTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = monthlyTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0;

    // Category breakdown
    const categoryBreakdown = {};
    monthlyTxns.filter(t => t.type === 'expense').forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    // Anomalies
    const anomalies = monthlyTxns.filter(t => t.isAnomaly);

    res.json({
      totalIncome,
      totalExpenses,
      netBalance,
      savingsRate: parseFloat(savingsRate),
      categoryBreakdown,
      recentTransactions: allTxns,
      anomalyCount: anomalies.length,
      anomalies: anomalies.slice(0, 3)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly spending trends (last 6 months)
router.get('/trends', auth, async (req, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const trends = await Promise.all(months.map(async ({ year, month }) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      const txns = await Transaction.find({
        user: req.userId, date: { $gte: start, $lte: end }
      });
      const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        label: start.toLocaleString('default', { month: 'short' }),
        month, year, income, expenses, net: income - expenses
      };
    }));

    res.json({ trends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Category analytics
router.get('/categories', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);

    const txns = await Transaction.find({
      user: req.userId,
      type: 'expense',
      date: { $gte: start, $lte: end }
    });

    const budgets = await Budget.find({ user: req.userId, month: m, year: y });
    const budgetMap = {};
    budgets.forEach(b => { budgetMap[b.category] = b.limit; });

    const categories = {};
    txns.forEach(t => {
      if (!categories[t.category]) categories[t.category] = { spent: 0, count: 0 };
      categories[t.category].spent += t.amount;
      categories[t.category].count++;
    });

    const result = Object.entries(categories).map(([name, data]) => ({
      name,
      spent: data.spent,
      count: data.count,
      budget: budgetMap[name] || null,
      percentage: budgetMap[name] ? ((data.spent / budgetMap[name]) * 100).toFixed(1) : null
    }));

    res.json({ categories: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spending prediction for next month
router.get('/predict', auth, async (req, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const historical = await Promise.all(months.map(async ({ year, month }) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      const txns = await Transaction.find({ user: req.userId, type: 'expense', date: { $gte: start, $lte: end } });
      return txns.reduce((s, t) => s + t.amount, 0);
    }));

    // Simple weighted moving average prediction
    const weights = [0.05, 0.1, 0.15, 0.2, 0.25, 0.25];
    const predicted = historical.reduce((sum, val, i) => sum + val * weights[i], 0);
    const avgSpend = historical.reduce((s, v) => s + v, 0) / historical.length;
    const trend = historical.length > 1 ? (historical[historical.length - 1] - historical[0]) / historical.length : 0;
    const confidence = Math.min(95, Math.max(60, 94 - Math.abs(trend / avgSpend) * 100));

    res.json({
      predictedSpending: Math.round(predicted),
      confidence: Math.round(confidence),
      historicalAverage: Math.round(avgSpend),
      trend: trend > 0 ? 'increasing' : 'decreasing',
      monthlyData: months.map((m, i) => ({
        ...m,
        actual: historical[i]
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
