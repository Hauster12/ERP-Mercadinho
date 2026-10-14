import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const value = {
    toast: addToast,
    success: (t: string, m?: string) => addToast('success', t, m),
    error: (t: string, m?: string) => addToast('error', t, m),
    warning: (t: string, m?: string) => addToast('warning', t, m),
    info: (t: string, m?: string) => addToast('info', t, m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in slide-in-from-right-5 ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : t.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : t.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-600" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-cyan-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold tracking-wide">{t.title}</p>
              {t.message && (
                <p className={`text-xs mt-0.5 leading-relaxed ${
                  t.type === 'error' ? 'text-rose-800' : 'text-slate-600'
                }`}>
                  {t.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
