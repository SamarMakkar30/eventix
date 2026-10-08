/* ═══════════════════════════════════════════════════════════════════════════
   POSTER RING — scroll-driven 3D marquee.
   Posters orbit on a 3D ring; scrolling the sticky section spins the ring,
   the front-facing poster is captioned underneath. Inspired by luxury
   coverflow carousels, authored bespoke to match the Atelier system.

   Fallbacks: touch pointers, reduced motion, or <6 cards render as a plain
   horizontal rail — the 3D stage is a fine-pointer enhancement.
   ═══════════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { money, posterFallback } from "../lib/utils";
import SmartImage from "./smart-image";
import type { Show, Movie, Event } from "../types/api";

const posterFor = (show: Show, movies: Movie[], events: Event[]) =>
  show.thumbnailUrl ?? (show.showType === "MOVIE"
    ? movies.find((m) => m.id === show.movieId)?.posterUrl ?? null
    : events.find((e) => e.id === show.eventId)?.bannerUrl ?? null);

export function PosterRing({
  shows,
  movies,
  events,
}: {
  shows: Show[];
  movies: Movie[];
  events: Event[];
}) {
  const reduced = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const pointers = window.matchMedia("(pointer: fine)");
    const widths = window.matchMedia("(max-width: 900px)");
    const sync = () => {
      setFinePointer(pointers.matches);
      setNarrow(widths.matches);
    };
    sync();
    pointers.addEventListener("change", sync);
    widths.addEventListener("change", sync);
    return () => {
      pointers.removeEventListener("change", sync);
      widths.removeEventListener("change", sync);
    };
  }, []);

  const use3d = finePointer && !reduced && shows.length >= 4;

  if (!use3d) return <RailFallback shows={shows} movies={movies} events={events} />;
  return <Ring3D shows={shows} movies={movies} events={events} narrow={narrow} />;
}

/* ── The 3D ring ──────────────────────────────────────────────────────── */
function Ring3D({
  shows,
  movies,
  events,
  narrow,
}: {
  shows: Show[];
  movies: Movie[];
  events: Event[];
  narrow: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const n = shows.length;
  const step = 360 / n;
  const radius = narrow ? 300 : 430;
  const cardW = narrow ? 128 : 168;
  const cardH = Math.round(cardW * 1.5);

  /* One full revolution across the section; spring keeps it silky */
  const rotateRaw = useTransform(scrollYProgress, [0.05, 0.95], [0, -360]);
  const rotate = useSpring(rotateRaw, { stiffness: 90, damping: 24, mass: 0.6 });
  const tilt = useTransform(scrollYProgress, [0, 0.5, 1], [10, 4, 10]);
  const ringScale = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0.82, 1, 1, 0.86]);

  const [active, setActive] = useState(0);
  useMotionValueEvent(rotateRaw, "change", (v) => {
    const idx = ((Math.round((-v / step) % n) % n) + n) % n;
    setActive(idx);
  });

  const current = shows[active] ?? shows[0];

  return (
    <div ref={sectionRef} style={{ height: "320vh", position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.75rem",
          overflow: "hidden",
        }}
      >
        <p className="section-head__eyebrow" style={{ justifyContent: "center" }}>
          In cinemas — scroll to spin
        </p>

        {/* 3D stage */}
        <div
          style={{
            perspective: "1400px",
            perspectiveOrigin: "50% 42%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
          aria-hidden={current ? undefined : true}
        >
          <motion.div
            style={{
              transformStyle: "preserve-3d",
              rotateY: rotate,
              rotateX: tilt,
              scale: ringScale,
              position: "relative",
              width: cardW,
              height: cardH,
            }}
          >
            {shows.map((show, i) => {
              const url = posterFor(show, movies, events);
              const isActive = i === active;
              return (
                <div
                  key={show.id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `rotateY(${i * step}deg) translateZ(${radius}px)`,
                    borderRadius: "var(--ev-radius-card)",
                    overflow: "hidden",
                    border: `1px solid ${isActive ? "color-mix(in srgb, var(--ev-gold) 55%, transparent)" : "var(--ev-border)"}`,
                    boxShadow: isActive
                      ? "0 30px 80px rgba(0,0,0,.55), 0 0 0 3px var(--ev-gold-wash)"
                      : "0 18px 44px rgba(0,0,0,.38)",
                    background: "var(--ev-bg-raised)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <SmartImage
                    src={url}
                    alt=""
                    fallback={
                      <div style={{ width: "100%", height: "100%", background: posterFallback(show.id), display: "grid", placeItems: "center" }}>
                        <span className="font-display" style={{ color: "#F5EDDC", fontSize: "1.1rem", padding: "0.5rem", textAlign: "center" }}>{show.title}</span>
                      </div>
                    }
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Floor glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "16%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(720px, 86vw)",
            height: 90,
            background: "radial-gradient(50% 100% at 50% 0%, var(--ev-glow-accent), transparent 72%)",
            filter: "blur(6px)",
            pointerEvents: "none",
          }}
        />

        {/* Active caption */}
        {current && (
          <div key={current.id} style={{ textAlign: "center", zIndex: 2, maxWidth: "92vw" }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="font-display" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", lineHeight: 1.08 }}>
                {current.title}
              </div>
              <div style={{ color: "var(--ev-text-muted)", fontSize: "0.9rem", marginTop: "0.375rem" }}>
                {new Date(current.showDateTime).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · from {money(current.price)}
              </div>
              <Link to={`/shows/${current.id}`} className="btn btn--primary btn--sm btn-shine" style={{ marginTop: "0.875rem", display: "inline-flex" }}>
                Book this film <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Plain rail fallback (touch / reduced motion) ─────────────────────── */
function RailFallback({ shows, movies, events }: { shows: Show[]; movies: Movie[]; events: Event[] }) {
  return (
    <div className="container" style={{ paddingBottom: "1rem" }}>
      <div className="scroll-rail scroll-rail--poster">
        {shows.map((show) => {
          const url = posterFor(show, movies, events);
          return (
            <Link
              key={show.id}
              to={`/shows/${show.id}`}
              className="poster-v2"
              style={{ width: "min(190px, 58vw)", flexShrink: 0 }}
              aria-label={`${show.title} — from ${money(show.price)}`}
            >
              <div className="poster-v2__art">
                <SmartImage
                  src={url}
                  alt=""
                  fallback={<div className="poster-v2__fallback" style={{ background: posterFallback(show.id), height: "100%" }}>{show.title}</div>}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="poster-v2__body">
                <div className="poster-v2__title">{show.title}</div>
                <div className="poster-v2__footer">
                  <span className="poster-v2__price"><span className="poster-v2__from">from</span>{money(show.price)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
