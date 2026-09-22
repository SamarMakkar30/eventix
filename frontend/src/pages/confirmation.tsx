import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Download,
  MapPin,
  Ticket,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../api/eventix";
import { ErrorState, Skeleton, StatusBadge } from "../components/ui";
import { dateTime, money } from "../lib/utils";

const particles = Array.from({ length: 14 }, (_, index) => index);

export function ConfirmationPage() {
  const { id = "" } = useParams();
  const booking = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.booking(id),
  });

  if (booking.isLoading)
    return (
      <div className="page container">
        <Skeleton className="confirmation-loading" />
      </div>
    );

  if (booking.isError || !booking.data)
    return (
      <div className="page container">
        <ErrorState
          title="We couldn't open this booking"
          detail="Try My Bookings to find your ticket."
        />
      </div>
    );

  const data = booking.data;

  return (
    <div className="page container confirmation-page">
      {/* Success orb */}
      <motion.div
        className="success-orb"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 180, delay: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 14, delay: 0.35 }}
        >
          <Check />
        </motion.div>
        {particles.map((particle) => (
          <span className="confetti-particle" key={particle} />
        ))}
      </motion.div>

      <motion.p
        className="eyebrow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Booking confirmed
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        Your night is <em>locked in.</em>
      </motion.h1>

      <motion.p
        className="confirmation-lead"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        A confirmation has been created for {data.showTitle}. We'll keep your
        plans ready in My Bookings.
      </motion.p>

      {/* Ticket card */}
      <motion.section
        className="ticket-card"
        initial={{ opacity: 0, y: 40, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 160, delay: 0.75 }}
      >
        <div className="ticket-card__main">
          <div className="ticket-label">
            <Ticket /> EVENTIX TICKET
          </div>
          <h2>{data.showTitle}</h2>
          <div className="ticket-details">
            <span>
              <CalendarDays />
              {dateTime(data.showDateTime)}
            </span>
            <span>
              <MapPin />
              {data.venueName}
            </span>
            <span>
              <UserRound />
              {data.quantity} {data.quantity === 1 ? "guest" : "guests"}
            </span>
          </div>
        </div>
        <div className="ticket-card__stub">
          <span>Booking reference</span>
          <strong>EVX-{String(data.id).padStart(6, "0")}</strong>
          <StatusBadge status={data.status} />
          <div>
            <span>Amount paid</span>
            <strong>{money(data.totalAmount)}</strong>
          </div>
        </div>
      </motion.section>

      <motion.div
        className="confirmation-actions"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.45 }}
      >
        <Link className="button" to="/bookings">
          View my bookings
        </Link>
        <Link className="button button--ghost" to="/">
          Back to home
        </Link>
      </motion.div>

      <motion.p
        className="confirmation-note"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Download size={16} />
        Your booking details stay safely in your account—no download needed.
      </motion.p>
    </div>
  );
}
