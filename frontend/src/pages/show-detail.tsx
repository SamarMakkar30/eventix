import { useParams, Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from "../lib/use-document-meta";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  CalendarDays, MapPin, Clock, Users, Star, Film, Zap,
  ArrowRight, Ticket, ChevronLeft, RefreshCw, AlertTriangle, Flame,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateTime, dateOnly, posterFallback } from "../lib/utils";
import { useAuth } from "../context/auth-context";
import { Reveal, WordsReveal } from "../components/motion-kit";
import SmartImage from "../components/smart-image";

export function ShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: show, isLoading: showLoading, isError, refetch } = useQuery({
    queryKey: ["show", id],
    queryFn: () => api.show(id!),
    enabled: !!id,
  });

  const {
    data: inventory,
    isLoading: invLoading,
    isError: inventoryError,
  } = useQuery({
    queryKey: ["inventory", id],
    queryFn: () => api.inventory(id!),
    enabled: !!id,
    refetchInterval: 30_000,
  });

  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });
  useDocumentMeta(`Eventix — ${show?.title ?? "Show"}`, `Show times, venue, availability and booking for ${show?.title ?? "this show"}.`);

  if (showLoading) return <DetailSkeleton />;

  /* 404 vs network failure are different stories (audit fix) */
  if (isError || (!show && !invLoading)) {
    const isNotFound = !isError;
    return (
      <div className="error-state page container">
        {isNotFound
          ? <Ticket className="error-state__icon" />
          : <AlertTriangle className="error-state__icon" style={{ color: "var(--ev-warning)" }} />}
        <div className="error-state__title">{isNotFound ? "Show not found" : "Couldn't load this show"}</div>
        <p className="error-state__desc">
          {isNotFound
            ? "This show may have ended its run or never existed."
            : "We couldn't reach the box office. Check your connection and try again."}
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {!isNotFound && (
            <button className="btn btn--secondary" onClick={() => void refetch()}>
              <RefreshCw size={16} /> Try again
            </button>
          )}
          <Link to="/shows" className="btn btn--primary">Browse shows</Link>
        </div>
      </div>
    );
  }

  if (!show) return <DetailSkeleton />;

  const movie = show.showType === "MOVIE" ? movies.find((m) => m.id === show.movieId) : null;
  const event = show.showType === "EVENT" ? events.find((e) => e.id === show.eventId) : null;
  const bannerUrl = show.thumbnailUrl ?? movie?.posterUrl ?? event?.bannerUrl ?? null;
  const available = inventory?.availableSeats;
  const isPast = new Date(show.showDateTime) < new Date();
  const isSoldOut = available !== undefined && available === 0;
  /* The inventory service has no record for this show — booking can't proceed */
  const noInventory = !invLoading && inventoryError;
  const fillPct = inventory && inventory.totalSeats > 0
    ? Math.round(((inventory.totalSeats - inventory.availableSeats) / inventory.totalSeats) * 100)
    : 0;

  const handleBook = () => {
    if (noInventory) return;
    if (!isAuthenticated) {
      navigate(`/login?next=/shows/${show.id}/seats`);
    } else {
      navigate(`/shows/${show.id}/seats`);
    }
  };

  return (
    <>
      {/* ── HERO ── */}
      <div className="show-hero grain">
        <SmartImage
          src={bannerUrl}
          alt=""
          fallback={<div style={{ width: "100%", height: "100%", background: posterFallback(show.id) }} />}
        />
        <div className="show-hero__overlay" />
        <motion.div
          className="show-hero__content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="show-hero__eyebrow" style={{ color: "var(--ev-gold-bright)" }}>
            {show.showType === "MOVIE" ? "Now showing" : (event?.category ?? "Live event")}
            {movie?.language && ` · ${movie.language}`}
          </div>
          <h1 className="show-hero__title display" style={{ fontSize: "clamp(2.25rem, 5.5vw, 4rem)" }}>
            <WordsReveal text={show.title} />
          </h1>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center", fontSize: "0.9375rem", opacity: 0.9 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <CalendarDays size={15} aria-hidden="true" /> {dateOnly(show.showDateTime)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <MapPin size={15} aria-hidden="true" /> {show.venueName}
            </span>
            {movie?.rating != null && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Star size={14} fill="currentColor" aria-hidden="true" /> {movie.rating.toFixed(1)}/10
              </span>
            )}
          </div>
        </motion.div>
      </div>

      <div className="container">
        <div style={{ padding: "1.25rem 0 0" }}>
          <Link to="/shows" className="btn btn--ghost btn--sm" style={{ paddingLeft: "0.25rem" }}>
            <ChevronLeft size={16} aria-hidden="true" /> All shows
          </Link>
        </div>

        <div className="show-layout">
          {/* ── LEFT — details ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <Reveal>
              <div className="card" style={{ padding: "1.5rem" }}>
                <div className="show-meta-grid">
                  <MetaItem label="Date" value={dateOnly(show.showDateTime)} icon={<CalendarDays size={14} />} />
                  <MetaItem
                    label="Time"
                    value={new Date(show.showDateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    icon={<Clock size={14} />}
                  />
                  <MetaItem label="Venue" value={show.venueName} icon={<MapPin size={14} />} />
                  <MetaItem label="Total seats" value={show.totalSeats.toLocaleString("en-IN")} icon={<Users size={14} />} />
                  {movie?.durationMinutes && <MetaItem label="Duration" value={`${movie.durationMinutes} min`} icon={<Clock size={14} />} />}
                  {movie?.genre && <MetaItem label="Genre" value={movie.genre} icon={<Film size={14} />} />}
                  {movie?.rating != null && <MetaItem label="Rating" value={`${movie.rating.toFixed(1)} / 10`} icon={<Star size={14} />} />}
                  {event?.category && <MetaItem label="Category" value={event.category} icon={<Zap size={14} />} />}
                </div>
              </div>
            </Reveal>

            {(movie?.description ?? event?.description) && (
              <Reveal delay={0.05}>
                <div className="card" style={{ padding: "1.5rem" }}>
                  <h2 className="font-display" style={{ fontSize: "1.375rem", marginBottom: "0.75rem" }}>The story so far</h2>
                  <p style={{ color: "var(--ev-text-muted)", lineHeight: 1.8, fontSize: "0.9375rem" }}>
                    {movie?.description ?? event?.description}
                  </p>
                </div>
              </Reveal>
            )}

            {/* Audience meter */}
            {!invLoading && inventory && (
              <Reveal delay={0.08}>
                <div className="card gold-top" style={{ padding: "1.375rem 1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      <Flame size={14} style={{ color: "var(--ev-gold)" }} aria-hidden="true" /> House is {fillPct}% full
                    </span>
                    <span style={{ fontSize: "0.9375rem" }}>
                      <strong style={{ fontVariantNumeric: "tabular-nums" }}>{inventory.availableSeats.toLocaleString("en-IN")}</strong>
                      <span style={{ color: "var(--ev-text-muted)" }}> / {inventory.totalSeats.toLocaleString("en-IN")} seats left</span>
                    </span>
                  </div>
                  <div style={{ height: "8px", background: "var(--ev-bg-raised)", borderRadius: "999px", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPct}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                      style={{
                        height: "100%",
                        background: fillPct > 88 ? "var(--ev-danger)" : "linear-gradient(90deg, var(--ev-accent), var(--ev-gold))",
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                </div>
              </Reveal>
            )}
          </div>

          {/* ── RIGHT — sticky booking card ── */}
          <div>
            <div className="show-sticky glass">
              <div>
                <div style={{ fontSize: "0.6875rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ev-text-subtle)", marginBottom: "0.375rem" }}>
                  Tickets from
                </div>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {money(show.price)}
                </div>
              </div>

              {!invLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  {noInventory ? (
                    <span className="status-badge status-badge--pending">
                      Availability unavailable
                    </span>
                  ) : isSoldOut || isPast ? (
                    <span className="status-badge status-badge--cancelled">
                      {isPast ? "This show has ended" : "Sold out"}
                    </span>
                  ) : (
                    <>
                      <span className="status-badge status-badge--confirmed">Available</span>
                      {available !== undefined && available < 20 && (
                        <motion.span
                          className="badge badge--danger pulse-soft"
                          animate={{ scale: [1, 1.04, 1] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          Only {available} left!
                        </motion.span>
                      )}
                    </>
                  )}
                </div>
              )}

              <button
                className="btn btn--primary btn--lg btn-shine"
                onClick={handleBook}
                disabled={isSoldOut || isPast || noInventory}
                style={{ width: "100%" }}
              >
                {isPast
                  ? "Show ended"
                  : isSoldOut
                    ? "Sold out"
                    : noInventory
                      ? "Booking unavailable"
                      : <>Book tickets <ArrowRight size={18} aria-hidden="true" /></>}
              </button>

              {noInventory && (
                <p style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", textAlign: "center" }}>
                  This show has no seat inventory registered yet.
                </p>
              )}

              {!isAuthenticated && !isPast && !isSoldOut && (
                <p style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", textAlign: "center" }}>
                  You'll be asked to sign in to complete booking.
                </p>
              )}

              <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid var(--ev-border)", paddingTop: "1rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CalendarDays size={13} aria-hidden="true" /> {dateTime(show.showDateTime)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={13} aria-hidden="true" /> {show.venueName}
                </span>
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
        {icon && <span style={{ color: "var(--ev-text-subtle)" }} aria-hidden="true">{icon}</span>}{value}
      </span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: "clamp(280px, 45vw, 520px)", width: "100%", borderRadius: 0 }} />
      <div className="container">
        <div style={{ padding: "2.5rem 0 4rem", display: "grid", gridTemplateColumns: "1fr", gap: "2.5rem" }}>
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
