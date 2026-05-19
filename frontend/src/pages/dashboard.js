import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import api from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { user } = useAuthStore();
  const [dash, setDash] = useState(null);
  const [trends, setTrends] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/trends'),
      api.get('/analytics/predict'),
    ]).then(([d, t, p]) => {
      setDash(d.data);
      setTrends(t.data.trends);
      setPrediction(p.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categoryData = dash
    ? Object.entries(dash.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const trendData = trends.map((t) => ({ name: t.label, Income: t.income, Expenses: t.expenses }));

  const predictionPoints = prediction
    ? [
        ...prediction.monthlyData.map((m) => ({ name: m.label || `M${m.month}`, Actual: m.actual, Predicted: null })),
        { name: 'Next', Actual: null, Predicted: prediction.predictedSpending }
      ]
    : [];

  if (loading) return (
    <Layout>
      <div style={{ padding: '32px' }}>
        <div style={{ height: '40px', width: '260px', borderRadius: '10px', marginBottom: '32px' }} className="loading-shimmer" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {[1,2,3,4].map(i => <div key={i} className="card loading-shimmer" style={{ height: '130px' }} />)}
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800', color: '#e2e8f0', marginBottom: '4px' }}>
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: '#475569', fontSize: '14px' }}>Here's your financial intelligence overview</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/transactions" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ Add Transaction</a>
            <a href="/assistant" className="btn btn-ghost" style={{ textDecoration: 'none' }}>🧠 Ask AI</a>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
          <StatCard label="Monthly Income" value={fmt(dash?.totalIncome || 0)} icon="↑" color="#10b981" sub="this month" />
          <StatCard label="Total Expenses" value={fmt(dash?.totalExpenses || 0)} icon="↓" color="#ef4444" sub="this month" />
          <StatCard label="Net Balance" value={fmt(dash?.netBalance || 0)} icon="⚖" color={dash?.netBalance >= 0 ? '#a78bfa' : '#ef4444'} sub="income - expenses" />
          <StatCard label="Savings Rate" value={`${dash?.savingsRate || 0}%`} icon="🎯" color="#f59e0b" sub={`${dash?.anomalyCount || 0} anomalies`} />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Spending Trends */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>6-Month Trend</h2>
                <p style={{ color: '#475569', fontSize: '12px' }}>Income vs Expenses</p>
              </div>
              <span className="badge badge-purple">6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', color: '#e2e8f0' }} formatter={(v) => [fmt(v), '']} />
                <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Expenses" stroke="#7c3aed" strokeWidth={2} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Pie */}
          <div className="card">
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>Spending by Category</h2>
              <p style={{ color: '#475569', fontSize: '12px' }}>This month</p>
            </div>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', color: '#e2e8f0' }} formatter={(v) => [fmt(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {categoryData.slice(0, 4).map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{c.name}</span>
                      </div>
                      <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '600' }}>{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
                <p>No expense data yet</p>
                <a href="/transactions" style={{ color: '#7c3aed', fontSize: '12px' }}>Add transactions →</a>
              </div>
            )}
          </div>
        </div>

        {/* AI Prediction + Anomalies row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Prediction */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>AI Spending Prediction</h2>
                <p style={{ color: '#475569', fontSize: '12px' }}>Next month forecast</p>
              </div>
              {prediction && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#a78bfa', fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: '800' }}>{fmt(prediction.predictedSpending)}</div>
                  <div className="badge badge-cyan" style={{ fontSize: '11px' }}>AI Confidence: {prediction.confidence}%</div>
                </div>
              )}
            </div>
            {prediction && predictionPoints.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={predictionPoints}>
                  <defs>
                    <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', color: '#e2e8f0' }} formatter={(v) => v ? [fmt(v), ''] : ['-', '']} />
                  <Area type="monotone" dataKey="Actual" stroke="#7c3aed" strokeWidth={2} fill="url(#predGrad)" connectNulls={false} />
                  <Area type="monotone" dataKey="Predicted" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 3" fill="none" connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: '13px' }}>Add more transactions to generate predictions</div>
            )}
          </div>

          {/* Anomalies */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>Anomaly Alerts</h2>
                <p style={{ color: '#475569', fontSize: '12px' }}>Unusual spending detected</p>
              </div>
              {dash?.anomalyCount > 0 && <span className="badge badge-red">⚠ {dash.anomalyCount} alerts</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dash?.anomalies?.length > 0 ? dash.anomalies.map((a) => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                    <p style={{ color: '#ef4444', fontSize: '12px' }}>{fmt(a.amount)} · {a.category}</p>
                  </div>
                  <span className="badge badge-red">{fmt(a.amount)}</span>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                  <p style={{ fontSize: '32px', marginBottom: '8px' }}>✅</p>
                  <p style={{ fontSize: '14px' }}>No anomalies detected</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Your spending looks normal</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>Recent Transactions</h2>
            <a href="/transactions" style={{ color: '#7c3aed', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>View all →</a>
          </div>
          {dash?.recentTransactions?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {dash.recentTransactions.map((t) => (
                <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '10px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: '38px', height: '38px', background: t.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ color: '#475569', fontSize: '12px' }}>{t.category} · {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '700', fontSize: '14px', color: t.type === 'income' ? '#10b981' : '#e2e8f0' }}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
                    {t.isAnomaly && <span className="badge badge-red" style={{ fontSize: '10px' }}>⚠ Anomaly</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
              <p>No transactions yet. <a href="/transactions" style={{ color: '#7c3aed' }}>Add your first →</a></p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
