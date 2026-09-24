import { useState, useEffect } from 'react';

let addToastFn = null;

export function notify(message, type = 'info', duration = 4000) {
  if (addToastFn) {
    addToastFn({ id: Date.now() + Math.random(), message, type, duration });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 4000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 2000,
      maxWidth: '360px',
      width: '100%'
    }}>
      {toasts.map((toast) => {
        let border = 'var(--primary)';
        let bg = 'rgba(17, 24, 39, 0.95)';
        let icon = 'ℹ️';

        if (toast.type === 'success') {
          border = 'var(--accent)';
          icon = '✅';
        } else if (toast.type === 'error') {
          border = 'var(--danger)';
          icon = '⚠️';
        } else if (toast.type === 'warning') {
          border = 'var(--warning)';
          icon = '🔔';
        }

        return (
          <div
            key={toast.id}
            className="glass-panel animate-fade-in"
            style={{
              borderLeft: `4px solid ${border}`,
              background: bg,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
              <span>{icon}</span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', marginLeft: '12px' }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
