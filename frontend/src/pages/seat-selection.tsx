import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Minus, Plus, ChevronLeft, CalendarDays, MapPin, Users,
  ArrowRight, RefreshCw, AlertTriangle, Ticket,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateTime, posterFallback } from "../lib/utils";
import { saveBookingDraft } from "../lib/booking-draft";
import { ticketTotal } from "../lib/booking-math";
import SmartImage from "../components/smart-image";

export function SeatSelectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  /* Raw selection; the effective quantity is derived against live inventory,
     so a mid-flight availability drop clamps it automatically (audit fix). */
  const [rawQuantity, setRawQuantity] = useState(1);

  const {
    data: show,
    isLoading: showLoading,
    isError: showError,
    refetch,
  } = useQuery({
    queryKey: ["show", id],
    queryFn: () => api.show(id!),
    enabled: !!id,
  });

  const {
    data: inventory,
    isLoading: invLoading,
    isError: inventoryError,
    refetch: invRefetch,
  } = useQuery({
    queryKey: ["inventory", id],
    queryFn: () => api.inventory(id!),
    enabled: !!id,
    refetchInterval: 20_000,
  });

  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });

  const available = inventory?.availableSeats;
  const maxQty = available !== undefined ? Math.max(1, Math.min(10, available)) : 10;
  const quantity = Math.min(rawQuantity, maxQty);

  if (showLoading || invLoading) {
    return (
      <div className="page container">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 680 }}>
          <div className="skeleton" style={{ height: "2rem", width: "50%" }} />
          <div className="skeleton skeleton--card" style={{ height: "200px" }} />
          <div className="skeleton skeleton--card" style={{ height: "160px" }} />
        </div>
      </div>
    );
  }

  if (showError) {
    return (
      <div className="error-state page container">
        <AlertTriangle className="error-state__icon" style={{ color: "var(--ev-warning)" }} />
        <div className="error-state__title">Couldn't load this show</div>
        <p className="error-state__desc">We couldn't reach the box office. Please try again.</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn--secondary" onClick={() => void refetch()}>
            <RefreshCw size={16} /> Try again
          </button>
          <Link to="/shows" className="btn btn--primary">Browse shows</Link>
        </div>
      </div>
    );
  }

  /* The show exists but the inventory service has no record for it —
     a real state the backend can produce. Never render a blank page. */
  if (show && inventoryError) {
    return (
      <div className="error-state page container">
        <AlertTriangle className="error-state__icon" style={{ color: "var(--ev-warning)" }} />
        <div className="error-state__title">Availability unavailable</div>
        <p className="error-state__desc">
          &ldquo;{show.title}&rdquo; has no seat inventory registered yet, so it can't be booked right now.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn--secondary" onClick={() => void invRefetch()}>
            <RefreshCw size={16} /> Try again
          </button>
          <Link to={`/shows/${show.id}`} className="btn btn--primary">Back to show</Link>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="error-state page container">
        <Ticket className="error-state__icon" />
        <div className="error-state__title">Show not found</div>
        <p className="error-state__desc">This show may have ended its run.</p>
        <Link to="/shows" className="btn btn--primary">Browse shows</Link>
      </div>
    );
  }

  if (available === undefined) return null;

  const isPast = new Date(show.showDateTime) < new Date();
  const isSoldOut = available === 0;
  const total = ticketTotal(show.price, quantity);

  const bannerUrl =
    show.showType === "MOVIE"
      ? movies.find((m) => m.id === show.movieId)?.posterUrl
      : events.find((e) => e.id === show.eventId)?.bannerUrl;

  /* Representative seat map (visual aid — the backend holds the real seats) */
  const ROWS = 5;
  const COLS = 12;
  const totalVisual = ROWS * COLS;
  const bookedCount = show.totalSeats > 0
    ? Math.min(totalVisual, Math.round(((show.totalSeats - available) / show.totalSeats) * totalVisual))
    : 0;
  const seatState = (i: number) => {
    if (i < bookedCount) return "booked" as const;
    const freeIndex = i - bookedCount;
    if (freeIndex < quantity) return "selected" as const;
    return "free" as const;
  };

  function handleProceed() {
    if (!show || isPast || isSoldOut || available === undefined) return;
    saveBookingDraft({
      show,
      quantity: Math.min(quantity, Math.min(10, available)),
      availableSeats: available,
    });
    navigate("/checkout");
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "900px" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to={`/shows/${show.id}`} className="btn btn--ghost btn--sm" style={{ paddingLeft: "0.25rem" }}>
            <ChevronLeft size={16} aria-hidden="true" /> {show.title}
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="display" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: 1.05, marginBottom: "0.375rem" }}>
            Choose your <em>seats</em>
          </h1>
          <p className="text-muted" style={{ marginBottom: "2rem" }}>
            Pick how many tickets you need — we'll hold the best available seats together.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          {/* Show info strip */}
          <motion.div
            className="card gold-top"
            style={{ padding: 0, overflow: "hidden" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", minHeight: "96px" }}>
              <div style={{ position: "relative", background: posterFallback(show.id) }}>
                <SmartImage
                  src={bannerUrl}
                  alt=""
                  fallback={null}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "1.25rem 1.375rem" }}>
                <h2 className="font-display" style={{ fontSize: "1.375rem", marginBottom: "0.5rem" }}>{show.title}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem 1.25rem", fontSize: "0.875rem", color: "var(--ev-text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <CalendarDays size={14} aria-hidden="true" /> {dateTime(show.showDateTime)}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <MapPin size={14} aria-hidden="true" /> {show.venueName}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Users size={14} aria-hidden="true" /> {available.toLocaleString("en-IN")} seats left
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Seat visualiser */}
          <motion.div
            className="card"
            style={{ padding: "1.75rem 1.5rem" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className="seat-section">
              <div className="stage-v2">Screen this way</div>
              <div className="seat-map" role="img" aria-label={`Representative seat map: ${bookedCount} of ${totalVisual} shown seats booked, ${quantity} selected`}>
                {Array.from({ length: ROWS }, (_, r) => (
                  <div key={r} className="seat-row" aria-hidden="true">
                    {Array.from({ length: COLS }, (_, c) => {
                      const i = r * COLS + c;
                      const state = seatState(i);
                      return (
                        <div
                          key={c}
                          className={`seat-v2${state === "booked" ? " seat-v2--booked" : state === "selected" ? " seat-v2--selected" : ""}`}
                          style={{ transitionDelay: `${(i % COLS) * 8}ms`, marginRight: c === Math.floor(COLS / 2) - 1 ? "1.25rem" : undefined }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="seat-legend" style={{ marginTop: "1.25rem", justifyContent: "center" }}>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-surface)", border: "1px solid var(--ev-border-strong)" }} />
                  Free
                </div>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-accent)", boxShadow: "0 0 0 3px var(--ev-gold-wash)" }} />
                  Your pick
                </div>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-bg-raised)", opacity: 0.4 }} />
                  Booked
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quantity + summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", alignItems: "start" }} className="responsive-2col-lg">
            <motion.div
              className="quantity-stepper"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <div>
                <div className="quantity-stepper__label">Number of tickets</div>
                {available > 0 && available < 20 && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--ev-danger)", marginTop: "0.25rem", fontWeight: 600 }}>
                    Only {available} seats remaining!
                  </div>
                )}
                {available === 0 && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", marginTop: "0.25rem" }}>
                    This show just sold out — try another date.
                  </div>
                )}
              </div>
              <div className="quantity-stepper__controls">
                <motion.button
                  className="btn btn--secondary btn--icon btn--sm"
                  onClick={() => setRawQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  whileTap={{ scale: 0.88 }}
                >
                  <Minus size={16} aria-hidden="true" />
                </motion.button>
                <motion.span
                  key={quantity}
                  className="quantity-stepper__count"
                  aria-live="polite"
                  aria-label={`${quantity} tickets selected`}
                  initial={{ scale: 1.25, color: "var(--ev-gold)" }}
                  animate={{ scale: 1, color: "var(--ev-text)" }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "inline-block" }}
                >
                  {quantity}
                </motion.span>
                <motion.button
                  className="btn btn--secondary btn--icon btn--sm"
                  onClick={() => setRawQuantity((q) => q + 1)}
                  disabled={quantity >= maxQty}
                  aria-label="Increase quantity"
                  whileTap={{ scale: 0.88 }}
                >
                  <Plus size={16} aria-hidden="true" />
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              className="order-summary glass"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <div style={{ fontWeight: 700, fontSize: "1.0625rem", fontFamily: "var(--ev-font-display)" }}>Order summary</div>
              <div className="order-summary__row">
                <span className="order-summary__label">{money(show.price)} × {quantity} ticket{quantity > 1 ? "s" : ""}</span>
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

              {isPast ? (
                <div className="empty-state" style={{ padding: "1rem 0" }}>
                  <div className="empty-state__title" style={{ fontSize: "1rem" }}>This show has ended</div>
                </div>
              ) : isSoldOut ? (
                <div className="empty-state" style={{ padding: "1rem 0" }}>
                  <div className="empty-state__title" style={{ fontSize: "1rem" }}>Sold out</div>
                  <Link to="/shows" className="btn btn--secondary btn--sm">Find another show</Link>
                </div>
              ) : (
                <button
                  className="btn btn--primary btn--lg btn-shine"
                  style={{ width: "100%" }}
                  onClick={handleProceed}
                >
                  Continue to checkout <ArrowRight size={17} aria-hidden="true" />
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
