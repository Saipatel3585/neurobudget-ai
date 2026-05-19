import { useState } from 'react';
import Layout from '../components/Layout';
import useAuthStore from '../hooks/useAuthStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', monthlyIncome: user?.monthlyIncome || '', savingsGoal: user?.savingsGoal || '', currency: user?.currency || 'USD' });
  const [saving, setSaving] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', { ...form, monthlyIncome: parseFloat(form.monthlyIncome) || 0, savingsGoal: parseFloat(form.savingsGoal) || 0 });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: '600px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800', color: '#e2e8f0', marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: '#475569', fontSize: '14px', marginBottom: '28px' }}>Manage your profile and preferences</p>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0', marginBottom: '20px' }}>Profile</h2>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <input className="input" name="name" value={form.name} onChange={handle} placeholder="Your name" /></div>
            <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Email</label>
              <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Monthly Income</label>
                <input className="input" type="number" name="monthlyIncome" value={form.monthlyIncome} onChange={handle} placeholder="5000" /></div>
              <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Savings Goal</label>
                <input className="input" type="number" name="savingsGoal" value={form.savingsGoal} onChange={handle} placeholder="1000" /></div>
            </div>
            <div><label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Currency</label>
              <select className="input" name="currency" value={form.currency} onChange={handle}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
              </select></div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0', marginBottom: '16px' }}>AI Configuration</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'AI Engine', value: 'Groq Cloud API', badge: 'badge-green' },
              { label: 'Model', value: 'llama3-70b-8192', badge: 'badge-purple' },
              { label: 'Speed', value: '~300 tokens/sec', badge: 'badge-cyan' },
              { label: 'Anomaly Detection', value: 'Z-Score Statistical Model', badge: 'badge-yellow' },
              { label: 'API Docs', value: 'console.groq.com', badge: 'badge-purple' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>{r.label}</span>
                <span className={`badge ${r.badge}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
