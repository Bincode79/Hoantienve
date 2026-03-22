import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Hook
export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback for usage outside provider
    return {
      toast: (_, title, message) => { alert(message ? `${title}\n${message}` : title); },
      success: (title, message) => { alert(message ? `${title}\n${message}` : title); },
      error: (title, message) => { alert(message ? `${title}\n${message}` : title); },
      warning: (title, message) => { alert(message ? `${title}\n${message}` : title); },
      info: (title, message) => { alert(message ? `${title}\n${message}` : title); },
    };
  }
  return ctx;
}

// Icons & colors map
const TOAST_CONFIG: Record<ToastType, { 
  icon: React.ReactNode; 
  bg: string; 
  border: string; 
  titleColor: string;
  iconBg: string;
}> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    titleColor: 'text-emerald-800',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  error: {
    icon: <XCircle size={18} />,
    bg: 'bg-red-50',
    border: 'border-red-300',
    titleColor: 'text-red-800',
    iconBg: 'bg-red-100 text-red-600',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    titleColor: 'text-amber-800',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  info: {
    icon: <Info size={18} />,
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    titleColor: 'text-blue-800',
    iconBg: 'bg-blue-100 text-blue-600',
  },
};

// Single Toast Component
const ToastCard: React.FC<{ item: ToastItem; onDismiss: (id: string) => void }> = ({ item, onDismiss }) => {
  const config = TOAST_CONFIG[item.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), item.duration || 4000);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-sm ${config.bg} border ${config.border} rounded-lg shadow-lg flex items-start gap-3 p-3.5 pointer-events-auto`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.iconBg}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-bold ${config.titleColor} leading-tight`}>{item.title}</p>
        {item.message && (
          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{item.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200/50 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message, duration }]); // max 5
  }, []);

  const ctx: ToastContextType = {
    toast: addToast,
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message),
    warning: (title, message) => addToast('warning', title, message),
    info: (title, message) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast Container - Fixed Top Right */}
      <div className="fixed top-3 right-3 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(item => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
