import React, { createContext, useContext, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; message?: string }) => void;
  addToast: (options: { type?: ToastType; title: string; message?: string }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message }: { type?: ToastType; title: string; message?: string }) => {
      const id = `toast-${Date.now()}-${++toastIdCounter}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => removeToast(id), 5000);
    },
    [removeToast],
  );

  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, addToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={clsx(
              'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 bg-card text-card-foreground',
              item.type === 'success' && 'border-emerald-500/30 text-emerald-950 dark:text-emerald-100',
              item.type === 'error' && 'border-rose-500/30 text-rose-950 dark:text-rose-100',
              item.type === 'warning' && 'border-amber-500/30 text-amber-950 dark:text-amber-100',
              item.type === 'info' && 'border-sky-500/30 text-sky-950 dark:text-sky-100',
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {item.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {item.type === 'info' && <Info className="w-5 h-5 text-sky-500" />}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {item.message && <p className="text-xs text-muted-foreground">{item.message}</p>}
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-muted-foreground hover:text-foreground rounded p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
