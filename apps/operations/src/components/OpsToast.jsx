import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 5000),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="ops-toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`ops-toast ${t.type === 'success' ? 'ops-toast-success' : t.type === 'error' ? 'ops-toast-error' : ''}`}
            onClick={() => removeToast(t.id)}
            style={{ cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
            </span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', opacity: 0.7 }}>
              close
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: (m) => console.log('[Toast success]', m),
      error: (m) => console.error('[Toast error]', m),
      info: (m) => console.log('[Toast info]', m),
    };
  }
  return ctx;
}
