const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Get budgets for a month
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const budgets = await Budget.find({ user: req.userId, month, year });

    // Get actual spending per category
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const txns = await Transaction.find({ user: req.userId, type: 'expense', date: { $gte: start, $lte: end } });

    const spentMap = {};
    txns.forEach(t => { spentMap[t.category] = (spentMap[t.category] || 0) + t.amount; });

    const budgetsWithSpend = budgets.map(b => ({
      ...b.toObject(),
      spent: spentMap[b.category] || 0,
      remaining: b.limit - (spentMap[b.category] || 0),
      usagePercent: ((spentMap[b.category] || 0) / b.limit * 100).toFixed(1)
    }));

    res.json({ budgets: budgetsWithSpend, month, year });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update budget
router.post('/', auth, async (req, res) => {
  try {
    const { category, limit, month, year, alerts, alertThreshold } = req.body;
    const now = new Date();

    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, category, month: month || now.getMonth() + 1, year: year || now.getFullYear() },
      { limit, alerts, alertThreshold },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ budget });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
