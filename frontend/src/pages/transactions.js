import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Savings', 'Other'];
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const EMPTY = { title: '', amount: '', type: 'expense', category: 'Food', merchant: '', date: new Date().toISOString().split('T')[0], note: '', isRecurring: false };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ type: '', category: '', search: '' });
  const [editId, setEditId] = useState(null);

  const fetchTxns = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchTxns(); }, [fetchTxns]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/transactions/${editId}`, { ...form, amount: parseFloat(form.amount) });
        toast.success('Transaction updated!');
      } else {
        await api.post('/transactions', { ...form, amount: parseFloat(form.amount) });
        toast.success('Transaction added!');
      }
      setShowModal(false);
      setForm(EMPTY);
      setEditId(null);
      fetchTxns();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      fetchTxns();
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (t) => {
    setForm({ title: t.title, amount: t.amount, type: t.type, category: t.category, merchant: t.merchant || '', date: new Date(t.date).toISOString().split('T')[0], note: t.note || '', isRecurring: t.isRecurring });
    setEditId(t._id);
    setShowModal(true);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800', color: '#e2e8f0', marginBottom: '4px' }}>Transactions</h1>
            <p style={{ color: '#475569', fontSize: '14px' }}>{total} total transactions</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowModal(true); }}>+ Add Transaction</button>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '20px', padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: '1', minWidth: '180px' }} placeholder="🔍 Search transactions..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          <select className="input" style={{ width: '140px' }} value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="input" style={{ width: '160px' }} value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={() => setFilters({ type: '', category: '', search: '' })}>Clear</button>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
                  {['Transaction', 'Category', 'Date', 'Amount', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={6} style={{ padding: '16px 20px' }}><div className="loading-shimmer" style={{ height: '20px', borderRadius: '6px' }} /></td></tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>No transactions found. Add your first one!</td></tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '34px', height: '34px', background: t.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '14px' }}>{t.type === 'income' ? '↑' : '↓'}</span>
                          </div>
                          <div>
                            <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600' }}>{t.title}</p>
                            {t.merchant && <p style={{ color: '#475569', fontSize: '11px' }}>{t.merchant}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge badge-purple">{t.category}</span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '13px' }}>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: t.type === 'income' ? '#10b981' : '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>
                          {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {t.isAnomaly ? <span className="badge badge-red">⚠ Anomaly</span> : t.isRecurring ? <span className="badge badge-cyan">↺ Recurring</span> : <span className="badge badge-green">✓ Normal</span>}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openEdit(t)} style={{ background: 'transparent', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: '#a78bfa', fontSize: '12px' }}>Edit</button>
                          <button onClick={() => del(t._id)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: '12px' }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid rgba(124,58,237,0.12)' }}>
              <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: '12px', padding: '6px 14px' }}>← Prev</button>
              <span style={{ color: '#64748b', fontSize: '13px', padding: '6px 12px' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ fontSize: '12px', padding: '6px 14px' }}>Next →</button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '480px', animation: 'slideUp 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: '700', color: '#e2e8f0' }}>{editId ? 'Edit' : 'Add'} Transaction</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
              </div>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Type toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
                  {['expense', 'income'].map(t => (
                    <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', background: form.type === t ? (t === 'income' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #7c3aed, #5b21b6)') : 'transparent', color: form.type === t ? 'white' : '#64748b' }}>
                      {t === 'income' ? '↑ Income' : '↓ Expense'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Title *</label><input className="input" name="title" value={form.title} onChange={handle} placeholder="Netflix Subscription" required /></div>
                  <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Amount *</label><input className="input" type="number" name="amount" value={form.amount} onChange={handle} placeholder="49.99" step="0.01" min="0" required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Category *</label>
                    <select className="input" name="category" value={form.category} onChange={handle}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Date *</label><input className="input" type="date" name="date" value={form.date} onChange={handle} required /></div>
                </div>
                <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Merchant</label><input className="input" name="merchant" value={form.merchant} onChange={handle} placeholder="Amazon, Whole Foods..." /></div>
                <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Note</label><input className="input" name="note" value={form.note} onChange={handle} placeholder="Optional note..." /></div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" name="isRecurring" checked={form.isRecurring} onChange={handle} style={{ accentColor: '#7c3aed', width: '16px', height: '16px' }} />
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>Recurring transaction</span>
                </label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : editId ? 'Update' : 'Add Transaction'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
