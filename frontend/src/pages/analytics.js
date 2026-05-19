import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const COLORS = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#14b8a6','#f97316','#a3e635'];

export default function Analytics() {
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/trends'),
      api.get('/analytics/categories', { params: { month, year } }),
      api.get('/analytics/predict'),
    ]).then(([t, c, p]) => {
      setTrends(t.data.trends);
      setCategories(c.data.categories);
      setPrediction(p.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [month, year]);

  const trendData = trends.map(t => ({ name: t.label, Income: t.income, Expenses: t.expenses, Savings: Math.max(0, t.net) }));
  const pieData = categories.map(c => ({ name: c.name, value: c.spent }));

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: '1300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800', color: '#e2e8f0', marginBottom: '4px' }}>Analytics</h1>
            <p style={{ color: '#475569', fontSize: '14px' }}>Deep dive into your financial patterns</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select className="input" style={{ width: '120px' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <select className="input" style={{ width: '90px' }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* 6-month bar chart */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0', marginBottom: '20px' }}>Income vs Expenses (6 Months)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData} barSize={26}>
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', color: '#e2e8f0' }} formatter={v => [fmt(v), '']} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[6,6,0,0]} />
              <Bar dataKey="Expenses" fill="#7c3aed" radius={[6,6,0,0]} />
              <Bar dataKey="Savings" fill="#06b6d4" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Category breakdown */}
          <div className="card">
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0', marginBottom: '20px' }}>Category Breakdown</h2>
            {categories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', color: '#e2e8f0' }} formatter={v => [fmt(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {categories.sort((a,b) => b.spent - a.spent).map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, color: '#94a3b8', fontSize: '13px' }}>{c.name}</span>
                      <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(c.spent)}</span>
                      {c.budget && (
                        <span style={{ fontSize: '11px', color: Number(c.percentage) > 90 ? '#ef4444' : '#475569' }}>{c.percentage}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>No expense data for this month</div>
            )}
          </div>

          {/* Prediction chart */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>AI Spending Forecast</h2>
                <p style={{ color: '#475569', fontSize: '12px' }}>Predictive analytics</p>
              </div>
              {prediction && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#a78bfa', fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: '800' }}>{fmt(prediction.predictedSpending)}</div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>next month · {prediction.confidence}% confidence</div>
                </div>
              )}
            </div>
            {prediction?.monthlyData ? (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={[...prediction.monthlyData.map(m => ({ name: `M${m.month}`, Actual: m.actual })), { name: 'Next', Predicted: prediction.predictedSpending }]}>
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', color: '#e2e8f0' }} formatter={v => v ? [fmt(v), ''] : ['-','']} />
                  <Line type="monotone" dataKey="Actual" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="Predicted" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: '#a78bfa', r: 5 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Not enough data for prediction</div>
            )}
            {prediction && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <div style={{ flex: 1, padding: '10px', background: 'rgba(124,58,237,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '2px' }}>Historical Avg</div>
                  <div style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '14px' }}>{fmt(prediction.historicalAverage)}</div>
                </div>
                <div style={{ flex: 1, padding: '10px', background: 'rgba(6,182,212,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '2px' }}>Trend</div>
                  <div style={{ color: prediction.trend === 'increasing' ? '#ef4444' : '#10b981', fontWeight: '700', fontSize: '14px' }}>{prediction.trend === 'increasing' ? '↑ Rising' : '↓ Falling'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Budget utilization table */}
        {categories.some(c => c.budget) && (
          <div className="card">
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0', marginBottom: '20px' }}>Budget Utilization</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.filter(c => c.budget).map((c, i) => (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{c.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{fmt(c.spent)} / {fmt(c.budget)}</span>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: Number(c.percentage) > 90 ? '#ef4444' : Number(c.percentage) > 70 ? '#f59e0b' : '#10b981' }}>{c.percentage}%</span>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, c.percentage)}%`, background: Number(c.percentage) > 90 ? '#ef4444' : Number(c.percentage) > 70 ? '#f59e0b' : COLORS[i % COLORS.length], borderRadius: '3px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
