import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ChevronLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { api } from "../api/eventix";
import { money, dateTime } from "../lib/utils";
import { saveBookingDraft } from "../lib/booking-draft";

const FALLBACKS = ["ember", "sand", "dusk", "pine", "slate", "ochre"] as const;

export function SeatSelectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ["show", id],
    queryFn: () => api.show(id!),
    enabled: !!id,
  });

  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ["inventory", id],
    queryFn: () => api.inventory(id!),
    enabled: !!id,
    refetchInterval: 20_000,
  });

  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });

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

  if (!show || !inventory) {
    return (
      <div className="error-state page container">
        <div className="error-state__title">Show not found</div>
        <Link to="/shows" className="btn btn--primary">Browse shows</Link>
      </div>
    );
  }

  const available = inventory.availableSeats;
  const maxQty = Math.min(10, available);
  const isPast = new Date(show.showDateTime) < new Date();
  const isSoldOut = available === 0;

  const bannerUrl =
    show.showType === "MOVIE"
      ? movies.find((m) => m.id === show.movieId)?.posterUrl
      : events.find((e) => e.id === show.eventId)?.bannerUrl;
  const fb = FALLBACKS[show.id % FALLBACKS.length]!;

  // Visualised seat grid (representative, not real seat IDs)
  const totalVisual = Math.min(show.totalSeats, 60);
  const bookedCount = show.totalSeats - available;
  const seats = Array.from({ length: totalVisual }, (_, i) => ({
    idx: i,
    booked: i < Math.min(bookedCount, totalVisual),
    selected: i >= Math.min(bookedCount, totalVisual) && i < Math.min(bookedCount + quantity, totalVisual),
  }));

  function handleProceed() {
    if (!show || isPast || isSoldOut) return;
    saveBookingDraft({ show, quantity, availableSeats: available });
    navigate("/checkout");
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* Back */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to={`/shows/${show.id}`} className="btn btn--ghost btn--sm" style={{ paddingLeft: "0.25rem", gap: "0.25rem" }}>
            <ChevronLeft size={16} /> {show.title}
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          {/* Show info card */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", minHeight: "90px" }}>
              <div className={`artwork--${fb}`} style={{ height: "100%" }}>
                {bannerUrl && <img src={bannerUrl} alt={show.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ padding: "1.25rem" }}>
                <h1 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>{show.title}</h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem 1.25rem", fontSize: "0.875rem", color: "var(--ev-text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <CalendarDays size={14} /> {dateTime(show.showDateTime)}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <MapPin size={14} /> {show.venueName}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Users size={14} /> {available} seats left
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seat visualiser */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="seat-section">
              <div className="stage-bar">stage / screen</div>
              <div className="seat-grid" aria-label="Seat map (representative)">
                {seats.map(({ idx, booked, selected }) => (
                  <div
                    key={idx}
                    className={`seat${booked ? " seat--unavailable" : selected ? " seat--selected" : ""}`}
                    title={booked ? "Booked" : selected ? "Selected" : "Available"}
                    aria-label={booked ? "Booked seat" : selected ? "Selected seat" : "Available seat"}
                  />
                ))}
              </div>
              <div className="seat-legend">
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-surface)", border: "1px solid var(--ev-border)" }} />
                  Available
                </div>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-accent)" }} />
                  Your selection
                </div>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-bg-raised)", opacity: 0.4 }} />
                  Booked
                </div>
              </div>
            </div>
          </div>

          {/* Quantity + summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }} className="responsive-2col">
            {/* Quantity stepper */}
            <div className="quantity-stepper">
              <div>
                <div className="quantity-stepper__label">Number of tickets</div>
                {available < 20 && available > 0 && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--ev-danger)", marginTop: "0.25rem" }}>
                    Only {available} seats remaining!
                  </div>
                )}
              </div>
              <div className="quantity-stepper__controls">
                <button
                  className="btn btn--secondary btn--icon btn--sm"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="quantity-stepper__count" aria-live="polite" aria-label={`${quantity} tickets selected`}>
                  {quantity}
                </span>
                <button
                  className="btn btn--secondary btn--icon btn--sm"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Order summary */}
            <div className="order-summary">
              <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>Order summary</div>
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
                <span>{money(show.price * quantity)}</span>
              </div>

              {isPast ? (
                <div className="empty-state" style={{ padding: "1rem 0" }}>
                  <div className="empty-state__title" style={{ fontSize: "1rem" }}>Show ended</div>
                </div>
              ) : isSoldOut ? (
                <div className="empty-state" style={{ padding: "1rem 0" }}>
                  <div className="empty-state__title" style={{ fontSize: "1rem" }}>Sold out</div>
                </div>
              ) : (
                <button
                  className="btn btn--primary"
                  style={{ width: "100%" }}
                  onClick={handleProceed}
                >
                  Proceed to checkout →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
