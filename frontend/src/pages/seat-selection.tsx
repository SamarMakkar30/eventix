import { useState } from "react";
import { useDocumentMeta } from "../lib/use-document-meta";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ChevronLeft, CalendarDays, MapPin, Users,
  ArrowRight, RefreshCw, AlertTriangle, Ticket, X,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateTime, posterFallback } from "../lib/utils";
import { saveBookingDraft } from "../lib/booking-draft";
import { ticketTotal } from "../lib/booking-math";
import SmartImage from "../components/smart-image";

export function SeatSelectionPage() {
  useDocumentMeta("Choose your seats — Eventix", "Pick exact seats on the interactive Eventix seat map.");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  /* Seats the customer clicked, by grid index — quantity is derived from
     this set, so live availability drops auto-remove newly booked seats. */
  const [picked, setPicked] = useState<Set<number>>(new Set());

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
  const bannerUrl =
    show.showType === "MOVIE"
      ? movies.find((m) => m.id === show.movieId)?.posterUrl
      : events.find((e) => e.id === show.eventId)?.bannerUrl;

  /* ── Interactive seat map ────────────────────────────────────────────
     Representative layout (the booking API takes a quantity; seat IDs are
     presentation until the backend grows a seat-level contract). Booked
     seats are a deterministic scatter seeded by show id, so the map looks
     like a real house instead of a filled rectangle. */
  const ROWS = 5;
  const COLS = 12;
  const bookedFraction = show.totalSeats > 0
    ? Math.min(1, Math.max(0, (show.totalSeats - available) / show.totalSeats))
    : 0;
  const hash = (n: number) => {
    let x = Math.sin(n * 12.9898 + show.id * 78.233) * 43758.5453;
    x -= Math.floor(x);
    return x;
  };
  const isBooked = (i: number) => hash(i + 1) < bookedFraction;
  /* Selection is always filtered against the current booked set — a live
     availability drop can't leave a booked seat in the customer's basket. */
  const selected = new Set(Array.from(picked).filter((i) => !isBooked(i)));
  const quantity = selected.size;
  const seatLabel = (r: number, c: number) => `${String.fromCharCode(65 + r)}${c + 1}`;
  const selectedLabels = Array.from(selected)
    .sort((a, b) => a - b)
    .map((i) => seatLabel(Math.floor(i / COLS), i % COLS));
  /* quantity 0 (nothing picked yet) is valid UI state — skip the 1..10 guard */
  const total = quantity >= 1 ? ticketTotal(show.price, quantity) : 0;

  function toggleSeat(i: number) {
    setPicked((prev) => {
      const next = new Set(Array.from(prev).filter((x) => !isBooked(x)));
      if (next.has(i)) {
        next.delete(i);
      } else if (next.size < maxQty) {
        next.add(i);
      }
      return next;
    });
  }

  function handleProceed() {
    if (!show || isPast || isSoldOut || available === undefined || quantity < 1) return;
    saveBookingDraft({
      show,
      quantity: Math.min(quantity, Math.min(10, available)),
      availableSeats: available,
      seats: selectedLabels,
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
            Click the seats you want on the map below — prices update as you pick.
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
              <div className="stage-v2" aria-hidden="true">Screen this way</div>
              <div className="seat-map" role="group" aria-label="Seat map — click seats to pick or release them">
                {Array.from({ length: ROWS }, (_, r) => {
                  const aisleAfter = Math.floor(COLS / 2) - 1;
                  return (
                    <div key={r} className="seat-row">
                      <span className="seat-row__label" aria-hidden="true">{String.fromCharCode(65 + r)}</span>
                      {Array.from({ length: COLS }, (_, c) => {
                        const i = r * COLS + c;
                        const booked = isBooked(i);
                        const isSelected = selected.has(i);
                        return (
                          <button
                            key={c}
                            type="button"
                            className={`seat-v2${booked ? " seat-v2--booked" : isSelected ? " seat-v2--selected" : ""}`}
                            onClick={() => toggleSeat(i)}
                            disabled={booked}
                            aria-pressed={isSelected}
                            aria-label={`Seat ${seatLabel(r, c)}${booked ? " — booked" : isSelected ? " — selected" : " — available"}`}
                            title={`${seatLabel(r, c)}${booked ? " · Booked" : isSelected ? " · Your pick" : " · Available"}`}
                          />
                        );
                      }).flatMap((el, c) => (
                        c === aisleAfter ? [el, <span key={`aisle-${c}`} className="seat-row__aisle" aria-hidden="true" />] : [el]
                      ))}
                      <span className="seat-row__label" aria-hidden="true">{String.fromCharCode(65 + r)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="seat-selection-bar" aria-live="polite">
                <span className="seat-selection-bar__count">
                  {quantity === 0 ? "No seats picked" : `${quantity} seat${quantity > 1 ? "s" : ""} picked`}
                  <span style={{ color: "var(--ev-text-subtle)", fontWeight: 500 }}> / up to {maxQty}</span>
                </span>
                {selectedLabels.length > 0 && (
                  <span className="seat-selection-bar__seats">{selectedLabels.join(" · ")}</span>
                )}
                {selectedLabels.length > 0 && (
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ marginLeft: "auto", padding: "0.25rem 0.625rem" }}
                    onClick={() => setPicked(new Set())}
                  >
                    <X size={13} aria-hidden="true" /> Clear
                  </button>
                )}
              </div>
              <div className="seat-legend" style={{ marginTop: "1.25rem", justifyContent: "center" }}>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-surface)", border: "1px solid var(--ev-border-strong)" }} />
                  Available — click to pick
                </div>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-accent)", boxShadow: "0 0 0 3px var(--ev-gold-wash)" }} />
                  Your pick — click to release
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
              className="card"
              style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <div style={{ fontWeight: 650 }}>How picking works</div>
              <p style={{ fontSize: "0.9rem", color: "var(--ev-text-muted)", lineHeight: 1.7 }}>
                Click any free seat on the map to add it — click again to release. We’ll
                hold up to <strong>{maxQty}</strong> seats per booking.
              </p>
              {available > 0 && available < 20 && (
                <div style={{ fontSize: "0.8125rem", color: "var(--ev-danger)", fontWeight: 600 }}>
                  Only {available} seats remaining — pick fast!
                </div>
              )}
              {available === 0 && (
                <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)" }}>
                  This show just sold out — try another date.
                </div>
              )}
              <p className="kbd-hint">Seats auto-release if availability changes while you pick.</p>
            </motion.div>

            <motion.div
              className="order-summary glass"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <div style={{ fontWeight: 700, fontSize: "1.0625rem", fontFamily: "var(--ev-font-display)" }}>Order summary</div>
              <div className="order-summary__row">
                <span className="order-summary__label">
                  {money(show.price)} × {quantity} ticket{quantity > 1 ? "s" : ""}
                  {selectedLabels.length > 0 && <> · seats {selectedLabels.join(", ")}</>}
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
                  disabled={quantity < 1}
                >
                  {quantity < 1
                    ? "Pick your seats to continue"
                    : <>Continue to checkout <ArrowRight size={17} aria-hidden="true" /></>}
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
