import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import {
  CheckCircle2, Ticket, AlertTriangle, Download, CalendarPlus,
  ArrowRight, RefreshCw,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateTime } from "../lib/utils";
import { downloadCalendar, downloadTicket } from "../lib/ticket-files";
import type { ApiError } from "../api/client";
import type { Booking, BookingStatus } from "../types/api";

/* Audit fix: backend statuses are CONFIRMED | PENDING | PAYMENT_FAILED | CANCELLED.
   The old build treated PAYMENT_FAILED as a win — never again. */
const STATUS_MAP: Record<BookingStatus, { label: string; badge: string; tone: "good" | "bad" | "wait" }> = {
  CONFIRMED:     { label: "Confirmed",  badge: "status-badge--confirmed", tone: "good" },
  PENDING:       { label: "Pending",    badge: "status-badge--pending",   tone: "wait" },
  PAYMENT_FAILED:{ label: "Failed",     badge: "status-badge--payment_failed", tone: "bad" },
  FAILED:        { label: "Failed",     badge: "status-badge--payment_failed", tone: "bad" },
  CANCELLED:     { label: "Cancelled",  badge: "status-badge--cancelled", tone: "bad" },
};
const isGood = (s: BookingStatus) => STATUS_MAP[s].tone === "good";

const bookingRef = (id: number) => `EVX-${String(id).padStart(6, "0")}`;
export { bookingRef };

function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#C9A961", "#722F37", "#B23C4E", "#F5EDDC"];
  const burst = (x: number, angle: number, count: number) =>
    confetti({
      particleCount: count,
      angle,
      spread: 60,
      startVelocity: 42,
      origin: { x, y: 0.62 },
      colors,
      disableForReducedMotion: true,
      ticks: 220,
      gravity: 0.9,
      scalar: 0.9,
    });
  burst(0.18, 62, 55);
  burst(0.82, 118, 55);
  window.setTimeout(() => burst(0.5, 90, 40), 260);
}

