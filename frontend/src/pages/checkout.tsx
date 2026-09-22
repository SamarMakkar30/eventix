import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../api/eventix";
import { Button } from "../components/ui";
import { useToast } from "../context/toast-context";
import { clearBookingDraft, getBookingDraft } from "../lib/booking-draft";
import { dateTime, money } from "../lib/utils";

export function CheckoutPage() {
  const draft = getBookingDraft();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const booking = useMutation({
    mutationFn: () => api.createBooking(draft!.show.id, draft!.quantity),
    onSuccess: (result) => {
      clearBookingDraft();
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", String(result.showId)] });
      navigate(`/confirmation/${result.id}`, { replace: true });
    },
    onError: (error: Error) =>
      toast.show("error", "We couldn't confirm your booking", error.message),
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  if (!draft) return <Navigate to="/shows" replace />;

  return (
    <div className="page container checkout-page">
      <motion.div
        className="checkout-heading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="eyebrow">Final step</p>
        <h1>Make it official.</h1>
        <p>A simple, secure confirmation for your Eventix booking.</p>
      </motion.div>

      <div className="checkout-grid">
        <motion.section
          className="checkout-card"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="checkout-card__top">
            <div className="checkout-step">1</div>
            <div>
              <h2>Review your night</h2>
              <p>
                {draft.show.showType === "MOVIE"
                  ? "Cinema experience"
                  : "Live experience"}
              </p>
            </div>
          </div>
          <div className="checkout-show">
            <div>
              <strong>{draft.show.title}</strong>
              <span>
                <CalendarDays size={15} />
                {dateTime(draft.show.showDateTime)}
              </span>
              <span>
                <MapPin size={15} />
                {draft.show.venueName}
              </span>
            </div>
            <ChevronRight />
          </div>
          <motion.div
            className="checkout-card__top payment-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="checkout-step">2</div>
            <div>
              <h2>Demo payment</h2>
              <p>This demo uses the backend's simulated payment service.</p>
            </div>
          </motion.div>
          <motion.div
            className="payment-note"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <CreditCard />
            <div>
              <strong>No card details required</strong>
              <p>
                Click Confirm booking to safely complete a demo transaction. No
                sensitive payment data is collected.
              </p>
            </div>
          </motion.div>
        </motion.section>

        <motion.aside
          className="order-summary"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="eyebrow">Order summary</p>
          <div className="summary-line">
            <span>Tickets × {draft.quantity}</span>
            <strong>{money(draft.show.price * draft.quantity)}</strong>
          </div>
          <div className="summary-line">
            <span>Booking fee</span>
            <strong>₹0</strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(draft.show.price * draft.quantity)}</strong>
          </div>
          <Button loading={booking.isPending} onClick={() => booking.mutate()}>
            <LockKeyhole size={16} />
            Confirm booking
          </Button>
          <p className="secure-note">
            <ShieldCheck size={15} />
            Availability is checked at confirmation.
          </p>
          <Link className="back-link" to={`/shows/${draft.show.id}/seats`}>
            Adjust ticket quantity
          </Link>
        </motion.aside>
      </div>
    </div>
  );
}
