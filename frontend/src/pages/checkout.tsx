import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle, CalendarDays, MapPin, Ticket, CheckCircle2,
  ArrowRight, Lock, ShieldCheck, RefreshCw,
} from "lucide-react";
import { api } from "../api/eventix";
import { getBookingDraft, clearBookingDraft } from "../lib/booking-draft";
import { money, dateTime } from "../lib/utils";
import { useToast } from "../context/toast-context";
import type { ApiError } from "../api/client";

const STEPS = ["Review", "Payment"] as const;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState<0 | 1>(0);
  const [simFail, setSimFail] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const draft = getBookingDraft();
  const { show, quantity } = draft ?? { show: null, quantity: 0 };

  /* Audit fix: revalidate live inventory on entry — a draft can go stale
     while the user hesits, and selling seats that no longer exist is how
     trust dies. */
  const { data: inventory } = useQuery({
    queryKey: ["inventory", show?.id],
    queryFn: () => api.inventory(show!.id),
    enabled: !!show,
    refetchInterval: 15_000,
  });

  const available = inventory?.availableSeats;
  const clampedQuantity = quantity;
  const staleDraft =
    available !== undefined && show !== null && quantity > Math.min(10, available);

  useEffect(() => {
    if (staleDraft && available !== undefined && show) {
      toast("info", "Availability changed", `Only ${available} seats left — your order was trimmed to match.`);
      navigate(`/shows/${show.id}/seats`, { replace: true });
    }
  }, [staleDraft, available, show, navigate, toast]);

  const booking = useMutation({
    mutationFn: () =>
      api.createBooking(show!.id, clampedQuantity, simFail),
    onSuccess: (result) => {
      clearBookingDraft();
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      navigate(`/confirmation/${result.id}`, { replace: true });
    },
    onError: (err: unknown) => {
      const msg = (err as ApiError).message ?? "Payment failed. Please try again.";
      setInlineError(msg); /* inline + toast, so it can't be missed */
      toast("error", "Booking failed", msg);
    },
  });

  if (!draft || !show) {
    return (
      <div className="page container" style={{ maxWidth: 640, textAlign: "center" }}>
        <div className="empty-state">
          <Ticket className="empty-state__icon" />
          <div className="empty-state__title">No booking in progress</div>
          <p className="empty-state__desc">Pick a show and choose your tickets first — we'll keep everything ready here.</p>
          <Link to="/shows" className="btn btn--primary btn-shine">Browse shows</Link>
        </div>
      </div>
    );
  }

  const total = show.price * clampedQuantity;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="section-head__eyebrow">Almost there</p>
          <h1 className="display" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.05, margin: "0.5rem 0 1.75rem" }}>
            Secure <em>checkout</em>
          </h1>
        </motion.div>

        {/* Step indicator — exactly two real steps */}
        <div className="checkout-steps" role="list" aria-label="Checkout progress">
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: "contents" }} role="listitem">
              <div className={`checkout-step${i === step ? " checkout-step--active" : i < step ? " checkout-step--done" : ""}`} aria-current={i === step ? "step" : undefined}>
                <motion.div
                  className="checkout-step__num"
                  animate={i === step ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {i < step ? <CheckCircle2 size={14} aria-hidden="true" /> : i + 1}
                </motion.div>
                <span>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="checkout-step__connector" aria-hidden="true" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
            >
              <div className="card gold-top" style={{ padding: "1.5rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", fontFamily: "var(--ev-font-display)" }}>Your selection</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <div className="font-display" style={{ fontSize: "1.5rem", lineHeight: 1.1 }}>{show.title}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem", color: "var(--ev-text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CalendarDays size={15} aria-hidden="true" /> {dateTime(show.showDateTime)}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <MapPin size={15} aria-hidden="true" /> {show.venueName}
                    </span>
                    {available !== undefined && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--ev-success)" }}>
                        <ShieldCheck size={15} aria-hidden="true" /> {available} seats still available — you're good
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="order-summary">
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Order summary</div>
                <div className="order-summary__row">
                  <span className="order-summary__label">
                    {money(show.price)} × {clampedQuantity} ticket{clampedQuantity > 1 ? "s" : ""}
                  </span>
                  <span className="order-summary__value">{money(show.price * clampedQuantity)}</span>
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

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between", flexWrap: "wrap" }}>
                <Link to={`/shows/${show.id}/seats`} className="btn btn--secondary">Change tickets</Link>
                <button className="btn btn--primary btn-shine" onClick={() => setStep(1)}>
                  Continue to payment <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
            >
              <div className="sandbox-notice">
                <AlertTriangle size={18} aria-hidden="true" />
                <span><strong>Demo mode.</strong> No real payment is processed — any card below works.</span>
              </div>

              <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "var(--ev-font-display)" }}>Payment details</h2>

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

                <label className="checkbox" style={{ marginTop: "0.25rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={simFail}
                    onChange={(e) => { setSimFail(e.target.checked); setInlineError(null); }}
                    id="sim-fail"
                  />
                  <span className="checkbox-label" style={{ color: "var(--ev-text-muted)", fontSize: "0.875rem" }}>
                    Simulate payment failure (for testing)
                  </span>
                </label>
              </div>

              <div className="order-summary">
                <div className="order-summary__row order-summary__row--total" style={{ marginTop: 0, paddingTop: 0, border: "none", fontSize: "1.25rem" }}>
                  <span>Paying</span>
                  <span>{money(total)}</span>
                </div>
              </div>

              {/* Inline error — surfaced next to the button, not only in a corner toast */}
              {inlineError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  style={{
                    display: "flex", alignItems: "center", gap: "0.625rem",
                    padding: "0.875rem 1.125rem",
                    background: "color-mix(in srgb, var(--ev-danger) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--ev-danger) 35%, transparent)",
                    borderRadius: "var(--ev-radius-control)",
                    color: "var(--ev-danger)",
                    fontSize: "0.875rem",
                  }}
                >
                  <AlertTriangle size={16} aria-hidden="true" /> {inlineError}
                  <button className="btn btn--secondary btn--sm" style={{ marginLeft: "auto" }} onClick={() => booking.reset()}>
                    Dismiss
                  </button>
                </motion.div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between", flexWrap: "wrap" }}>
                <button className="btn btn--secondary" onClick={() => { setStep(0); setInlineError(null); }}>
                  ← Back to review
                </button>
                <button
                  className={`btn btn--primary btn--lg btn-shine${booking.isPending ? " btn--loading" : ""}`}
                  onClick={() => booking.mutate()}
                  disabled={booking.isPending}
                  id="confirm-payment-btn"
                >
                  {booking.isPending ? "" : <><Lock size={16} aria-hidden="true" /> Confirm &amp; pay {money(total)}</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust line */}
        <p className="kbd-hint" style={{ justifyContent: "center", marginTop: "2rem" }}>
          <RefreshCw size={12} aria-hidden="true" /> Payments are simulated — nothing is ever charged.
        </p>
      </div>
    </div>
  );
}
