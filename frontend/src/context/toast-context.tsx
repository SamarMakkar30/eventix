import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; tone: Tone; title: string; detail?: string };
interface ToastContextValue { show: (tone: Tone, title: string, detail?: string) => void; }
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const show = useCallback((tone: Tone, title: string, detail?: string) => {
    const id = Date.now() + Math.round(Math.random() * 1000);
    setToasts((current) => [...current.slice(-3), { id, tone, title, detail }]);
    window.setTimeout(() => dismiss(id), 5200);
  }, [dismiss]);
  const value = useMemo(() => ({ show }), [show]);
  const Icon = ({ tone }: { tone: Tone }) => tone === "success" ? <CheckCircle2 /> : tone === "error" ? <TriangleAlert /> : <Info />;
  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => <motion.div className={`toast toast--${toast.tone}`} key={toast.id} initial={{ opacity: 0, y: 16, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 32 }}>
          <Icon tone={toast.tone} /><div><strong>{toast.title}</strong>{toast.detail && <span>{toast.detail}</span>}</div><button aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X size={16} /></button>
        </motion.div>)}
      </AnimatePresence>
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