export function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();

  const { data: booking, isLoading, error, refetch } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.booking(id!),
    enabled: !!id,
    retry: 2,
  });

  const success = booking ? isGood(booking.status) : false;

  /* Celebrate exactly once per confirmed arrival */
  useEffect(() => {
    if (booking && isGood(booking.status)) fireConfetti();
  }, [booking?.id, booking?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="page container" style={{ maxWidth: 560 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center" }}>
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%" }} />
          <div className="skeleton" style={{ height: "2.25rem", width: "55%" }} />
          <div className="skeleton skeleton--card" style={{ height: "320px", width: "100%" }} />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    /* A 404 means the link is wrong; anything else (network, 5xx) is a
       service problem — say so instead of blaming the link. */
    const isNotFound = (error as ApiError | null)?.status === 404;
    return (
      <div className="error-state page container">
        <Ticket className="error-state__icon" />
        <div className="error-state__title">{isNotFound ? "Booking not found" : "Couldn't load this booking"}</div>
        <p className="error-state__desc">
          {isNotFound
            ? "We couldn't find this booking — it may belong to another account, or the link is off by a digit."
            : "The booking service isn't responding right now. Your booking is safe — try again in a moment."}
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn--secondary" onClick={() => void refetch()}>
            <RefreshCw size={16} /> Try again
          </button>
          <Link to="/bookings" className="btn btn--primary">My bookings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 580 }}>
        {/* ── Verdict ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: "2.25rem" }}
        >
          {success ? (
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.12, duration: 0.55, type: "spring", stiffness: 260, damping: 16 }}
              style={{ color: "var(--ev-success)", marginBottom: "1.125rem", display: "flex", justifyContent: "center" }}
            >
              <CheckCircle2 size={60} strokeWidth={1.6} aria-hidden="true" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              style={{ color: booking.status === "CANCELLED" ? "var(--ev-text-subtle)" : "var(--ev-danger)", marginBottom: "1.125rem", display: "flex", justifyContent: "center" }}
            >
              <AlertTriangle size={54} strokeWidth={1.6} aria-hidden="true" />
            </motion.div>
          )}

          <h1 className="display" style={{ fontSize: "clamp(1.875rem, 4.5vw, 2.75rem)", lineHeight: 1.05, marginBottom: "0.625rem" }}>
            {success ? (
              <>You're going. <em>Enjoy.</em></>
            ) : booking.status === "PENDING" ? (
              <>Almost there — <em>payment pending.</em></>
            ) : booking.status === "CANCELLED" ? (
              <>Booking <em>cancelled.</em></>
            ) : (
              <>Payment didn't <em>go through.</em></>
            )}
          </h1>
          <p style={{ color: "var(--ev-text-muted)", lineHeight: 1.7, maxWidth: "42ch", margin: "0 auto" }}>
            {success
              ? "Your seats are locked in. The details below are your ticket — show the reference at the venue."
              : booking.status === "PENDING"
                ? "We're waiting on the final payment signal. This page updates itself — no action needed yet."
                : booking.status === "CANCELLED"
                  ? "This booking was cancelled and any hold on your seats has been released."
                  : "No charge was made. You can try booking again right away — seats may still be available."}
          </p>
        </motion.div>

        {/* ── Ticket ── */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <TicketV2 booking={booking} />
        </motion.div>

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}
        >
          {success && (
            <>
              <button className="btn btn--secondary" onClick={() => downloadTicket(booking)}>
                <Download size={16} aria-hidden="true" /> Ticket (.txt)
              </button>
              <button className="btn btn--secondary" onClick={() => downloadCalendar(booking)}>
                <CalendarPlus size={16} aria-hidden="true" /> Add to calendar (.ics)
              </button>
            </>
          )}
          <Link to="/bookings" className="btn btn--primary btn-shine">
            My bookings <ArrowRight size={16} aria-hidden="true" />
          </Link>
          {!success && <Link to="/shows" className="btn btn--primary btn-shine">Book again</Link>}
        </motion.div>
      </div>
    </div>
  );
}

/* ── Ticket stub ──────────────────────────────────────────────────────── */
function TicketV2({ booking }: { booking: Booking }) {
  const status = STATUS_MAP[booking.status];

  return (
    <div className="ticket-v2">
      <div className="ticket-v2__head">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ev-gold-bright)", marginBottom: "0.5rem" }}>
              Eventix · Admit {booking.quantity}
            </div>
            <div className="ticket-v2__title">{booking.showTitle}</div>
            <div style={{ fontSize: "0.875rem", marginTop: "0.375rem", color: "var(--ev-text-muted)" }}>
              {booking.venueName}
            </div>
          </div>
          <Ticket size={30} strokeWidth={1.4} style={{ opacity: 0.55, flexShrink: 0 }} aria-hidden="true" />
        </div>
        <div className="ticket-v2__stub-left" aria-hidden="true" />
        <div className="ticket-v2__stub-right" aria-hidden="true" />
      </div>

      <div className="ticket-v2__body">
        <div className="ticket-v2__grid">
          <div>
            <div className="ticket-v2__key">Date &amp; time</div>
            <div className="ticket-v2__val">{dateTime(booking.showDateTime)}</div>
          </div>
          <div>
            <div className="ticket-v2__key">Booking reference</div>
            <div className="ticket-v2__val ticket-v2__ref">{bookingRef(booking.id)}</div>
          </div>
          <div>
            <div className="ticket-v2__key">Tickets</div>
            <div className="ticket-v2__val">{booking.quantity} × {money(booking.pricePerTicket)}</div>
          </div>
          <div>
            <div className="ticket-v2__key">Total {isGood(booking.status) ? "paid" : "amount"}</div>
            <div className="ticket-v2__val">{money(booking.totalAmount)}</div>
          </div>
          <div>
            <div className="ticket-v2__key">Status</div>
            <div className="ticket-v2__val">
              <span className={`status-badge ${status.badge}`}>{status.label}</span>
            </div>
          </div>
          <div>
            <div className="ticket-v2__key">Booked on</div>
            <div className="ticket-v2__val">{dateTime(booking.createdAt)}</div>
          </div>
        </div>

        {isGood(booking.status) && (
          <div className="ticket-v2__barcode" aria-hidden="true" style={{ marginTop: "0.25rem" }} />
        )}
      </div>
    </div>
  );
}
