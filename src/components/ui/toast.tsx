"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastItem {
  key: number;
  msg: string;
}

interface ToastContextValue {
  toast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextKey = useRef(0);

  const toast = useCallback((msg: string) => {
    const key = ++nextKey.current;
    setToasts((ts) => [...ts, { key, msg }]);
    setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.key !== key));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((t, i) => (
        <div
          key={t.key}
          className="ad-toast"
          style={i > 0 ? { bottom: 26 + i * 54 } : undefined}
        >
          {t.msg}
        </div>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
