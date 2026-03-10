'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';
interface ToastItem { id: number; message: string; type: ToastType; }
interface ToastContextValue { show: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextValue | null>(null);

// Componente Toast individual — definido FUERA de cualquier hook o provider
function ToastItem({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(item.id), 4000);
    return () => clearTimeout(t);
  }, [item.id, onClose]);
  const config = {
    success: { icon: CheckCircle, bg: 'bg-green-50 border-green-200', text: 'text-green-800', iconColor: 'text-green-500' },
    error: { icon: XCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-800', iconColor: 'text-red-500' },
    warning: { icon: AlertCircle, bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', iconColor: 'text-yellow-500' },
  }[item.type];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md ${config.bg}`}>
      <Icon size={18} className={config.iconColor} />
      <p className={`text-sm font-medium flex-1 ${config.text}`}>{item.message}</p>
      <button onClick={() => onClose(item.id)} className={config.iconColor}><X size={16} /></button>
    </div>
  );
}

// ToastContainer — definido FUERA del provider
function ToastContainer({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => <ToastItem key={t.id} item={t} onClose={onClose} />)}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, type: ToastType = 'success') => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  }, []);
  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}

export default ToastItem;
