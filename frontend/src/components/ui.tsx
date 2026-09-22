import { forwardRef, useEffect, useRef } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  PointerEvent,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { LoaderCircle, SearchX, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../lib/utils";
import type { BookingStatus } from "../types/api";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }
>(function Button({ className, loading, children, onPointerDown, ...props }, ref) {
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const bounds = button.getBoundingClientRect();
    button.style.setProperty("--ripple-x", `${event.clientX - bounds.left}px`);
    button.style.setProperty("--ripple-y", `${event.clientY - bounds.top}px`);
    button.classList.remove("button--ripple");
    void button.offsetWidth;
    button.classList.add("button--ripple");
    window.setTimeout(() => button.classList.remove("button--ripple"), 500);
    onPointerDown?.(event);
  };

  return (
    <button
      ref={ref}
      className={cn("button", className)}
      onPointerDown={handlePointerDown}
      {...props}
      disabled={props.disabled || loading}
    >
      {loading && <LoaderCircle className="spin" size={17} />} {children}
    </button>
  );
});

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(function Input({ label, error, className, ...props }, ref) {
  const id = props.id || props.name || "field";
  return (
    <label className={cn("field", className)}>
      {label && <span>{label}</span>}
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <small id={`${id}-error`} role="alert">
          {error}
        </small>
      )}
    </label>
  );
});

export function Select({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("field", className)}>
      {label && <span>{label}</span>}
      <select {...props}>{children}</select>
    </label>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

const labels: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PAYMENT_FAILED: "Payment failed",
  CANCELLED: "Cancelled",
};
export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`status status--${status.toLowerCase()}`}>
      {labels[status]}
    </span>
  );
}

export function EmptyState({
  icon = <SearchX />,
  title,
  detail,
  action,
}: {
  icon?: ReactNode;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-card empty-state">
      <div className="state-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{detail}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  detail,
  retry,
}: {
  title?: string;
  detail: string;
  retry?: () => void;
}) {
  return (
    <div className="state-card error-state">
      <div className="state-icon">
        <TriangleAlert />
      </div>
      <h2>{title}</h2>
      <p>{detail}</p>
      {retry && <Button onClick={retry}>Try again</Button>}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="dialog-backdrop"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) onClose();
          }}
        >
          <motion.section
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
          >
            <p className="eyebrow">Please confirm</p>
            <h2 id="confirm-dialog-title">{title}</h2>
            <p id="confirm-dialog-description">{description}</p>
            <div className="confirm-dialog__actions">
              <Button
                ref={cancelRef}
                className="button--ghost"
                disabled={loading}
                onClick={onClose}
              >
                Keep it
              </Button>
              <Button
                className="button--danger"
                loading={loading}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
