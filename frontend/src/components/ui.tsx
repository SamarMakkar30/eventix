import { forwardRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { LoaderCircle, SearchX, TriangleAlert } from "lucide-react";
import { cn } from "../lib/utils";
import type { BookingStatus } from "../types/api";

export function Button({ className, loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return <button className={cn("button", className)} {...props} disabled={props.disabled || loading}>
    {loading && <LoaderCircle className="spin" size={17} />} {children}
  </button>;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(function Input({ label, error, className, ...props }, ref) {
  const id = props.id || props.name || "field";
  return <label className={cn("field", className)}>
    {label && <span>{label}</span>}
    <input ref={ref} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />
    {error && <small id={`${id}-error`} role="alert">{error}</small>}
  </label>;
});

export function Select({ label, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  return <label className={cn("field", className)}>{label && <span>{label}</span>}<select {...props}>{children}</select></label>;
}

export function Skeleton({ className }: { className?: string }) { return <div className={cn("skeleton", className)} aria-hidden="true" />; }

const labels: Record<BookingStatus, string> = { PENDING: "Pending", CONFIRMED: "Confirmed", PAYMENT_FAILED: "Payment failed", CANCELLED: "Cancelled" };
export function StatusBadge({ status }: { status: BookingStatus }) { return <span className={`status status--${status.toLowerCase()}`}>{labels[status]}</span>; }

export function EmptyState({ icon = <SearchX />, title, detail, action }: { icon?: ReactNode; title: string; detail: string; action?: ReactNode }) {
  return <div className="state-card empty-state"><div className="state-icon">{icon}</div><h2>{title}</h2><p>{detail}</p>{action}</div>;
}

export function ErrorState({ title = "Something went wrong", detail, retry }: { title?: string; detail: string; retry?: () => void }) {
  return <div className="state-card error-state"><div className="state-icon"><TriangleAlert /></div><h2>{title}</h2><p>{detail}</p>{retry && <Button onClick={retry}>Try again</Button>}</div>;
}
