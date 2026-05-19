import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useAuthStore from '../hooks/useAuthStore';

const NAV = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/transactions', icon: '↕', label: 'Transactions' },
  { href: '/analytics', icon: '📈', label: 'Analytics' },
  { href: '/budgets', icon: '🎯', label: 'Budgets' },
  { href: '/assistant', icon: '🧠', label: 'AI Assistant' },
  { href: '/insights', icon: '✦', label: 'Insights' },
  { href: '/settings', icon: '⚙', label: 'Settings' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
      {/* Sidebar */}
      <aside style={{ width: '240px', minHeight: '100vh', background: '#111118', borderRight: '1px solid rgba(124,58,237,0.12)', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '32px' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>🧠</div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '15px', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NeuroBudget</div>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: '600', letterSpacing: '0.1em' }}>AI FINANCIAL OS</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(({ href, icon, label }) => {
            const active = router.pathname === href;
            return (
              <Link key={href} href={href} className={`sidebar-link ${active ? 'active' : ''}`}>
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{icon}</span>
                <span style={{ fontSize: '14px' }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(124,58,237,0.12)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ color: '#475569', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.plan === 'premium' ? '⭐ Premium' : 'Free Plan'}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', fontSize: '13px', padding: '8px' }}>
            ⎋ Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
