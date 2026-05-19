require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set. Create a backend/.env file with MONGODB_URI defined.');
  process.exit(1);
}

const mongoose = require('mongoose');

// Models
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget');

const categories = ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Savings'];

function rnd(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing demo user
  const existing = await User.findOne({ email: 'demo@neurobudget.ai' });
  if (existing) {
    await Transaction.deleteMany({ user: existing._id });
    await Budget.deleteMany({ user: existing._id });
    await User.deleteOne({ _id: existing._id });
    console.log('🗑  Cleared existing demo data');
  }

  // Create demo user
  const user = new User({
    name: 'Alex R.',
    email: 'demo@neurobudget.ai',
    password: 'demo1234',
    plan: 'premium',
    monthlyIncome: 7500,
    savingsGoal: 2000,
    currency: 'USD',
  });
  await user.save();
  console.log('👤 Demo user created:', user.email);

  // Generate 6 months of transactions
  const transactions = [];
  const now = new Date();

  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

    // Monthly income
    transactions.push({ user: user._id, title: 'Monthly Salary', amount: rnd(7200, 7800), type: 'income', category: 'Other', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), merchant: 'Employer Inc.' });

    // Freelance occasionally
    if (Math.random() > 0.5) {
      transactions.push({ user: user._id, title: 'Freelance Payment', amount: rnd(400, 1200), type: 'income', category: 'Other', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), rnd(5, 25)), merchant: 'Client Corp' });
    }

    // Fixed expenses
    transactions.push({ user: user._id, title: 'Rent', amount: 1800, type: 'expense', category: 'Housing', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), merchant: 'Landlord LLC', isRecurring: true });
    transactions.push({ user: user._id, title: 'Electric Bill', amount: rnd(80, 140), type: 'expense', category: 'Utilities', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5), merchant: 'City Power', isRecurring: true });
    transactions.push({ user: user._id, title: 'Internet', amount: 59.99, type: 'expense', category: 'Utilities', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 3), merchant: 'FiberNet', isRecurring: true });
    transactions.push({ user: user._id, title: 'Netflix', amount: 15.99, type: 'expense', category: 'Entertainment', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 8), merchant: 'Netflix', isRecurring: true });
    transactions.push({ user: user._id, title: 'Spotify', amount: 9.99, type: 'expense', category: 'Entertainment', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 8), merchant: 'Spotify', isRecurring: true });
    transactions.push({ user: user._id, title: 'Gym Membership', amount: 45, type: 'expense', category: 'Healthcare', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10), merchant: 'FitLife Gym', isRecurring: true });

    // Variable expenses
    const groceryCount = Math.floor(rnd(3, 6));
    for (let i = 0; i < groceryCount; i++) {
      transactions.push({ user: user._id, title: 'Grocery Shopping', amount: rnd(45, 130), type: 'expense', category: 'Food', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.floor(rnd(1, 28))), merchant: ['Whole Foods', 'Trader Joe\'s', 'Safeway', 'Kroger'][Math.floor(Math.random() * 4)] });
    }

    const diningCount = Math.floor(rnd(4, 10));
    for (let i = 0; i < diningCount; i++) {
      transactions.push({ user: user._id, title: 'Dining Out', amount: rnd(15, 85), type: 'expense', category: 'Food', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.floor(rnd(1, 28))), merchant: ['Chipotle', 'Olive Garden', 'Local Bistro', 'Sushi Place'][Math.floor(Math.random() * 4)] });
    }

    const transportCount = Math.floor(rnd(2, 5));
    for (let i = 0; i < transportCount; i++) {
      transactions.push({ user: user._id, title: 'Transportation', amount: rnd(15, 60), type: 'expense', category: 'Transport', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.floor(rnd(1, 28))), merchant: ['Uber', 'Lyft', 'Gas Station', 'Metro'][Math.floor(Math.random() * 4)] });
    }

    // Anomaly: occasional large unexpected purchase
    if (m === 1 || m === 3) {
      transactions.push({ user: user._id, title: 'Electronics Purchase', amount: rnd(180, 350), type: 'expense', category: 'Shopping', date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15), merchant: 'Best Buy', isAnomaly: true, anomalyScore: rnd(2.5, 4.0), aiAnalyzed: true });
    }
  }

  await Transaction.insertMany(transactions);
  console.log(`💳 Created ${transactions.length} transactions`);

  // Create budgets for current month
  const budgetData = [
    { category: 'Housing', limit: 2000 },
    { category: 'Food', limit: 600 },
    { category: 'Transport', limit: 200 },
    { category: 'Entertainment', limit: 150 },
    { category: 'Utilities', limit: 200 },
    { category: 'Healthcare', limit: 100 },
    { category: 'Shopping', limit: 300 },
  ];

  const budgets = budgetData.map(b => ({
    user: user._id,
    ...b,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    alerts: true,
    alertThreshold: 80,
  }));

  await Budget.insertMany(budgets);
  console.log(`🎯 Created ${budgets.length} budgets`);

  console.log('\n✅ Seed complete!');
  console.log('📧 Login: demo@neurobudget.ai');
  console.log('🔑 Password: demo1234');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
