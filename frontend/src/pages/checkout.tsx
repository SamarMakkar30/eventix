import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CalendarDays, MapPin, Ticket, CheckCircle2 } from "lucide-react";
import { api } from "../api/eventix";
import { getBookingDraft, clearBookingDraft } from "../lib/booking-draft";
import { money, dateTime } from "../lib/utils";
import { useToast } from "../context/toast-context";
import type { ApiError } from "../api/client";

const STEPS = ["Review", "Payment", "Confirm"] as const;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState<0 | 1>(0);
  const [simFail, setSimFail] = useState(false);

  const draft = getBookingDraft();

  const booking = useMutation({
    mutationFn: () =>
      api.createBooking(draft!.show.id, draft!.quantity, simFail),
    onSuccess: (result) => {
      clearBookingDraft();
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      navigate(`/confirmation/${result.id}`, { replace: true });
    },
    onError: (err: unknown) => {
      const msg = (err as ApiError).message ?? "Payment failed. Please try again.";
      toast("error", "Booking failed", msg);
    },
  });

  if (!draft) {
    return (
      <div className="page container" style={{ maxWidth: 640, textAlign: "center" }}>
        <div className="empty-state">
          <Ticket className="empty-state__icon" />
          <div className="empty-state__title">No booking in progress</div>
          <p className="empty-state__desc">Select a show and choose your tickets first.</p>
          <Link to="/shows" className="btn btn--primary">Browse shows</Link>
        </div>
      </div>
    );
  }

  const { show, quantity } = draft;
  const total = show.price * quantity;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "2rem" }}>
          Checkout
        </h1>

        {/* Steps */}
        <div className="checkout-steps">
          {STEPS.map((label, i) => (
            <>
              <div key={label} className={`checkout-step${i === step ? " checkout-step--active" : i < step ? " checkout-step--done" : ""}`}>
                <div className="checkout-step__num">
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div key={`conn-${i}`} className="checkout-step__connector" />}
            </>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
            >
              {/* Show card */}
              <div className="card" style={{ padding: "1.5rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Your selection</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>{show.title}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.9rem", color: "var(--ev-text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CalendarDays size={15} /> {dateTime(show.showDateTime)}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <MapPin size={15} /> {show.venueName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="order-summary">
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Order summary</div>
                <div className="order-summary__row">
                  <span className="order-summary__label">
                    {money(show.price)} × {quantity} ticket{quantity > 1 ? "s" : ""}
                  </span>
                  <span className="order-summary__value">{money(show.price * quantity)}</span>
                </div>
                <div className="order-summary__row">
                  <span className="order-summary__label">Convenience fee</span>
                  <span className="order-summary__value" style={{ color: "var(--ev-success)" }}>Free</span>
                </div>
                <div className="order-summary__row order-summary__row--total">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <Link to={`/shows/${show.id}/seats`} className="btn btn--secondary">
                  Change seats
                </Link>
                <button className="btn btn--primary" onClick={() => setStep(1)}>
                  Continue to payment →
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
            >
              {/* Sandbox notice */}
              <div className="sandbox-notice">
                <AlertTriangle size={18} />
                <span>
                  <strong>Demo mode.</strong> No real payment is processed. Use any details below.
                </span>
              </div>

              {/* Fake payment form */}
              <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Payment details</h2>

                <div className="field">
                  <label className="field-label" htmlFor="card-number">Card number</label>
                  <input id="card-number" className="input" defaultValue="4111 1111 1111 1111" readOnly />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="field">
                    <label className="field-label" htmlFor="card-expiry">Expiry</label>
                    <input id="card-expiry" className="input" defaultValue="12 / 27" readOnly />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="card-cvv">CVV</label>
                    <input id="card-cvv" className="input" defaultValue="123" readOnly />
                  </div>
                </div>

                {/* Failure simulation toggle */}
                <label className="checkbox" style={{ marginTop: "0.25rem" }}>
                  <input
                    type="checkbox"
                    checked={simFail}
                    onChange={(e) => setSimFail(e.target.checked)}
                    id="sim-fail"
                  />
                  <span className="checkbox-label" style={{ color: "var(--ev-text-muted)", fontSize: "0.875rem" }}>
                    Simulate payment failure (for testing)
                  </span>
                </label>
              </div>

              {/* Total recap */}
              <div className="order-summary">
                <div className="order-summary__row order-summary__row--total" style={{ marginTop: 0, paddingTop: 0, border: "none", fontSize: "1.25rem" }}>
                  <span>Paying</span>
                  <span>{money(total)}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="btn btn--secondary" onClick={() => setStep(0)}>
                  ← Back
                </button>
                <button
                  className={`btn btn--primary${booking.isPending ? " btn--loading" : ""}`}
                  onClick={() => booking.mutate()}
                  disabled={booking.isPending}
                  id="confirm-payment-btn"
                >
                  {booking.isPending ? "" : `Confirm & pay ${money(total)}`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
