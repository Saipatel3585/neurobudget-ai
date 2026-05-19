import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'How can I reduce my food spending?',
  'What\'s my savings rate this month?',
  'Analyze my biggest expenses',
  'Give me a budgeting plan',
  'What are my recurring costs?',
  'How do I reach my savings goal?',
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your NeuroBudget AI advisor. I have access to your financial data and can help you analyze spending patterns, identify savings opportunities, and create personalized financial strategies. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    api.get('/ai/status').then(r => setAiStatus(r.data)).catch(() => {});
  }, []);

  const send = async (text = input) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/chat', { message: text, conversationHistory: history });
      setMessages(m => [...m, { role: 'assistant', content: res.data.response, offline: res.data.offline }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', error: true }]);
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <Layout>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '32px 32px 0', maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '800', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🧠 AI Financial Advisor
            </h1>
            <p style={{ color: '#475569', fontSize: '14px' }}>Powered by Groq · llama3-70b · Ultra-fast inference</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: aiStatus?.status === 'online' ? '#10b981' : '#ef4444', boxShadow: aiStatus?.status === 'online' ? '0 0 8px #10b981' : '0 0 8px #ef4444' }} />
            <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
              {aiStatus?.status === 'online' ? `Groq Online · ${aiStatus.model}` : 'Groq Offline — Check API Key'}
            </span>
          </div>
        </div>

        {aiStatus?.status === 'offline' && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ color: '#f59e0b', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Groq API is not connected</p>
              <p style={{ color: '#78716c', fontSize: '12px' }}>
                Set <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>GROQ_API_KEY</code> in your backend <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>.env</code> file.
                Get a free key at <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: '#f59e0b' }}>console.groq.com</a>
              </p>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', animation: 'slideUp 0.3s ease' }}>
              {m.role === 'assistant' && (
                <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, boxShadow: '0 0 15px rgba(124,58,237,0.3)' }}>🧠</div>
              )}
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  padding: '14px 18px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : m.error ? 'rgba(239,68,68,0.1)' : '#111118',
                  border: m.role === 'user' ? 'none' : `1px solid ${m.error ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.15)'}`,
                  color: '#e2e8f0', fontSize: '14px', lineHeight: '1.7',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {m.content}
                </div>
              </div>
              {m.role === 'user' && (
                <div style={{ width: '34px', height: '34px', background: 'rgba(124,58,237,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>👤</div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🧠</div>
              <div style={{ padding: '14px 18px', background: '#111118', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7c3aed', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '12px' }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} style={{ padding: '7px 14px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '20px', color: '#a78bfa', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Space Grotesk, sans-serif' }} onMouseEnter={e => { e.target.style.background = 'rgba(124,58,237,0.15)'; }} onMouseLeave={e => { e.target.style.background = 'rgba(124,58,237,0.08)'; }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ position: 'sticky', bottom: 0, paddingBottom: '24px', background: '#0a0a0f', paddingTop: '8px' }}>
          <div style={{ display: 'flex', gap: '12px', padding: '12px', background: '#111118', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '16px', boxShadow: '0 0 30px rgba(124,58,237,0.1)' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Ask anything about your finances..." rows={1} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '14px', fontFamily: 'Space Grotesk, sans-serif', resize: 'none', lineHeight: '1.5', maxHeight: '120px', overflow: 'auto' }} />
            <button onClick={() => send()} disabled={!input.trim() || loading} className="btn btn-primary" style={{ padding: '10px 20px', flexShrink: 0, fontSize: '13px' }}>
              {loading ? '⏳' : '→ Send'}
            </button>
          </div>
          <p style={{ color: '#334155', fontSize: '11px', textAlign: 'center', marginTop: '8px' }}>Powered by Groq · llama3-70b-8192 · Blazing fast inference</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </Layout>
  );
}
