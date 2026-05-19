import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Savings', 'Other'];
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const ICONS = { Housing:'🏠', Food:'🍔', Transport:'🚗', Utilities:'💡', Entertainment:'🎬', Healthcare:'💊', Shopping:'🛍', Education:'📚', Savings:'💰', Other:'📦' };

export default function Budgets() {
  const now = new Date();
  const [budgets, setBudgets] = useState([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'Food', limit: '' });
  const [saving, setSaving] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets', { params: { month, year } });
      setBudgets(res.data.budgets);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgets(); }, [month, year]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/budgets', { ...form, limit: parseFloat(form.limit), month, year });
      toast.success('Budget saved!');
      setShowModal(false);
      setForm({ category: 'Food', limit: '' });
      fetchBudgets();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save budget'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this budget?')) return;
    try { await api.delete(`/budgets/${id}`); toast.success('Budget deleted'); fetchBudgets(); }
    catch { toast.error('Failed to delete'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800', color: '#e2e8f0', marginBottom: '4px' }}>Budgets</h1>
            <p style={{ color: '#475569', fontSize: '14px' }}>Set and track your spending limits</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select className="input" style={{ width: '110px' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => <option key={m} value={i+1}>{m.slice(0,3)}</option>)}
            </select>
            <select className="input" style={{ width: '90px' }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Set Budget</button>
          </div>
        </div>

        {/* Summary */}
        {budgets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Budgeted', value: fmt(totalBudget), color: '#a78bfa', icon: '🎯' },
              { label: 'Total Spent', value: fmt(totalSpent), color: totalSpent > totalBudget ? '#ef4444' : '#e2e8f0', icon: '💸' },
              { label: 'Remaining', value: fmt(totalBudget - totalSpent), color: totalBudget - totalSpent >= 0 ? '#10b981' : '#ef4444', icon: '💰' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                  <span style={{ fontSize: '18px' }}>{s.icon}</span>
                </div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Budget cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[1,2,3,4].map(i => <div key={i} className="card loading-shimmer" style={{ height: '140px' }} />)}
          </div>
        ) : budgets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '80px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</p>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', color: '#e2e8f0', marginBottom: '8px' }}>No budgets set</h3>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px' }}>Create budgets to track your spending limits</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Set First Budget</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {budgets.map((b) => {
              const pct = Math.min(100, parseFloat(b.usagePercent));
              const overBudget = b.spent > b.limit;
              const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';
              return (
                <div key={b._id} className="card" style={{ position: 'relative', overflow: 'hidden', borderColor: overBudget ? 'rgba(239,68,68,0.3)' : undefined }}>
                  {overBudget && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{ICONS[b.category] || '📦'}</span>
                      <div>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: '700', color: '#e2e8f0' }}>{b.category}</h3>
                        <p style={{ color: '#475569', fontSize: '11px' }}>{b.count || 0} transactions</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {overBudget && <span className="badge badge-red" style={{ fontSize: '10px' }}>Over Budget</span>}
                      <button onClick={() => del(b._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '14px' }}>✕</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Spent: <strong style={{ color: overBudget ? '#ef4444' : '#e2e8f0' }}>{fmt(b.spent)}</strong></span>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Limit: <strong style={{ color: '#e2e8f0' }}>{fmt(b.limit)}</strong></span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '4px', transition: 'width 0.6s ease', boxShadow: `0 0 8px ${barColor}60` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: barColor, fontWeight: '700' }}>{pct}% used</span>
                    <span style={{ fontSize: '12px', color: overBudget ? '#ef4444' : '#475569' }}>
                      {overBudget ? `${fmt(b.spent - b.limit)} over` : `${fmt(b.remaining)} left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', animation: 'slideUp 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: '700', color: '#e2e8f0' }}>Set Budget</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
              </div>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Category</label>
                  <select className="input" name="category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Monthly Limit ($)</label>
                  <input className="input" type="number" min="1" step="1" placeholder="500" value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} required />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Set Budget'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
