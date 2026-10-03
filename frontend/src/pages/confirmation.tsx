import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckCircle2, Ticket } from "lucide-react";
import { api } from "../api/eventix";
import { money, dateTime } from "../lib/utils";
import type { Booking } from "../types/api";

export function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.booking(id!),
    enabled: !!id,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="page container" style={{ maxWidth: 560 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="skeleton" style={{ height: "3rem", width: "60%", borderRadius: "var(--ev-radius-control)" }} />
          <div className="skeleton skeleton--card" style={{ height: "320px" }} />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="error-state page container">
        <Ticket className="error-state__icon" />
        <div className="error-state__title">Booking not found</div>
        <p className="error-state__desc">We couldn't find this booking. Check your bookings page.</p>
        <Link to="/bookings" className="btn btn--primary">My Bookings</Link>
      </div>
    );
  }

  const isFailed = booking.status === "FAILED" || booking.status === "CANCELLED";

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 560 }}>
        {/* Success / fail header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: "2.5rem" }}
        >
          {isFailed ? (
            <div style={{ color: "var(--ev-danger)", marginBottom: "1rem" }}>
              <Ticket size={52} />
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.45, type: "spring", stiffness: 300 }}
              style={{ color: "var(--ev-success)", marginBottom: "1rem", display: "flex", justifyContent: "center" }}
            >
              <CheckCircle2 size={56} strokeWidth={1.75} />
            </motion.div>
          )}

          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "0.5rem" }}>
            {isFailed ? "Booking failed" : "You're going!"}
          </h1>
          <p style={{ color: "var(--ev-text-muted)", lineHeight: 1.65 }}>
            {isFailed
              ? "The payment could not be processed. No charge was made."
              : "Your booking is confirmed. Enjoy the experience!"}
          </p>
        </motion.div>

        {/* Ticket */}
        {!isFailed && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <TicketCard booking={booking} />
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}
        >
          <Link to="/bookings" className="btn btn--primary">
            <Ticket size={16} /> My Bookings
          </Link>
          <Link to="/shows" className="btn btn--secondary">
            Browse more shows
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function TicketCard({ booking }: { booking: Booking }) {
  const statusMap: Record<string, string> = {
    CONFIRMED: "confirmed",
    PENDING: "pending",
    CANCELLED: "cancelled",
    FAILED: "failed",
  };

  return (
    <div className="ticket">
      <div className="ticket__header">
        <div>
          <div className="ticket__title">{booking.showTitle}</div>
          <div style={{ opacity: 0.8, fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {booking.venueName}
          </div>
        </div>
        <Ticket size={28} strokeWidth={1.5} style={{ opacity: 0.7 }} />
      </div>

      <div className="ticket__body">
        <div className="ticket__row">
          <div>
            <div className="ticket__key">Date & time</div>
            <div className="ticket__val">{dateTime(booking.showDateTime)}</div>
          </div>
          <div>
            <div className="ticket__key">Venue</div>
            <div className="ticket__val">{booking.venueName}</div>
          </div>
        </div>

        <hr className="ticket__divider" />

        <div className="ticket__row">
          <div>
            <div className="ticket__key">Tickets</div>
            <div className="ticket__val">{booking.quantity} × {booking.type === "MOVIE" ? "Movie" : "Event"}</div>
          </div>
          <div>
            <div className="ticket__key">Total paid</div>
            <div className="ticket__val">{money(booking.totalAmount)}</div>
          </div>
        </div>

        <hr className="ticket__divider" />

        <div className="ticket__row">
          <div>
            <div className="ticket__key">Status</div>
            <div className="ticket__val">
              <span className={`status-badge status-badge--${statusMap[booking.status] ?? "pending"}`}>
                {booking.status}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="ticket__key">Booking ref</div>
            <div className="ticket__ref">#{String(booking.id).padStart(8, "0")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
