import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, MapPin, TicketX } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../api/eventix";
import {
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
} from "../components/ui";
import { useToast } from "../context/toast-context";
import { dateTime, money } from "../lib/utils";

const cardVariants = {
  hidden: { opacity: 0, x: -28 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export function BookingsPage() {
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: api.bookings });
  const client = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState<number | null>(null);
  const cancel = useMutation({
    mutationFn: api.cancelBooking,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["bookings"] });
      toast.show("success", "Booking cancelled", "Your ticket availability has been released.");
      setConfirming(null);
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn't cancel booking", error.message),
  });

  return (
    <div className="page container">
      <motion.div
        className="page-intro compact"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="eyebrow">Your plans</p>
        <h1>My bookings.</h1>
        <p>Every upcoming escape, neatly in one place.</p>
      </motion.div>

      {bookings.isError ? (
        <ErrorState
          detail="We couldn't get your bookings right now."
          retry={() => bookings.refetch()}
        />
      ) : bookings.isLoading ? (
        <div className="booking-list">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="booking-skeleton" />
          ))}
        </div>
      ) : bookings.data?.length ? (
        <div className="booking-list">
          {bookings.data
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            .map((booking, index) => (
              <motion.article
                className="booking-card"
                key={booking.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
              >
                <div className="booking-card__number">
                  EVX
                  <br />
                  {String(booking.id).padStart(4, "0")}
                </div>
                <div className="booking-card__body">
                  <div className="booking-card__title">
                    <div>
                      <h2>{booking.showTitle}</h2>
                      <p>
                        <CalendarDays size={15} />
                        {dateTime(booking.showDateTime)} <span>·</span>{" "}
                        <MapPin size={15} />
                        {booking.venueName}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="booking-card__meta">
                    <span>
                      {booking.quantity}{" "}
                      {booking.quantity === 1 ? "ticket" : "tickets"}
                    </span>
                    <strong>{money(booking.totalAmount)}</strong>
                  </div>
                </div>
                <div className="booking-card__action">
                  <AnimatePresence mode="wait">
                    {booking.status === "CONFIRMED" &&
                      (confirming === booking.id ? (
                        <motion.div
                          key="confirm"
                          className="cancel-confirm"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span>Cancel this booking?</span>
                          <Button
                            className="button--danger button--small"
                            loading={cancel.isPending}
                            onClick={() => cancel.mutate(booking.id)}
                          >
                            Yes, cancel
                          </Button>
                          <button onClick={() => setConfirming(null)}>
                            Keep it
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="cancel-btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Button
                            className="button--ghost button--small"
                            onClick={() => setConfirming(booking.id)}
                          >
                            <TicketX size={16} />
                            Cancel
                          </Button>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                  <Link
                    aria-label={`View booking ${booking.id}`}
                    to={`/confirmation/${booking.id}`}
                  >
                    <ChevronRight />
                  </Link>
                </div>
              </motion.article>
            ))}
        </div>
      ) : (
        <EmptyState
          title="Your calendar is wide open"
          detail="Find a film or live moment that feels worth the trip."
          action={
            <Link className="button" to="/shows">
              Explore shows
            </Link>
          }
        />
      )}
    </div>
  );
}
