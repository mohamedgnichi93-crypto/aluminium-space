import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let globalAddToast: ((message: string, type: ToastType) => void) | null = null;

export const toast = {
  success: (message: string) => globalAddToast?.(message, 'success'),
  error: (message: string) => globalAddToast?.(message, 'error'),
  info: (message: string) => globalAddToast?.(message, 'info'),
  warning: (message: string) => globalAddToast?.(message, 'warning'),
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => {
      const next = [...prev, { id, message, type }];
      return next.slice(-3); // max 3
    });

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      if (globalAddToast === addToast) globalAddToast = null;
    };
  }, [addToast]);

  return { toasts, addToast, removeToast };
};
