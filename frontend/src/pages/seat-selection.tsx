import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../api/eventix";
import { SeatSelector } from "../components/seat-selector";
import { Button, ErrorState, Skeleton } from "../components/ui";
import { useAuth } from "../context/auth-context";
import { saveBookingDraft } from "../lib/booking-draft";
import { dateTime, money } from "../lib/utils";

export function SeatSelectionPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const show = useQuery({
    queryKey: ["show", id],
    queryFn: () => api.show(id),
  });
  const inventory = useQuery({
    queryKey: ["inventory", id],
    queryFn: () => api.inventory(id),
  });
  if (show.isLoading || inventory.isLoading)
    return (
      <div className="page container">
        <Skeleton className="detail-loading-title" />
        <Skeleton className="seat-loading" />
      </div>
    );
  if (show.isError || inventory.isError || !show.data || !inventory.data)
    return (
      <div className="page container">
        <ErrorState
          title="Availability isn’t available"
          detail="We couldn’t retrieve the live ticket availability for this show."
          retry={() => {
            show.refetch();
            inventory.refetch();
          }}
        />
      </div>
    );
  if (inventory.data.availableSeats <= 0)
    return <Navigate to={`/shows/${id}`} replace />;
  const continueBooking = () => {
    saveBookingDraft({
      show: show.data,
      quantity,
      availableSeats: inventory.data!.availableSeats,
    });
    navigate(isAuthenticated ? "/checkout" : `/login?next=/shows/${id}/seats`);
  };
  return (
    <div className="page container booking-page">
      <motion.div
        className="booking-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Link className="breadcrumb" to={`/shows/${id}`}>
          Show details <span>/</span> Tickets
        </Link>
        <h1>Pick the perfect number.</h1>
        <p>
          <CalendarDays size={16} />
          {show.data.title} · {dateTime(show.data.showDateTime)} ·{" "}
          <MapPin size={16} />
          {show.data.venueName}
        </p>
      </motion.div>
      <div className="booking-grid">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <SeatSelector
            quantity={quantity}
            available={inventory.data.availableSeats}
            onChange={setQuantity}
          />
        </motion.div>
        <motion.aside
          className="order-summary"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="eyebrow">Your order</p>
          <h2>{show.data.title}</h2>
          <div className="summary-line">
            <span>Tickets × {quantity}</span>
            <strong>{money(show.data.price * quantity)}</strong>
          </div>
          <div className="summary-line">
            <span>Booking fee</span>
            <strong>₹0</strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(show.data.price * quantity)}</strong>
          </div>
          <Button onClick={continueBooking}>
            Continue to checkout <ArrowRight size={17} />
          </Button>
          <p className="secure-note">
            <ShieldCheck size={15} />
            Live availability is reconfirmed when you book.
          </p>
        </motion.aside>
      </div>
      <div className="mobile-booking-action">
        <div>
          <span>
            {quantity} {quantity === 1 ? "ticket" : "tickets"}
          </span>
          <strong>{money(show.data.price * quantity)}</strong>
        </div>
        <Button onClick={continueBooking}>
          Checkout <ArrowRight size={17} />
        </Button>
      </div>
    </div>
  );
}
