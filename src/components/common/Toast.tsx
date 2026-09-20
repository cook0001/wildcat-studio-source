import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showSuccess: (title: string, description?: string) => void;
  showError: (title: string, description?: string) => void;
  showInfo: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 4500;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const showSuccess = useCallback((title: string, description?: string) => {
    showToast({ type: 'success', title, description });
  }, [showToast]);

  const showError = useCallback((title: string, description?: string) => {
    showToast({ type: 'error', title, description });
  }, [showToast]);

  const showInfo = useCallback((title: string, description?: string) => {
    showToast({ type: 'info', title, description });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      {/* Toast Notification Container */}
      <aside 
        aria-live="polite"
        aria-label="Notification alerts"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const borderColor = isSuccess ? '#10b981' : isError ? '#ef4444' : '#3b82f6';
          const bgColor = isSuccess 
            ? 'rgba(6, 78, 59, 0.88)' 
            : isError 
            ? 'rgba(127, 29, 29, 0.88)' 
            : 'rgba(30, 58, 138, 0.88)';

          return (
            <div
              key={toast.id}
              role="status"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                color: '#ffffff',
                fontSize: '13px',
                lineHeight: 1.4,
                WebkitBackdropFilter: 'blur(12px)',
                backdropFilter: 'blur(12px)',
                animation: 'wildcatToastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
              }}
              onClick={() => removeToast(toast.id)}
            >
              <div style={{ flexShrink: 0, marginTop: '1px' }}>
                {isSuccess && <CheckCircle2 size={18} color="#34d399" />}
                {isError && <AlertCircle size={18} color="#f87171" />}
                {!isSuccess && !isError && <Info size={18} color="#60a5fa" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#f8fafc', letterSpacing: '0.01em' }}>
                  {toast.title}
                </div>
                {toast.description && (
                  <div style={{ color: '#cbd5e1', marginTop: '2px', fontSize: '12px', wordBreak: 'break-word' }}>
                    {toast.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
