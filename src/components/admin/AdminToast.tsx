'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Overlay */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                background: '#171920',
                border: `1px solid ${
                  isSuccess
                    ? 'rgba(46, 213, 115, 0.4)'
                    : isError
                    ? 'rgba(229, 57, 79, 0.5)'
                    : isWarning
                    ? 'rgba(245, 158, 11, 0.5)'
                    : 'rgba(130, 120, 255, 0.4)'
                }`,
                boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 500,
                animation: 'slideInRight 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {isSuccess && <CheckCircle2 size={18} color="#2ed573" style={{ flexShrink: 0 }} />}
              {isError && <AlertCircle size={18} color="var(--accent-crimson)" style={{ flexShrink: 0 }} />}
              {isWarning && <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0 }} />}
              {!isSuccess && !isError && !isWarning && <Info size={18} color="var(--accent-violet)" style={{ flexShrink: 0 }} />}

              <span style={{ flex: 1 }}>{toast.message}</span>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
