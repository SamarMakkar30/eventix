import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useInView } from "motion/react";
import {
  Ticket, Zap, ShieldCheck, RefreshCw, ArrowRight,
  Film, Music, Star, CalendarDays,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateOnly } from "../lib/utils";
import type { Show, Movie, Event } from "../types/api";

/* ── helpers ─────────────────────────────────────────────────────────── */
const FALLBACKS = ["ember", "sand", "dusk", "pine", "slate", "ochre"] as const;


/* ── animated counter ────────────────────────────────────────────────── */
function AnimCount({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    let start = 0;
    const step = Math.ceil(to / 40);
    const id = setInterval(() => {
      start = Math.min(start + step, to);
      el.textContent = start.toLocaleString("en-IN");
      if (start >= to) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [inView, to]);

  return <span ref={ref}>0</span>;
}

/* ── fade-in wrapper ─────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */
export function HomePage() {

  const { data: shows = [] } = useQuery({ queryKey: ["shows"], queryFn: api.shows });
  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });

  const movieShows = shows.filter((s) => s.showType === "MOVIE").slice(0, 10);
  const eventShows = shows.filter((s) => s.showType === "EVENT").slice(0, 6);
  const upcoming = [...shows]
    .filter((s) => new Date(s.showDateTime) > new Date())
    .sort((a, b) => new Date(a.showDateTime).getTime() - new Date(b.showDateTime).getTime())
    .slice(0, 5);
  const featured = shows.slice(0, 8);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────────────────────────── */}
      <section className="hero" aria-label="Hero">
        {/* Poster wall backdrop */}
        {featured.length > 0 && (
          <div className="poster-wall" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((col) => (
              <motion.div
                key={col}
                className="poster-wall__col"
                animate={{ y: col % 2 === 0 ? [0, -30, 0] : [0, 30, 0] }}
                transition={{ duration: 18 + col * 3, repeat: Infinity, ease: "linear" }}
              >
                {[...featured, ...featured].map((show, i) => {
                  const url =
                    show.showType === "MOVIE"
                      ? movies.find((m) => m.id === show.movieId)?.posterUrl
                      : events.find((e) => e.id === show.eventId)?.bannerUrl;
                  const fb = FALLBACKS[(show.id + col) % FALLBACKS.length]!;
                  return (
                    <div key={`${col}-${i}`} className="poster-wall__item">
                      {url
                        ? <img src={url} alt="" loading="lazy" />
                        : <div className={`artwork--${fb}`} style={{ width: "100%", height: "100%" }} />}
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        )}

        <div className="hero__content">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{ marginBottom: "1rem" }}
          >
            Movies · Live Events · Experiences
          </motion.p>

          <motion.h1
            className="hero__headline"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Tickets to<br />
            <span className="hero__accent">what matters.</span>
          </motion.h1>

          <motion.p
            className="hero__sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            From blockbuster premieres to live concerts — book your next great experience in seconds.
          </motion.p>

          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.5 }}
          >
            <Link to="/shows" className="btn btn--primary btn--lg">
              Browse shows <ArrowRight size={18} />
            </Link>
            <Link to="/shows?type=MOVIE" className="btn btn--secondary btn--lg">
              <Film size={18} /> Movies
            </Link>
          </motion.div>

          {/* Stats row */}
          {shows.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              style={{ display: "flex", gap: "2.5rem", justifyContent: "center", marginTop: "3.5rem", flexWrap: "wrap" }}
            >
              {[
                { label: "Shows available", value: shows.length },
                { label: "Movies", value: movies.length },
                { label: "Live events", value: events.length },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--ev-text)" }}>
                    <AnimCount to={value} />+
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>{label}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          NOW SHOWING — Movies
      ───────────────────────────────────────────────────────────────── */}
      {movieShows.length > 0 && (
        <section className="section">
          <div className="container">
            <FadeIn>
              <div className="section-header">
                <div>
                  <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>In cinemas</p>
                  <h2 className="section-title">Now showing</h2>
                </div>
                <Link to="/shows?type=MOVIE" className="btn btn--ghost btn--sm" style={{ gap: "0.375rem" }}>
                  All movies <ArrowRight size={15} />
                </Link>
              </div>
            </FadeIn>

            <div className="scroll-rail scroll-rail--poster">
              {movieShows.map((show, i) => (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <PosterCard show={show} movies={movies} events={events} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          LIVE EVENTS
      ───────────────────────────────────────────────────────────────── */}
      {eventShows.length > 0 && (
        <section className="section section--raised">
          <div className="container">
            <FadeIn>
              <div className="section-header">
                <div>
                  <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Live experiences</p>
                  <h2 className="section-title">Upcoming events</h2>
                </div>
                <Link to="/shows?type=EVENT" className="btn btn--ghost btn--sm" style={{ gap: "0.375rem" }}>
                  All events <ArrowRight size={15} />
                </Link>
              </div>
            </FadeIn>

            <div className="grid--cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))" }}>
              {eventShows.map((show, i) => (
                <FadeIn key={show.id} delay={i * 0.05}>
                  <EventCard show={show} events={events} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          BROWSE BY CATEGORY
      ───────────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <FadeIn>
            <div className="section-header" style={{ marginBottom: "1.5rem" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Find your vibe</p>
                <h2 className="section-title">Browse by category</h2>
              </div>
            </div>
          </FadeIn>
          <div className="category-grid">
            {[
              {
                name: "Movies",
                icon: <Film size={32} />,
                to: "/shows?type=MOVIE",
                img: movies[0]?.posterUrl,
                fb: "ochre",
              },
              {
                name: "Music",
                icon: <Music size={32} />,
                to: "/shows?type=EVENT",
                img: events.find((e) => e.category?.toLowerCase().includes("music"))?.bannerUrl,
                fb: "dusk",
              },
              {
                name: "Live Events",
                icon: <Zap size={32} />,
                to: "/shows?type=EVENT",
                img: events[0]?.bannerUrl,
                fb: "pine",
              },
              {
                name: "Experiences",
                icon: <Star size={32} />,
                to: "/shows",
                img: events[1]?.bannerUrl,
                fb: "slate",
              },
            ].map(({ name, to, img, fb }, i) => (
              <FadeIn key={name} delay={i * 0.07}>
                <Link to={to} className="category-tile">
                  {img
                    ? <img src={img} alt={name} loading="lazy" />
                    : <div className={`artwork--${fb}`} style={{ position: "absolute", inset: 0 }} />}
                  <div className="category-tile__overlay" />
                  <div className="category-tile__name">{name}</div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────────────────────────── */}
      <section className="section section--raised">
        <div className="container">
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Simple by design</p>
              <h2 className="section-title">How it works</h2>
            </div>
          </FadeIn>
          <div className="how-steps">
            {[
              { n: "01", title: "Browse shows", desc: "Discover movies, concerts, and experiences happening near you." },
              { n: "02", title: "Pick your seats", desc: "Choose your quantity, see live availability, no guesswork." },
              { n: "03", title: "Secure payment", desc: "Check out in seconds with our streamlined, sandboxed payment flow." },
              { n: "04", title: "Get your ticket", desc: "Confirmation instantly in your bookings. Your reference, always at hand." },
            ].map(({ n, title, desc }, i) => (
              <FadeIn key={n} delay={i * 0.08}>
                <div className="how-step">
                  <div className="how-step__num">{n}</div>
                  <div>
                    <div className="how-step__title">{title}</div>
                    <p className="how-step__desc">{desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          UPCOMING THIS WEEK
      ───────────────────────────────────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section className="section">
          <div className="container">
            <FadeIn>
              <div className="section-header">
                <div>
                  <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Don't miss out</p>
                  <h2 className="section-title">Coming soon</h2>
                </div>
                <Link to="/shows" className="btn btn--ghost btn--sm" style={{ gap: "0.375rem" }}>
                  See all <ArrowRight size={15} />
                </Link>
              </div>
            </FadeIn>
            <div className="grid--list">
              {upcoming.map((show, i) => (
                <FadeIn key={show.id} delay={i * 0.05}>
                  <Link to={`/shows/${show.id}`} style={{ textDecoration: "none" }}>
                    <div className="booking-card" style={{ cursor: "pointer" }}>
                      <div>
                        <div className="booking-card__title">{show.title}</div>
                        <div className="booking-card__meta">
                          <span className="booking-card__meta-item">
                            <CalendarDays size={14} /> {dateOnly(show.showDateTime)}
                          </span>
                          <span className="booking-card__meta-item text-muted">{show.venueName}</span>
                        </div>
                      </div>
                      <div className="booking-card__side">
                        <span className="badge badge--neutral">{show.showType === "MOVIE" ? "Movie" : "Event"}</span>
                        <span className="booking-card__amount">{money(show.price)}</span>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TRUST SIGNALS
      ───────────────────────────────────────────────────────────────── */}
      <section className="section section--raised">
        <div className="container">
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Why Eventix</p>
              <h2 className="section-title">Built for confidence</h2>
            </div>
          </FadeIn>
          <div className="trust-grid">
            {[
              { icon: <Zap size={22} />, title: "Instant confirmation", desc: "Your booking is confirmed the moment you pay — no waiting, no uncertainty." },
              { icon: <ShieldCheck size={22} />, title: "Secure payments", desc: "All transactions run through our sandboxed payment gateway. Safe by default." },
              { icon: <RefreshCw size={22} />, title: "Easy cancellation", desc: "Cancel confirmed bookings from your account with just one tap." },
              { icon: <Ticket size={22} />, title: "Your ticket, always", desc: "Access your booking reference and ticket details any time from your account." },
            ].map(({ icon, title, desc }, i) => (
              <FadeIn key={title} delay={i * 0.07}>
                <div className="trust-item">
                  <div className="trust-item__icon">{icon}</div>
                  <div>
                    <div className="trust-item__title">{title}</div>
                    <p className="trust-item__desc">{desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          FINAL CTA
      ───────────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container" style={{ textAlign: "center", maxWidth: "48rem", marginInline: "auto" }}>
          <FadeIn>
            <p className="eyebrow" style={{ marginBottom: "1rem" }}>Ready?</p>
            <h2 style={{ fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "1rem" }}>
              Your next great experience starts here.
            </h2>
            <p style={{ color: "var(--ev-text-muted)", marginBottom: "2rem", lineHeight: 1.65 }}>
              Hundreds of shows, instant booking, zero hassle.
            </p>
            <Link to="/shows" className="btn btn--primary btn--lg">
              Explore all shows <ArrowRight size={18} />
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}

/* ── sub-components ───────────────────────────────────────────────────── */
function PosterCard({ show, movies, events }: { show: Show; movies: Movie[]; events: Event[] }) {
  const url =
    show.showType === "MOVIE"
      ? (movies.find((m) => m.id === show.movieId)?.posterUrl ?? null)
      : (events.find((e) => e.id === show.eventId)?.bannerUrl ?? null);
  const fb = FALLBACKS[show.id % FALLBACKS.length]!;
  const rating = show.showType === "MOVIE" ? movies.find((m) => m.id === show.movieId)?.rating : null;

  return (
    <Link to={`/shows/${show.id}`} className="poster-card">
      <div className="poster-card__art">
        {url
          ? <img src={url} alt={show.title} loading="lazy" />
          : <div className={`poster-card__fallback artwork--${fb}`} style={{ height: "100%" }} />}
        <div className="poster-card__badge">
          <span className={`badge ${show.showType === "MOVIE" ? "badge--accent" : "badge--pink"}`}>
            {show.showType === "MOVIE" ? "Movie" : "Event"}
          </span>
        </div>
      </div>
      <div className="poster-card__body">
        <div className="poster-card__title">{show.title}</div>
        <div className="poster-card__meta">{dateOnly(show.showDateTime)}</div>
        {rating !== null && rating !== undefined && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", color: "var(--ev-text-muted)" }}>
            <Star size={12} fill="currentColor" /> {rating.toFixed(1)}
          </div>
        )}
        <div className="poster-card__footer">
          <span className="poster-card__price">{money(show.price)}</span>
          <span className="poster-card__link">Book</span>
        </div>
      </div>
    </Link>
  );
}

function EventCard({ show, events }: { show: Show; events: Event[] }) {
  const ev = events.find((e) => e.id === show.eventId);
  const url = ev?.bannerUrl ?? null;
  const fb = FALLBACKS[show.id % FALLBACKS.length]!;

  return (
    <Link to={`/shows/${show.id}`} className="poster-card">
      <div className="poster-card__art" style={{ aspectRatio: "16/9" }}>
        {url
          ? <img src={url} alt={show.title} loading="lazy" />
          : <div className={`poster-card__fallback artwork--${fb}`} style={{ height: "100%" }} />}
        <div className="poster-card__badge">
          <span className="badge badge--pink">{ev?.category ?? "Event"}</span>
        </div>
      </div>
      <div className="poster-card__body">
        <div className="poster-card__title">{show.title}</div>
        <div className="poster-card__meta">{dateOnly(show.showDateTime)} · {show.venueName}</div>
        <div className="poster-card__footer">
          <span className="poster-card__price">{money(show.price)}</span>
          <span className="poster-card__link">Book</span>
        </div>
      </div>
    </Link>
  );
}
