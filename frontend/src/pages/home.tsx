import { lazy, Suspense, useMemo } from "react";
import { useDocumentMeta } from "../lib/use-document-meta";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Ticket, ShieldCheck, RefreshCw, ArrowRight, ArrowUpRight,
  Film, Star, MapPin, CalendarDays, Sparkles, AlertTriangle,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, posterFallback } from "../lib/utils";
import type { Show, Movie, Event } from "../types/api";
import {
  Reveal, Stagger, StaggerItem, Magnetic, Tilt, Spotlight,
  CountUp, Marquee, Parallax, WordsReveal,
} from "../components/motion-kit";

/* WebGL aurora — code-split so it never weighs down other routes */
const AuroraCanvas = lazy(() => import("../components/aurora-canvas"));
const SmartImage = lazy(() => import("../components/smart-image"));
import { PosterRing } from "../components/poster-ring";

const posterFor = (show: Show, movies: Movie[], events: Event[]) =>
  show.showType === "MOVIE"
    ? movies.find((m) => m.id === show.movieId)?.posterUrl ?? null
    : events.find((e) => e.id === show.eventId)?.bannerUrl ?? null;

/* ══════════════════════════════════════════════════════════════════════════
   HOME — cinematic editorial landing
   ══════════════════════════════════════════════════════════════════════════ */
