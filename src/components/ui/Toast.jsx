import React, { createContext, useContext, useState, useCallback } from 'react';

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

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 left-5 z-[9999] flex flex-col space-y-2 pointer-events-none dir-rtl">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between min-w-[280px] max-w-md px-4 py-3 rounded-xl shadow-lg text-xs font-medium transition-all transform translate-y-0 ${
              toast.type === 'error'
                ? 'bg-rose-900 text-rose-100 border border-rose-700'
                : toast.type === 'info'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'bg-emerald-900 text-emerald-100 border border-emerald-700'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <span>
                {toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✓'}
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="mr-3 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: (msg) => console.log("Toast:", msg) };
  }
  return context;
};
