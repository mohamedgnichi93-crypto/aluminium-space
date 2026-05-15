import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastItem } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: { bg: '#F0FDF4', border: '#DCFCE7', icon: '#16A34A' },
  error: { bg: '#FEF2F2', border: '#FEE2E2', icon: '#DC2626' },
  info: { bg: '#EEF4FF', border: '#D0E1FD', icon: '#1A5DA8' },
  warning: { bg: '#FFF7ED', border: '#FFEDD5', icon: '#EA580C' },
};

const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[9998] flex flex-col items-center gap-3 pointer-events-none w-full max-w-[90vw] md:max-w-[400px]">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          const color = colors[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] w-full"
              style={{
                background: color.bg,
                border: `1px solid ${color.border}`,
              }}
            >
              <Icon className="w-5 h-5 shrink-0" style={{ color: color.icon }} />
              <span className="text-[var(--text-primary)] text-[14px] font-medium flex-1">{t.message}</span>
              <button
                onClick={() => onRemove(t.id)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
