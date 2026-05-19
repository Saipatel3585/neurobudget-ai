const express = require('express');
const axios = require('axios');
const Transaction = require('../models/Transaction');
const AIInsight = require('../models/AIInsight');
const auth = require('../middleware/auth');

const router = express.Router();

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Helper: query Groq — reads API key fresh every call
async function queryGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY; // read at call time, not module load time
  if (!apiKey) {
    console.error('❌ GROQ_API_KEY is not set. Add it in Render → Environment Variables.');
    return null;
  }
  try {
    const response = await axios.post(
      GROQ_API_URL,
      { model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 1024, top_p: 0.9 },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );
    return response.data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('Groq API error:', err.response?.data || err.message);
    return null;
  }
}

// Chat with AI financial advisor
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const txns = await Transaction.find({ user: req.userId, date: { $gte: startOfMonth } });

    const totalExpenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalIncome  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const categories = {};
    txns.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const systemContent = `You are NeuroBudget AI, an expert financial advisor powered by Groq llama3.
You have access to the user's real financial data and provide personalized, actionable insights.
Be concise, friendly, and specific. Use dollar amounts when relevant.
Always provide actionable, numbered recommendations.

User's current month financial summary:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Balance: $${(totalIncome - totalExpenses).toFixed(2)}
- Spending by category: ${JSON.stringify(categories)}
- Number of transactions: ${txns.length}`;

    const messages = [
      { role: 'system', content: systemContent },
      ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const aiResponse = await queryGroq(messages);

    if (!aiResponse) {
      return res.json({
        response: "⚠️ Could not connect to Groq. Please check that your GROQ_API_KEY is set in the backend `.env` file. Get a free key at https://console.groq.com",
        offline: true,
      });
    }

    res.json({ response: aiResponse.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate AI insights
router.post('/insights/generate', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const txns = await Transaction.find({ user: req.userId, date: { $gte: startOfMonth } });

    if (txns.length < 3) {
      return res.json({ insights: [], message: 'Add more transactions to generate insights' });
    }

    const totalExpenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const categories = {};
    txns.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const messages = [
      {
        role: 'system',
        content: 'You are a financial analysis AI. Respond ONLY with a valid JSON array — no markdown, no code fences, no explanation. Raw JSON only.',
      },
      {
        role: 'user',
        content: `Analyze this spending data and return exactly 3 financial insights as a JSON array.

Spending by category (USD): ${JSON.stringify(categories)}
Total expenses this month: $${totalExpenses.toFixed(2)}

Return ONLY a raw JSON array (no other text):
[
  {"type":"recommendation","title":"Short title","content":"2-sentence actionable advice.","savingsPotential":50,"confidence":85,"priority":"high","category":"Food"},
  {"type":"spending_pattern","title":"Short title","content":"2-sentence observation.","savingsPotential":0,"confidence":90,"priority":"medium","category":"Transport"},
  {"type":"savings_tip","title":"Short title","content":"2-sentence savings tip.","savingsPotential":100,"confidence":80,"priority":"high","category":"Entertainment"}
]`,
      },
    ];

    const aiResponse = await queryGroq(messages);

    let insights = [];
    if (aiResponse) {
      try {
        const clean = aiResponse.replace(/```json|```/g, '').trim();
        const jsonMatch = clean.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          insights = await Promise.all(
            parsed.map(async (insight) => {
              const doc = new AIInsight({ ...insight, user: req.userId });
              await doc.save();
              return doc;
            })
          );
        }
      } catch (parseErr) {
        console.error('Insight parse error:', parseErr.message);
      }
    }

    // Fallback if Groq fails
    if (insights.length === 0) {
      const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
      const fallbackInsights = [
        {
          type: 'spending_pattern',
          title: `Highest Spend: ${topCategory?.[0] || 'Unknown'}`,
          content: `Your top spending category this month is ${topCategory?.[0]} at $${topCategory?.[1]?.toFixed(2)}. Consider reviewing these expenses to find potential savings.`,
          priority: 'high',
          confidence: 95,
          savingsPotential: Math.round((topCategory?.[1] || 0) * 0.15),
          relatedCategory: topCategory?.[0],
        },
      ];
      insights = await Promise.all(
        fallbackInsights.map(async (i) => {
          const doc = new AIInsight({ ...i, user: req.userId });
          await doc.save();
          return doc;
        })
      );
    }

    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get saved insights
router.get('/insights', auth, async (req, res) => {
  try {
    const insights = await AIInsight.find({
      user: req.userId,
      isDismissed: false
    }).sort({ createdAt: -1 }).limit(20);
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dismiss insight
router.put('/insights/:id/dismiss', auth, async (req, res) => {
  try {
    const insight = await AIInsight.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isDismissed: true },
      { new: true }
    );
    res.json({ insight });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Groq status check
router.get('/status', auth, async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.json({ status: 'offline', model: GROQ_MODEL, reason: 'GROQ_API_KEY not set in Render Environment Variables' });
  }
  try {
    const response = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 5000,
    });
    const models = response.data.data?.map(m => m.id) || [];
    res.json({ status: 'online', model: GROQ_MODEL, availableModels: models });
  } catch {
    res.json({ status: 'offline', model: GROQ_MODEL, reason: 'Invalid API key or cannot reach Groq' });
  }
});

module.exports = router;
