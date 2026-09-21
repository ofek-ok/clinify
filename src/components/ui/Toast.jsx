import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getIcon = (type) => {
    if (type === 'error') return AlertCircle;
    if (type === 'info') return Info;
    return CheckCircle2;
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-5 z-[9999] flex flex-col gap-2 dir-rtl">
        {toasts.map(toast => {
          const Icon = getIcon(toast.type);
          const tone = toast.type === 'error'
            ? 'border-rose-200 text-rose-700'
            : toast.type === 'info'
              ? 'border-slate-200 text-slate-700'
              : 'border-emerald-200 text-emerald-700';

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex min-w-[280px] max-w-md items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-xs font-medium shadow-lg ${tone}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="סגור הודעה"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: (msg) => console.log('Toast:', msg) };
  }
  return context;
};
