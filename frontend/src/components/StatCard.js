export default function StatCard({ label, value, sub, color = '#a78bfa', icon, trend }) {
  const trendUp = trend > 0;
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${color}18, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800', color: color, marginBottom: '8px', lineHeight: 1 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {trend !== undefined && (
          <span style={{ fontSize: '12px', fontWeight: '600', color: trendUp ? '#10b981' : '#ef4444' }}>
            {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        {sub && <span style={{ color: '#475569', fontSize: '12px' }}>{sub}</span>}
      </div>
    </div>
  );
}
