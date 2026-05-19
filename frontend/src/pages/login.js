import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading } = useAuthStore();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', monthlyIncome: '' });

  useEffect(() => { if (isAuthenticated) router.push('/dashboard'); }, [isAuthenticated]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const result = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password, parseFloat(form.monthlyIncome) || 0);

    if (result.success) {
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      router.push('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeIn 0.5s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}>🧠</div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NeuroBudget AI</span>
          </div>
          <p style={{ color: '#475569', fontSize: '14px' }}>AI-Powered Financial Intelligence</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
            {['login', 'register'].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', background: mode === m ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'transparent', color: mode === m ? 'white' : '#64748b', boxShadow: mode === m ? '0 0 20px rgba(124,58,237,0.3)' : 'none' }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                <input className="input" name="name" value={form.name} onChange={handle} placeholder="Alex Johnson" required />
              </div>
            )}

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input className="input" type="email" name="email" value={form.email} onChange={handle} placeholder="alex@example.com" required />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <input className="input" type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" required />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Income (optional)</label>
                <input className="input" type="number" name="monthlyIncome" value={form.monthlyIncome} onChange={handle} placeholder="5000" />
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ marginTop: '8px', padding: '14px', fontSize: '15px' }}>
              {isLoading ? '⏳ Processing...' : mode === 'login' ? '→ Sign In' : '→ Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: '10px' }}>
              <p style={{ color: '#06b6d4', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>🔑 Demo Account</p>
              <p style={{ color: '#475569', fontSize: '12px' }}>Email: demo@neurobudget.ai</p>
              <p style={{ color: '#475569', fontSize: '12px' }}>Password: demo1234</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
