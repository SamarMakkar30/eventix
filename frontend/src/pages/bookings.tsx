import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Ticket, CalendarDays, MapPin, X, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "../api/eventix";
import { money, dateTime } from "../lib/utils";
import { useToast } from "../context/toast-context";
import type { Booking } from "../types/api";

const STATUS_ORDER = ["CONFIRMED", "PENDING", "CANCELLED", "FAILED"] as const;
const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    CONFIRMED: "confirmed",
    PENDING: "pending",
    CANCELLED: "cancelled",
    FAILED: "failed",
  };
  return `status-badge status-badge--${map[s] ?? "pending"}`;
};

function CancelModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { show: toast } = useToast();
  const qc = useQueryClient();

  const cancel = useMutation({
    mutationFn: () => api.cancelBooking(booking.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      toast("success", "Booking cancelled", "Your cancellation has been processed.");
      onClose();
    },
    onError: () => toast("error", "Cancel failed", "Please try again."),
  });

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.22 }}
      >
        <div className="modal__header">
          <div className="modal__title">Cancel booking</div>
          <button className="modal__close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1rem" }}>
            <AlertTriangle size={20} style={{ color: "var(--ev-warning)", flexShrink: 0, marginTop: "0.125rem" }} />
            <div>
              You're about to cancel your booking for <strong>{booking.showTitle}</strong> on{" "}
              {dateTime(booking.showDateTime)}. This action cannot be undone.
            </div>
          </div>
          <div style={{ background: "var(--ev-bg-raised)", borderRadius: "var(--ev-radius-control)", padding: "0.875rem 1rem", fontSize: "0.9rem", color: "var(--ev-text-muted)" }}>
            Refund of <strong>{money(booking.totalAmount)}</strong> will be applied to your original payment method (simulated).
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Keep booking</button>
          <button
            className={`btn btn--destructive${cancel.isPending ? " btn--loading" : ""}`}
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
          >
            {cancel.isPending ? "" : "Cancel booking"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (b: Booking) => void }) {
  const canCancel = booking.status === "CONFIRMED" && new Date(booking.showDateTime) > new Date();

  return (
    <div className="booking-card">
      <div>
        <div className="booking-card__title">{booking.showTitle}</div>
        <div className="booking-card__meta">
          <span className="booking-card__meta-item">
            <CalendarDays size={13} />
            {dateTime(booking.showDateTime)}
          </span>
          <span className="booking-card__meta-item">
            <MapPin size={13} />
            {booking.venueName}
          </span>
          <span className="booking-card__meta-item">
            <Ticket size={13} />
            {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ marginTop: "0.625rem" }}>
          <span className={statusBadge(booking.status)}>{booking.status}</span>
        </div>
      </div>
      <div className="booking-card__side">
        <span className="booking-card__amount">{money(booking.totalAmount)}</span>
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
    <div style={{ background: "var(--ev-surface)", border: "1px solid var(--ev-border)", borderRadius: "var(--ev-radius-card)", padding: "1.25rem", display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="skeleton" style={{ height: "1.0625rem", width: "60%" }} />
        <div className="skeleton" style={{ height: "0.875rem", width: "80%" }} />
        <div className="skeleton" style={{ height: "0.875rem", width: "40%", marginTop: "0.25rem" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
        <div className="skeleton" style={{ height: "1rem", width: "60px" }} />
        <div className="skeleton" style={{ height: "2rem", width: "60px", borderRadius: "var(--ev-radius-control)" }} />
      </div>
    </div>
  );
}

export function BookingsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const { data: bookings = [], isLoading, error, refetch } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.bookings,
  });

  const filtered = filterStatus === "ALL"
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  const total = bookings.reduce((s, b) => s + (b.status === "CONFIRMED" ? b.totalAmount : 0), 0);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Account</p>
          <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "0.25rem" }}>
            My bookings
          </h1>
          {!isLoading && bookings.length > 0 && (
            <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
              {bookings.length} total · {money(total)} in confirmed bookings
            </p>
          )}
        </div>

        {/* Filter chips */}
        <div className="filter-bar" style={{ marginBottom: "1.5rem" }}>
          {(["ALL", ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              className={`filter-chip${filterStatus === s ? " filter-chip--active" : ""}`}
              onClick={() => setFilterStatus(s)}
              aria-pressed={filterStatus === s}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid--list">
            {Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="error-state">
            <RefreshCw className="error-state__icon" />
            <div className="error-state__title">Couldn't load bookings</div>
            <p className="error-state__desc">Please check your connection and try again.</p>
            <button className="btn btn--primary" onClick={() => void refetch()}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Ticket className="empty-state__icon" />
            <div className="empty-state__title">
              {bookings.length === 0 ? "No bookings yet" : "No bookings match this filter"}
            </div>
            <p className="empty-state__desc">
              {bookings.length === 0
                ? "When you book a show, it will appear here."
                : "Try selecting a different status filter."}
            </p>
            {bookings.length === 0 && (
              <Link to="/shows" className="btn btn--primary">Browse shows</Link>
            )}
          </div>
        ) : (
          <div className="grid--list">
            <AnimatePresence mode="popLayout">
              {filtered.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <BookingCard booking={booking} onCancel={setCancelTarget} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Cancel modal */}
        <AnimatePresence>
          {cancelTarget && (
            <CancelModal booking={cancelTarget} onClose={() => setCancelTarget(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