export function HomePage() {
  useDocumentMeta("Eventix — Every great night starts with a ticket", "Premieres, concerts and one-night-only lineups — reserved in seconds.");
  const {
    data: shows = [],
    isLoading: showsLoading,
    isError: showsError,
    refetch,
    dataUpdatedAt,
  } = useQuery({ queryKey: ["shows"], queryFn: api.shows });
  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });

  /* "Upcoming" is judged against the moment the catalogue was fetched —
     a pure, reactive reference time (React Query provides it). */
  const { upcomingShows, movieShows, eventShows, upcoming } = useMemo(() => {
    const now = dataUpdatedAt || 0;
    const upcomingShows = shows.filter((s) => new Date(s.showDateTime).getTime() > now);
    const upcoming = [...upcomingShows]
      .sort((a, b) => new Date(a.showDateTime).getTime() - new Date(b.showDateTime).getTime())
      .slice(0, 5);
    return {
      upcomingShows,
      movieShows: upcomingShows.filter((s) => s.showType === "MOVIE").slice(0, 10),
      eventShows: upcomingShows.filter((s) => s.showType === "EVENT").slice(0, 6),
      upcoming,
    };
  }, [shows, dataUpdatedAt]);

  return (
    <>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="hero-v2 grain" aria-label="Hero">
        <div className="hero-v2__canvas" style={{ background: "radial-gradient(120% 100% at 50% 115%, #4A151D 0%, #1A1012 55%, #0E0A0B 100%)" }}>
          <Suspense fallback={null}>
            <AuroraCanvas />
          </Suspense>
        </div>
        <div className="hero-v2__veil" aria-hidden="true" />
        <div className="hero-v2__orb hero-v2__orb--a" aria-hidden="true" />
        <div className="hero-v2__orb hero-v2__orb--b" aria-hidden="true" />
        <div className="hero-v2__dust" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              style={{
                "--dust-x": `${(i * 7.3 + 8) % 96}%`,
                "--dust-delay": `${(i * 1.37) % 11}s`,
                "--dust-dur": `${9 + (i % 5) * 2.4}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="hero-v2__content container">
          <motion.p
            className="hero-v2__eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Cinema&nbsp;&nbsp;·&nbsp;&nbsp;Concerts&nbsp;&nbsp;·&nbsp;&nbsp;One night only
          </motion.p>

          <h1 className="display-hero" style={{ color: "var(--ev-hero-ink)", margin: "1.375rem 0 1.5rem", textShadow: "0 4px 40px rgba(0,0,0,.35)" }}>
            <WordsReveal text="Every great night" delay={0.3} />
            <br />
            <span className="sheen-text" style={{ fontStyle: "italic" }}>
              <WordsReveal text="starts with a ticket." delay={0.55} />
            </span>
          </h1>

          <motion.p
            className="hero-v2__sub"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.95 }}
          >
            Premières, gigs and once-in-a-while lineups — pick your show,
            choose your seats, and walk in with everything on your phone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.15 }}
            style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2.5rem" }}
          >
            <Magnetic>
              <Link to="/shows" className="btn btn--primary btn--lg btn-shine">
                See what's on <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </Magnetic>
            <Magnetic strength={0.2}>
              <a href="#how-it-works" className="btn btn--secondary btn--lg" style={{ textDecoration: "none" }}>
                <Sparkles size={17} aria-hidden="true" /> How it works
              </a>
            </Magnetic>
          </motion.div>

          {/* Live stats */}
          {!showsLoading && (shows.length > 0 || movies.length > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.4 }}
              style={{
                display: "flex", gap: "clamp(1.5rem, 5vw, 4rem)", justifyContent: "center",
                marginTop: "clamp(2.5rem, 6vh, 4.5rem)", flexWrap: "wrap",
              }}
            >
              {[
                { label: "Shows booking now", value: upcomingShows.length },
                { label: "Films on the marquee", value: movies.length },
                { label: "Live events lined up", value: events.length },
              ].map(({ label, value }) => (
                <div key={label} className="stat-v2" style={{ alignItems: "center", textAlign: "center" }}>
                  <span className="stat-v2__value" style={{ color: "var(--ev-hero-ink)" }}>
                    <CountUp to={value} />
                  </span>
                  <span className="stat-v2__label" style={{ color: "rgba(245, 237, 220, 0.62)" }}>{label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        <div className="hero-v2__scroll" aria-hidden="true">
          <span>Scroll</span>
          <div className="hero-v2__scroll-line" />
        </div>
      </section>

      {/* ───────────────────── NOW-BOOKING MARQUEE ───────────────────── */}
      {upcomingShows.length > 1 && (
        <div
          className="grain"
          style={{
            borderTop: "1px solid var(--ev-border)",
            borderBottom: "1px solid var(--ev-border)",
            background: "var(--ev-bg-raised)",
            padding: "0.9375rem 0",
            position: "relative",
          }}
          aria-hidden="true"
        >
          <Marquee duration={38}>
            {upcomingShows.slice(0, 8).map((s) => (
              <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: "1rem", whiteSpace: "nowrap" }}>
                <span style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.26em", color: "var(--ev-gold)" }}>NOW BOOKING</span>
                <span className="font-display" style={{ fontSize: "1.25rem" }}>{s.title}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)" }}>{money(s.price)}</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--ev-gold)", opacity: 0.6 }} />
              </span>
            ))}
          </Marquee>
        </div>
      )}

      {/* ───────────────────── FEATURED PREMIERE ───────────────────── */}
      {upcomingShows.length > 0 && (() => {
        const feature = upcoming[0] ?? upcomingShows[0];
        const url = posterFor(feature, movies, events);
        const d = new Date(feature.showDateTime);
        return (
          <section className="section-v2" aria-labelledby="premiere-title">
            <div className="container">
              <Reveal>
                <div className="section-head">
                  <div>
                    <p className="section-head__eyebrow">Next premiere</p>
                    <h2 id="premiere-title" className="display-section">First in <em>line</em></h2>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.06}>
                <div className="premiere grain beam beam--on">
                  <div className="premiere__art">
                    {url
                      ? <img src={url} alt="" />
                      : <div className="premiere__fallback" style={{ background: posterFallback(feature.id) }}>{feature.title}</div>}
                  </div>
                  <div className="premiere__body">
                    <span className="mono-ref" style={{ color: "var(--ev-gold)" }}>
                      {feature.showType === "MOVIE" ? "FILM PREMIERE" : "LIVE EVENT"} · {money(feature.price)} onwards
                    </span>
                    <div className="premiere__title">{feature.title}</div>
                    <div className="premiere__meta">
                      <span><CalendarDays size={15} aria-hidden="true" /> {d.toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                      <span><MapPin size={15} aria-hidden="true" /> {feature.venueName}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                      <Magnetic>
                        <Link to={`/shows/${feature.id}`} className="btn btn--primary btn--lg btn-shine">
                          Book this premiere <ArrowRight size={17} aria-hidden="true" />
                        </Link>
                      </Magnetic>
                      <Link to="/shows" className="btn btn--secondary">All shows</Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })()}

      {/* Data failure notice — honest, not silently empty */}
      {showsError && (
        <div className="container" style={{ paddingTop: "2rem" }}>
          <div className="info-banner" role="alert">
            <AlertTriangle size={18} style={{ color: "var(--ev-warning)", flexShrink: 0 }} />
            <span>We couldn't reach the box office just now.</span>
            <button className="btn btn--secondary btn--sm" onClick={() => void refetch()} style={{ marginLeft: "auto" }}>
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────── THE MARQUEE — 3D POSTER RING ───────────────────── */}
      {showsLoading ? (
        <div className="section-v2 container">
          <div className="scroll-rail scroll-rail--poster">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton skeleton--card" style={{ aspectRatio: "2/3" }} />
            ))}
          </div>
        </div>
      ) : movieShows.length > 0 ? (
        <section aria-label="Now showing in cinemas">
          <Reveal style={{ paddingTop: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            <div className="container" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <h2 className="display-section">On screens <em>tonight</em></h2>
            </div>
          </Reveal>
          <PosterRing shows={movieShows} movies={movies} events={events} />
        </section>
      ) : null}

      {/* ───────────────────── LIVE EVENTS ───────────────────── */}
      {eventShows.length > 0 && (
        <section className="section-v2 section-v2--tint grain" aria-labelledby="live-events-title">
          <div className="container">
            <Reveal>
              <div className="section-head">
                <div>
                  <p className="section-head__eyebrow">Stages &amp; arenas</p>
                  <h2 id="live-events-title" className="display-section">Live and <em>loud</em></h2>
                </div>
                <Link to="/shows?type=EVENT" className="btn btn--ghost btn--sm">
                  All events <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
            <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: "1.25rem" }}>
              {eventShows.map((show) => (
                <StaggerItem key={show.id}>
                  <Tilt max={4}>
                    <EditorialCard show={show} events={events} />
                  </Tilt>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ───────────────────── CATEGORIES ───────────────────── */}
      <section className="section-v2" aria-labelledby="categories-title">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <div>
                <p className="section-head__eyebrow">Pick a mood</p>
                <h2 id="categories-title" className="display-section">Find your <em>frame of mind</em></h2>
              </div>
            </div>
          </Reveal>
          <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(230px, 100%), 1fr))", gap: "1rem" }}>
            {[
              {
                name: "Movies", to: "/shows?type=MOVIE", seed: 0, icon: <Film size={20} aria-hidden="true" />,
                count: upcomingShows.filter((s) => s.showType === "MOVIE").length,
              },
              {
                name: "Live events", to: "/shows?type=EVENT", seed: 2, icon: <Ticket size={20} aria-hidden="true" />,
                count: upcomingShows.filter((s) => s.showType === "EVENT").length,
              },
              {
                name: "Everything", to: "/shows", seed: 5, icon: <ArrowUpRight size={20} aria-hidden="true" />,
                count: upcomingShows.length,
              },
              {
                name: "How it works", to: "/#how-it-works", seed: 1, icon: <Sparkles size={20} aria-hidden="true" />,
              },
            ].map(({ name, to, seed, icon, count }) => (
              <StaggerItem key={name}>
                <Tilt max={8}>
                  <Link to={to} className="cat-tile">
                    <div className="cat-tile__bg" style={{ background: posterFallback(seed) }}>
                      {null /* gradient fallback */}
                    </div>
                    <div className="cat-tile__overlay" />
                    <span className="cat-tile__arrow">{icon}</span>
                    <div className="cat-tile__label">
                      <span className="cat-tile__count">{count !== undefined ? `${count} booking now` : "Four quick steps"}</span>
                      <span className="cat-tile__name">{name}</span>
                    </div>
                  </Link>
                </Tilt>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ───────────────────── HOW IT WORKS ───────────────────── */}
      <section className="section-v2 section-v2--tint" id="how-it-works" aria-labelledby="how-title">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <div>
                <p className="section-head__eyebrow">Four steps</p>
                <h2 id="how-title" className="display-section">From browse to <em>barcode</em></h2>
              </div>
            </div>
          </Reveal>
          <div>
            {[
              { n: "01", title: "Find the one", desc: "Search by title or venue, filter by film or live event, sort by what matters — date, price, or your own alphabet." },
              { n: "02", title: "Claim your seats", desc: "Live availability, honest seat maps, and a running total before you commit to anything." },
              { n: "03", title: "Pay in seconds", desc: "One focused checkout. No accounts maze, no surprise fees — the price you see is the price you pay." },
              { n: "04", title: "Walk straight in", desc: "Your ticket and calendar invite land instantly. Cancel with a tap if plans change." },
            ].map(({ n, title, desc }, i) => (
              <Reveal key={n} delay={i * 0.06}>
                <div className="step-row">
                  <div className="step-row__num" aria-hidden="true">{n}</div>
                  <div>
                    <div className="step-row__title">{title}</div>
                    <p className="step-row__desc">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── COMING SOON ───────────────────── */}
      {upcoming.length > 0 && (
        <section className="section-v2" aria-labelledby="upcoming-title">
          <div className="container">
            <Reveal>
              <div className="section-head">
                <div>
                  <p className="section-head__eyebrow">On the calendar</p>
                  <h2 id="upcoming-title" className="display-section">Next in <em>line</em></h2>
                </div>
                <Link to="/shows" className="btn btn--ghost btn--sm">
                  Full calendar <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
            <Stagger>
              {upcoming.map((show) => {
                const d = new Date(show.showDateTime);
                return (
                  <StaggerItem key={show.id}>
                    <Link to={`/shows/${show.id}`} className="row-v2">
                      <div className="row-v2__date" aria-hidden="true">
                        <span className="row-v2__day">{d.getDate()}</span>
                        <span className="row-v2__mon">{d.toLocaleString("en-IN", { month: "short" })}</span>
                      </div>
                      <div>
                        <div className="row-v2__title">{show.title}</div>
                        <div className="row-v2__meta">
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                            <MapPin size={13} aria-hidden="true" /> {show.venueName}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                            <CalendarDays size={13} aria-hidden="true" />
                            {d.toLocaleString("en-IN", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <div className="row-v2__side">
                        <span className="row-v2__price">{money(show.price)}</span>
                        <span className="btn btn--secondary btn--sm">Details</span>
                      </div>
                    </Link>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </section>
      )}

      {/* ───────────────────── TRUST ───────────────────── */}
      <section className="section-v2 section-v2--tint grain" aria-labelledby="trust-title">
        <div className="container">
          <Reveal>
            <div className="section-head" style={{ marginBottom: "2rem" }}>
              <div>
                <p className="section-head__eyebrow">The fine print, handled</p>
                <h2 id="trust-title" className="display-section">Built like a <em>vault</em></h2>
              </div>
            </div>
          </Reveal>
          <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "2rem" }}>
            {[
              { icon: <Ticket size={20} />, title: "Instant confirmation", desc: "The moment your payment lands, the seat is yours. No pending purgatory." },
              { icon: <ShieldCheck size={20} />, title: "Sandboxed payments", desc: "Every transaction runs through a simulated gateway in this demo — safe to try, safe to break." },
              { icon: <RefreshCw size={20} />, title: "Cancel without a call", desc: "Plans change. Cancel confirmed bookings yourself, right from your account." },
              { icon: <Sparkles size={20} />, title: "Your ticket, forever findable", desc: "Reference numbers, calendar files and ticket exports, one tap away." },
            ].map(({ icon, title, desc }) => (
              <StaggerItem key={title}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ color: "var(--ev-gold)", marginTop: "0.125rem", flexShrink: 0 }} aria-hidden="true">{icon}</div>
                  <div>
                    <div style={{ fontWeight: 650, marginBottom: "0.375rem" }}>{title}</div>
                    <p style={{ fontSize: "0.9rem", color: "var(--ev-text-muted)", lineHeight: 1.7 }}>{desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ───────────────────── FINAL CTA ───────────────────── */}
      <section
        className="section-v2 grain"
        aria-labelledby="cta-title"
        style={{
          background:
            "radial-gradient(90% 120% at 50% 120%, var(--ev-glow-accent), transparent 65%), radial-gradient(60% 90% at 50% -20%, var(--ev-glow-gold), transparent 70%)",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <Parallax distance={24}>
            <Reveal>
              <p className="section-head__eyebrow" style={{ justifyContent: "center" }}>Ready when you are</p>
              <h2 id="cta-title" className="display" style={{ fontSize: "clamp(2.25rem, 6vw, 4.25rem)", lineHeight: 1.05, margin: "0.75rem 0 1.25rem" }}>
                The best seat is the one <em>you booked.</em>
              </h2>
              <p style={{ color: "var(--ev-text-muted)", maxWidth: "44ch", margin: "0 auto 2.25rem", lineHeight: 1.7 }}>
                Browse the catalogue, pick your night, and let the anticipation start early.
              </p>
              <Magnetic>
                <Link to="/shows" className="btn btn--primary btn--lg btn-shine">
                  Explore all shows <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Magnetic>
            </Reveal>
          </Parallax>
        </div>
      </section>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CARDS
   ══════════════════════════════════════════════════════════════════════════ */
export function PosterV2({ show, movies, events, compact = false }: {
  show: Show; movies: Movie[]; events: Event[]; compact?: boolean;
}) {
  const url = posterFor(show, movies, events);
  const rating = show.showType === "MOVIE"
    ? movies.find((m) => m.id === show.movieId)?.rating ?? null
    : null;
  const d = new Date(show.showDateTime);

  return (
    <Spotlight className="poster-v2 beam" style={{ height: "100%" }}>
      <Link
        to={`/shows/${show.id}`}
        style={{ display: "flex", flexDirection: "column", height: "100%", textDecoration: "none", color: "inherit" }}
        aria-label={`${show.title} — ${d.toLocaleString("en-IN", { dateStyle: "medium" })} — from ${money(show.price)}`}
      >
        <div className="poster-v2__art" style={compact ? { aspectRatio: "16/9" } : undefined}>
          <Suspense fallback={null}>
            <SmartImage
              src={url}
              alt=""
              fallback={<div className="poster-v2__fallback" style={{ background: posterFallback(show.id) }}>{show.title}</div>}
            />
          </Suspense>
          <span className="poster-v2__badge">{show.showType === "MOVIE" ? "Film" : "Live"}</span>
          <div className="poster-v2__shade" />
          <div className="poster-v2__shine" aria-hidden="true" />
          <span className="poster-v2__hover-cta">View details <ArrowUpRight size={13} aria-hidden="true" /></span>
        </div>
        <div className="poster-v2__body">
          <div className="poster-v2__title">{show.title}</div>
          <div className="poster-v2__meta">
            {d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            {rating != null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Star size={11} fill="currentColor" aria-hidden="true" /> {rating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="poster-v2__footer">
            <span className="poster-v2__price">
              <span className="poster-v2__from">from</span>{money(show.price)}
            </span>
          </div>
        </div>
      </Link>
    </Spotlight>
  );
}

function EditorialCard({ show, events }: { show: Show; events: Event[] }) {
  const ev = events.find((e) => e.id === show.eventId);
  const url = ev?.bannerUrl ?? null;
  const d = new Date(show.showDateTime);

  return (
    <Spotlight className="editorial-card beam">
      <Link to={`/shows/${show.id}`} style={{ display: "contents" }} aria-label={`${show.title} — ${money(show.price)} — view details`}>
        <div className="editorial-card__art">
          <Suspense fallback={null}>
            <SmartImage
              src={url}
              alt=""
              fallback={<div className="editorial-card__fallback" style={{ background: posterFallback(show.id + 2) }} />}
            />
          </Suspense>
        </div>
        <div className="editorial-card__overlay" />
        <div className="editorial-card__body">
          <span className="editorial-card__kicker">
            <Sparkles size={12} aria-hidden="true" /> {ev?.category ?? "Live event"}
          </span>
          <div className="editorial-card__title">{show.title}</div>
          <div className="editorial-card__meta">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              <CalendarDays size={13} aria-hidden="true" />
              {d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              <MapPin size={13} aria-hidden="true" /> {show.venueName}
            </span>
          </div>
          <span className="editorial-card__price">
            <span style={{ fontSize: "0.6875rem", letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.75, fontWeight: 500 }}>from</span>
            {money(show.price)}
          </span>
        </div>
      </Link>
    </Spotlight>
  );
}
