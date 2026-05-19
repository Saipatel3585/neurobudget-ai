import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  spending_pattern: { icon: '📊', color: '#7c3aed', badge: 'badge-purple', label: 'Pattern' },
  anomaly: { icon: '⚠️', color: '#ef4444', badge: 'badge-red', label: 'Anomaly' },
  recommendation: { icon: '💡', color: '#f59e0b', badge: 'badge-yellow', label: 'Tip' },
  prediction: { icon: '🔮', color: '#06b6d4', badge: 'badge-cyan', label: 'Forecast' },
  savings_tip: { icon: '💰', color: '#10b981', badge: 'badge-green', label: 'Savings' },
  budget_alert: { icon: '🎯', color: '#ef4444', badge: 'badge-red', label: 'Alert' },
};

const fmt = (n) => n ? `$${n.toLocaleString()}` : null;

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/insights');
      setInsights(res.data.insights);
    } catch { toast.error('Failed to load insights'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInsights(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/ai/insights/generate');
      if (res.data.message) { toast(res.data.message); }
      else { toast.success(`Generated ${res.data.insights.length} new insights!`); fetchInsights(); }
    } catch { toast.error('Failed to generate insights. Check if Ollama is running.'); }
    finally { setGenerating(false); }
  };

  const dismiss = async (id) => {
    try {
      await api.put(`/ai/insights/${id}/dismiss`);
      setInsights(i => i.filter(x => x._id !== id));
      toast.success('Insight dismissed');
    } catch { toast.error('Failed to dismiss'); }
  };

  const totalSavings = insights.reduce((s, i) => s + (i.savingsPotential || 0), 0);

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800', color: '#e2e8f0', marginBottom: '4px' }}>AI Insights</h1>
            <p style={{ color: '#475569', fontSize: '14px' }}>Personalized financial intelligence powered by AI</p>
          </div>
          <button className="btn btn-primary" onClick={generate} disabled={generating}>
            {generating ? '⏳ Analyzing...' : '✦ Generate Insights'}
          </button>
        </div>

        {/* Summary */}
        {insights.length > 0 && totalSavings > 0 && (
          <div className="card" style={{ marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08))', borderColor: 'rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '32px' }}>💰</span>
              <div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px' }}>
                  Potential Monthly Savings: <span style={{ color: '#10b981' }}>{fmt(totalSavings)}</span>
                </h3>
                <p style={{ color: '#475569', fontSize: '13px' }}>Based on {insights.length} AI recommendations</p>
              </div>
            </div>
          </div>
        )}

        {/* Insights grid */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1,2,3].map(i => <div key={i} className="card loading-shimmer" style={{ height: '100px' }} />)}
          </div>
        ) : insights.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '80px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>✦</p>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', color: '#e2e8f0', marginBottom: '8px' }}>No insights yet</h3>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px' }}>Add transactions and click "Generate Insights" for AI analysis</p>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? '⏳ Analyzing...' : '✦ Generate Now'}</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {insights.map((insight) => {
              const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.recommendation;
              return (
                <div key={insight._id} className="card" style={{ animation: 'slideUp 0.3s ease', borderLeft: `3px solid ${config.color}` }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '44px', height: '44px', background: `${config.color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, border: `1px solid ${config.color}25` }}>
                      {config.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: '700', color: '#e2e8f0' }}>{insight.title}</h3>
                        <span className={`badge ${config.badge}`} style={{ fontSize: '10px' }}>{config.label}</span>
                        {insight.priority === 'high' && <span className="badge badge-red" style={{ fontSize: '10px' }}>HIGH PRIORITY</span>}
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>{insight.content}</p>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {insight.savingsPotential > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#475569', fontSize: '11px' }}>Potential saving:</span>
                            <span style={{ color: '#10b981', fontWeight: '700', fontSize: '13px' }}>{fmt(insight.savingsPotential)}/mo</span>
                          </div>
                        )}
                        {insight.confidence > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#475569', fontSize: '11px' }}>Confidence:</span>
                            <span style={{ color: '#06b6d4', fontWeight: '700', fontSize: '13px' }}>{insight.confidence}%</span>
                          </div>
                        )}
                        {insight.relatedCategory && (
                          <span className="badge badge-purple" style={{ fontSize: '10px' }}>{insight.relatedCategory}</span>
                        )}
                        <span style={{ color: '#334155', fontSize: '11px', marginLeft: 'auto' }}>
                          {new Date(insight.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => dismiss(insight._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#334155', fontSize: '16px', flexShrink: 0, padding: '4px' }} title="Dismiss">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
