import { useEffect, useRef, useState } from "react";
import { useDocumentMeta } from "../lib/use-document-meta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Ticket, CalendarDays, MapPin, X, AlertTriangle, RefreshCw, Download, CalendarPlus,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateTime } from "../lib/utils";
import { downloadTicket, downloadCalendar } from "../lib/ticket-files";
import { useToast } from "../context/toast-context";
import { overlayVariants, panelVariants } from "../components/motion-kit";
import type { Booking, BookingStatus } from "../types/api";

/* Audit fix: PAYMENT_FAILED is a real backend status — it now filters,
   styles, and reads correctly everywhere. */
const STATUS_ORDER: Array<"CONFIRMED" | "PENDING" | "PAYMENT_FAILED" | "CANCELLED"> =
  ["CONFIRMED", "PENDING", "PAYMENT_FAILED", "CANCELLED"];
const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  PAYMENT_FAILED: "Failed",
  CANCELLED: "Cancelled",
};
const statusBadgeClass = (s: BookingStatus) =>
  `status-badge status-badge--${s === "PAYMENT_FAILED" ? "payment_failed" : s.toLowerCase()}`;

/* ── Accessible confirm dialog: focus trap, Escape, restore focus ────── */
function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  destructive,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button, [href], input")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && panel) {
        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>("button:not([disabled]), [href]"),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="modal__header">
              <div className="modal__title">{title}</div>
              <button className="modal__close" onClick={onClose} aria-label="Close dialog">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="modal__body">{children}</div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={onClose}>Keep it</button>
              <button
                className={`btn ${destructive ? "btn--destructive" : "btn--primary"}${pending ? " btn--loading" : ""}`}
                onClick={onConfirm}
                disabled={pending}
              >
                {pending ? "" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Booking card ─────────────────────────────────────────────────────── */
function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (b: Booking) => void }) {
  const canCancel =
    booking.status === "CONFIRMED" && new Date(booking.showDateTime) > new Date();
  const stripeClass =
    booking.status === "CONFIRMED" ? "booking-v2--confirmed"
    : booking.status === "PENDING" ? "booking-v2--pending"
    : booking.status === "CANCELLED" ? "booking-v2--cancelled"
    : "booking-v2--payment_failed";

  return (
    <div className={`booking-v2 ${stripeClass}`}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.625rem", flexWrap: "wrap" }}>
          <span className="font-display" style={{ fontSize: "1.375rem", lineHeight: 1.15 }}>{booking.showTitle}</span>
          <span className="ticket-v2__ref" style={{ fontSize: "0.6875rem" }}>EVX-{String(booking.id).padStart(6, "0")}</span>
        </div>
        <div className="booking-card__meta" style={{ marginTop: "0.5rem" }}>
          <span className="booking-card__meta-item">
            <CalendarDays size={13} aria-hidden="true" /> {dateTime(booking.showDateTime)}
          </span>
          <span className="booking-card__meta-item">
            <MapPin size={13} aria-hidden="true" /> {booking.venueName}
          </span>
          <span className="booking-card__meta-item">
            <Ticket size={13} aria-hidden="true" /> {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <span className={statusBadgeClass(booking.status)}>{STATUS_LABELS[booking.status] ?? booking.status}</span>
        </div>
      </div>
      <div className="booking-card__side">
        <span className="booking-card__amount" style={{ fontSize: "1.0625rem" }}>{money(booking.totalAmount)}</span>
        {booking.status === "CONFIRMED" && (
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <button
              className="btn btn--ghost btn--icon btn--sm"
              onClick={() => downloadTicket(booking)}
              title="Download ticket"
              aria-label={`Download ticket for ${booking.showTitle}`}
            >
              <Download size={14} aria-hidden="true" />
            </button>
            <button
              className="btn btn--ghost btn--icon btn--sm"
              onClick={() => downloadCalendar(booking)}
              title="Add to calendar"
              aria-label={`Add ${booking.showTitle} to calendar`}
            >
              <CalendarPlus size={14} aria-hidden="true" />
            </button>
          </div>
        )}
        <Link to={`/confirmation/${booking.id}`} className="btn btn--ghost btn--sm">View</Link>
        {canCancel && (
          <button className="btn btn--secondary btn--sm" onClick={() => onCancel(booking)}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function BookingCardSkeleton() {
  return (
    <div className="booking-v2" style={{ borderLeft: "none" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="skeleton" style={{ height: "1.25rem", width: "55%" }} />
        <div className="skeleton" style={{ height: "0.875rem", width: "75%" }} />
        <div className="skeleton" style={{ height: "1.5rem", width: "90px", borderRadius: "999px" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
        <div className="skeleton" style={{ height: "1rem", width: "70px" }} />
        <div className="skeleton" style={{ height: "2.25rem", width: "70px", borderRadius: "var(--ev-radius-control)" }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MY BOOKINGS
   ══════════════════════════════════════════════════════════════════════════ */
export function BookingsPage() {
  useDocumentMeta("My bookings — Eventix", "Your Eventix bookings: upcoming shows, tickets, cancellations and downloads.");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const { show: toast } = useToast();
  const qc = useQueryClient();

  const { data: bookings = [], isLoading, error, refetch } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.bookings,
  });

  const cancel = useMutation({
    mutationFn: (id: number) => api.cancelBooking(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      toast("success", "Booking cancelled", "Your seats have been released. Refunds are simulated.");
      setCancelTarget(null);
    },
    onError: () => toast("error", "Cancel failed", "We couldn't cancel that booking — please try again."),
  });

  const filtered = filterStatus === "ALL"
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  const confirmedTotal = bookings.reduce((s, b) => s + (b.status === "CONFIRMED" ? b.totalAmount : 0), 0);
  const upcomingCount = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.showDateTime) > new Date(),
  ).length;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 820 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "2rem" }}>
          <p className="section-head__eyebrow">Your season</p>
          <h1 className="display" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.05, margin: "0.5rem 0 0.5rem" }}>
            My <em>bookings</em>
          </h1>
          {!isLoading && bookings.length > 0 && (
            <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
              {upcomingCount > 0 && <> · {upcomingCount} upcoming</>}
              {" · "}
              {money(confirmedTotal)} confirmed spend
            </p>
          )}
        </motion.div>

        {/* Filter chips */}
        <div className="filter-bar" style={{ marginBottom: "1.75rem" }} role="group" aria-label="Filter bookings by status">
          {(["ALL", ...STATUS_ORDER] as const).map((s) => {
            const count = s === "ALL" ? bookings.length : bookings.filter((b) => b.status === s).length;
            return (
              <button
                key={s}
                className={`chip-v2${filterStatus === s ? " chip-v2--active" : ""}`}
                onClick={() => setFilterStatus(s)}
                aria-pressed={filterStatus === s}
              >
                {s === "ALL" ? "All" : STATUS_LABELS[s]}
                <span className="chip-v2__count">{count}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid--list">
            {Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertTriangle className="error-state__icon" style={{ color: "var(--ev-warning)" }} />
            <div className="error-state__title">Couldn't load your bookings</div>
            <p className="error-state__desc">Please check your connection and try again.</p>
            <button className="btn btn--primary" onClick={() => void refetch()}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Ticket className="empty-state__icon" />
            <div className="empty-state__title">
              {bookings.length === 0 ? "Your season starts here" : "Nothing with this status"}
            </div>
            <p className="empty-state__desc">
              {bookings.length === 0
                ? "Book your first show and it will appear here, ticket and all."
                : "Try a different status filter."}
            </p>
            {bookings.length === 0 && <Link to="/shows" className="btn btn--primary btn-shine">Browse shows</Link>}
          </div>
        ) : (
          <div className="grid--list">
            <AnimatePresence mode="popLayout">
              {filtered.map((booking) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.28 }}
                >
                  <BookingCard booking={booking} onCancel={setCancelTarget} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Cancel dialog */}
        <ConfirmDialog
          open={cancelTarget !== null}
          title="Cancel this booking?"
          confirmLabel="Cancel booking"
          destructive
          pending={cancel.isPending}
          onConfirm={() => cancelTarget && cancel.mutate(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        >
          {cancelTarget && (
            <>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1rem" }}>
                <AlertTriangle size={20} style={{ color: "var(--ev-warning)", flexShrink: 0, marginTop: "0.125rem" }} aria-hidden="true" />
                <div>
                  You're about to cancel <strong>{cancelTarget.showTitle}</strong> on{" "}
                  {dateTime(cancelTarget.showDateTime)}. This can't be undone.
                </div>
              </div>
              <div style={{ background: "var(--ev-bg-raised)", borderRadius: "var(--ev-radius-control)", padding: "0.875rem 1rem", fontSize: "0.9rem", color: "var(--ev-text-muted)" }}>
                Refund of <strong>{money(cancelTarget.totalAmount)}</strong> would go back to your original payment method (simulated).
              </div>
            </>
          )}
        </ConfirmDialog>
      </div>
    </div>
  );
}
