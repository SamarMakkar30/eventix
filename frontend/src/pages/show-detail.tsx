import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  CalendarDays, MapPin, Clock, Users, Star, Film, Zap,
  ArrowRight, Ticket, ChevronLeft,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateTime, dateOnly } from "../lib/utils";
import { useAuth } from "../context/auth-context";

const FALLBACKS = ["ember", "sand", "dusk", "pine", "slate", "ochre"] as const;

export function ShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: show, isLoading: showLoading, error: showError } = useQuery({
    queryKey: ["show", id],
    queryFn: () => api.show(id!),
    enabled: !!id,
  });

  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ["inventory", id],
    queryFn: () => api.inventory(id!),
    enabled: !!id,
    refetchInterval: 30_000,
  });

  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });

  if (showLoading) return <DetailSkeleton />;

  if (showError || !show) {
    return (
      <div className="error-state page container">
        <Ticket className="error-state__icon" />
        <div className="error-state__title">Show not found</div>
        <p className="error-state__desc">This show may have been removed or doesn't exist.</p>
        <Link to="/shows" className="btn btn--primary">Browse shows</Link>
      </div>
    );
  }

  const movie   = show.showType === "MOVIE" ? movies.find((m) => m.id === show.movieId) : null;
  const event   = show.showType === "EVENT" ? events.find((e) => e.id === show.eventId) : null;
  const bannerUrl = movie?.posterUrl ?? event?.bannerUrl ?? null;
  const fb = FALLBACKS[show.id % FALLBACKS.length]!;
  const available = inventory?.availableSeats;
  const isPast = new Date(show.showDateTime) < new Date();
  const isSoldOut = available !== undefined && available === 0;

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate(`/login?next=/shows/${show.id}/seats`);
    } else {
      navigate(`/shows/${show.id}/seats`);
    }
  };

  return (
    <>
      {/* Hero */}
      <div className="show-hero">
        {bannerUrl
          ? <img src={bannerUrl} alt={show.title} />
          : <div className={`artwork--${fb}`} style={{ width: "100%", height: "100%" }} />}
        <div className="show-hero__overlay" />
        <motion.div
          className="show-hero__content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="show-hero__eyebrow">
            {show.showType === "MOVIE" ? "Movie" : (event?.category ?? "Event")}
            {movie?.language && ` · ${movie.language}`}
          </div>
          <h1 className="show-hero__title">{show.title}</h1>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.9375rem", opacity: 0.85 }}>
              <CalendarDays size={15} /> {dateOnly(show.showDateTime)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.9375rem", opacity: 0.85 }}>
              <MapPin size={15} /> {show.venueName}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="container">
        {/* Back */}
        <div style={{ padding: "1.25rem 0 0" }}>
          <Link to="/shows" className="btn btn--ghost btn--sm" style={{ paddingLeft: "0.25rem", gap: "0.25rem" }}>
            <ChevronLeft size={16} /> All shows
          </Link>
        </div>

        <div className="show-layout">
          {/* Left — details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Meta grid */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <div className="show-meta-grid">
                <MetaItem label="Date" value={dateOnly(show.showDateTime)} icon={<CalendarDays size={14} />} />
                <MetaItem label="Time" value={new Date(show.showDateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} icon={<Clock size={14} />} />
                <MetaItem label="Venue" value={show.venueName} icon={<MapPin size={14} />} />
                <MetaItem label="Total seats" value={show.totalSeats.toString()} icon={<Users size={14} />} />
                {movie?.durationMinutes && <MetaItem label="Duration" value={`${movie.durationMinutes} min`} icon={<Clock size={14} />} />}
                {movie?.genre && <MetaItem label="Genre" value={movie.genre} icon={<Film size={14} />} />}
                {movie?.rating != null && (
                  <MetaItem label="Rating" value={`${movie.rating.toFixed(1)} / 10`} icon={<Star size={14} />} />
                )}
                {event?.category && <MetaItem label="Category" value={event.category} icon={<Zap size={14} />} />}
              </div>
            </div>

            {/* Description */}
            {(movie?.description ?? event?.description) && (
              <div className="card" style={{ padding: "1.5rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.875rem" }}>About</h2>
                <p style={{ color: "var(--ev-text-muted)", lineHeight: 1.75, fontSize: "0.9375rem" }}>
                  {movie?.description ?? event?.description}
                </p>
              </div>
            )}

            {/* Availability bar */}
            {!invLoading && inventory && (
              <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", marginBottom: "0.375rem" }}>Availability</div>
                  <div style={{ height: "6px", background: "var(--ev-bg-raised)", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(inventory.availableSeats / inventory.totalSeats) * 100}%`,
                        background: inventory.availableSeats < 10 ? "var(--ev-danger)" : "var(--ev-success)",
                        borderRadius: "999px",
                        transition: "width 0.4s",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "1rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {inventory.availableSeats}
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "var(--ev-text-muted)" }}> / {inventory.totalSeats} seats left</span>
                </div>
              </div>
            )}
          </div>

          {/* Right — sticky booking card */}
          <div>
            <div className="show-sticky">
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--ev-text-subtle)", marginBottom: "0.25rem" }}>Price per ticket</div>
                <div style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
                  {money(show.price)}
                </div>
              </div>

              {!invLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {isSoldOut || isPast ? (
                    <span className="status-badge status-badge--cancelled">
                      {isPast ? "Show ended" : "Sold out"}
                    </span>
                  ) : (
                    <>
                      <span className="status-badge status-badge--confirmed">Available</span>
                      {available !== undefined && available < 20 && (
                        <span className="badge badge--danger" style={{ fontSize: "0.75rem" }}>Only {available} left!</span>
                      )}
                    </>
                  )}
                </div>
              )}

              <button
                className="btn btn--primary btn--lg"
                onClick={handleBook}
                disabled={isSoldOut || isPast}
                style={{ width: "100%" }}
              >
                {isPast ? "Show ended" : isSoldOut ? "Sold out" : <>Book tickets <ArrowRight size={18} /></>}
              </button>

              {!isAuthenticated && !isPast && !isSoldOut && (
                <p style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", textAlign: "center" }}>
                  You'll be asked to sign in to complete booking.
                </p>
              )}

              <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <span>📅 {dateTime(show.showDateTime)}</span>
                <span>📍 {show.venueName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MetaItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="show-meta-item">
      <span className="show-meta-item__label">{label}</span>
      <span className="show-meta-item__value" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
        {icon && <span style={{ color: "var(--ev-text-subtle)" }}>{icon}</span>}{value}
      </span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: "clamp(280px, 45vw, 520px)", width: "100%", borderRadius: 0 }} />
      <div className="container">
        <div style={{ padding: "2.5rem 0 4rem", display: "grid", gridTemplateColumns: "1fr 320px", gap: "2.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="skeleton" style={{ height: "2rem", width: "60%" }} />
            <div className="skeleton" style={{ height: "1rem", width: "80%" }} />
            <div className="skeleton" style={{ height: "1rem", width: "45%" }} />
          </div>
          <div className="skeleton skeleton--card" style={{ height: "280px" }} />
        </div>
      </div>
    </div>
  );
}
