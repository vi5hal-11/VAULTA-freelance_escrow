import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Info, X } from 'lucide-react';
import { useStore } from '@/store/useStore';

type ToastType = 'success' | 'error' | 'pending' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  txHash?: string;
}

const typeStyles: Record<ToastType, string> = {
  success: 'border-green-500/30 bg-green-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  pending: 'border-yellow-500/30 bg-yellow-500/10',
  info: 'border-blue-500/30 bg-blue-500/10',
};

const typeIcons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  pending: Clock,
  info: Info,
};

const typeIconColors: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  pending: 'text-yellow-400',
  info: 'text-blue-400',
};

function shortenHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

interface ToastItemProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastItemProps) {
  const Icon = typeIcons[toast.type];
  const autoDismissMs = toast.type === 'success' ? 3000 : 5000;

  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), autoDismissMs);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, autoDismissMs, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`
        flex items-start gap-3 w-80 p-4 rounded-xl border
        backdrop-blur-xl shadow-lg
        ${typeStyles[toast.type]}
      `}
    >
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${typeIconColors[toast.type]}`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90">{toast.message}</p>
        {toast.txHash && (
          <p className="text-xs text-white/50 mt-1 font-mono">
            Tx: {shortenHash(toast.txHash)}
          </p>
        )}
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="p-0.5 rounded text-white/40 hover:text-white/80 transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
