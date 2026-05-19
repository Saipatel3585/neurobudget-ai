const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { detectAnomalies } = require('../services/anomalyService');

const router = express.Router();

// Get all transactions (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { category, type, startDate, endDate, limit = 50, page = 1, search } = req.query;
    const query = { user: req.userId };

    if (category) query.category = category;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ transactions, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create transaction
router.post('/', auth, async (req, res) => {
  try {
    const txData = { ...req.body, user: req.userId };
    const transaction = new Transaction(txData);
    await transaction.save();

    // Async anomaly detection
    detectAnomalies(req.userId, transaction).catch(console.error);

    res.status(201).json({ transaction });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ transaction });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk import (CSV-like)
router.post('/bulk', auth, async (req, res) => {
  try {
    const { transactions } = req.body;
    const docs = transactions.map(t => ({ ...t, user: req.userId }));
    const inserted = await Transaction.insertMany(docs);
    res.status(201).json({ count: inserted.length, transactions: inserted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
