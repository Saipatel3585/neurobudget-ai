import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '../hooks/useAuthStore';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111118',
            color: '#e2e8f0',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '12px',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#111118' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#111118' } },
        }}
      />
    </>
  );
}
