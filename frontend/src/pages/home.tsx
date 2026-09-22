import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Clapperboard,
  MapPin,
  Play,
  Sparkles,
  Star,
  Ticket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { api } from "../api/eventix";
import { Artwork } from "../components/artwork";
import { ShowCard } from "../components/show-card";
import { ErrorState, Skeleton } from "../components/ui";
import { dateTime, money } from "../lib/utils";

const sectionReveal = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function AnimatedCount({ value }: { value: number }) {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (reducedMotion || value === 0) {
      setDisplayValue(value);
      return;
    }

    const start = displayValue;
    const duration = 650;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setDisplayValue(Math.round(start + (value - start) * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, value]);

  return <>{displayValue}</>;
}

export function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const glowOneY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const glowTwoY = useTransform(scrollYProgress, [0, 1], [0, -55]);
  const shows = useQuery({ queryKey: ["shows"], queryFn: api.shows });
  const movies = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const events = useQuery({ queryKey: ["events"], queryFn: api.events });

  const moviesMap = useMemo(
    () => new Map(movies.data?.map((m) => [m.id, m])),
    [movies.data],
  );
  const eventsMap = useMemo(
    () => new Map(events.data?.map((e) => [e.id, e])),
    [events.data],
  );

  const featured = shows.data?.[0];
  const featuredMovie = featured?.movieId ? moviesMap.get(featured.movieId) : undefined;
  const featuredEvent = featured?.eventId ? eventsMap.get(featured.eventId) : undefined;

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero" ref={heroRef}>
        <motion.div
          className="hero-glow hero-glow--one"
          style={{ y: reducedMotion ? 0 : glowOneY }}
        />
        <motion.div
          className="hero-glow hero-glow--two"
          style={{ y: reducedMotion ? 0 : glowTwoY }}
        />
        <div className="container hero__grid">
          {/* Content col */}
          <motion.div
            className="hero__content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              className="hero-kicker"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span />
              YOUR NEXT GREAT NIGHT OUT
            </motion.div>

            {shows.isLoading ? (
              <>
                <Skeleton className="hero-title-skeleton" />
                <Skeleton className="hero-copy-skeleton" />
              </>
            ) : featured ? (
              <>
                <motion.p
                  className="eyebrow hero-category"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {featured.showType === "MOVIE"
                    ? featuredMovie?.genre || "The big screen awaits"
                    : featuredEvent?.category || "Live, right now"}
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                >
                  {featured.title}
                  <em>— made memorable.</em>
                </motion.h1>
                <motion.p
                  className="hero__description"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  {featured.showType === "MOVIE"
                    ? featuredMovie?.description ||
                      "An extraordinary night is waiting for you at Eventix Arena."
                    : featuredEvent?.description ||
                      "Step into the moments people will talk about tomorrow."}
                </motion.p>
                <motion.div
                  className="hero__meta"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                >
                  <span>
                    <CalendarDays size={16} />
                    {dateTime(featured.showDateTime)}
                  </span>
                  <span>
                    <MapPin size={16} />
                    {featured.venueName}
                  </span>
                </motion.div>
                <motion.div
                  className="hero__actions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                >
                  <Link className="button" to={`/shows/${featured.id}`}>
                    Book tickets <ArrowRight size={17} />
                  </Link>
                  <Link className="button button--ghost" to="/shows">
                    <Play size={16} fill="currentColor" />
                    Explore experiences
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <h1>
                  Find your next <em>great night out.</em>
                </h1>
                <p className="hero__description">
                  From cinema premieres to unforgettable live moments, Eventix
                  makes the plan feel effortless.
                </p>
                <Link className="button" to="/shows">
                  Explore shows <ArrowRight size={17} />
                </Link>
              </>
            )}
          </motion.div>

          {/* Art col */}
          <motion.div
            className="hero__art"
            initial={{ opacity: 0, scale: 0.92, rotate: 3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {featured ? (
              <Artwork
                title={featured.title}
                seed={featured.id}
                imageUrl={
                  featured.showType === "MOVIE"
                    ? featuredMovie?.posterUrl
                    : featuredEvent?.bannerUrl
                }
                type={featured.showType}
              />
            ) : (
              <div className="hero-placeholder" />
            )}
            {featured && (
              <motion.div
                className="hero-ticket"
                initial={{ opacity: 0, x: -30, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.7, type: "spring", damping: 18 }}
              >
                <span className="eyebrow">From</span>
                <strong>{money(featured.price)}</strong>
                <span>per ticket</span>
                <div className="ticket-notch ticket-notch--top" />
                <div className="ticket-notch ticket-notch--bottom" />
              </motion.div>
            )}
            <motion.div
              className="hero-orbit"
              animate={{ rotate: [15, 25, 15] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={17} /> <span>CURATED FOR YOU</span>
            </motion.div>
          </motion.div>
        </div>

        <motion.a
          href="#discover"
          className="scroll-cue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <span>Scroll to discover</span>
          <ArrowDown size={16} />
        </motion.a>
      </section>

      {/* ── NOW SHOWING ── */}
      <motion.section
        id="discover"
        className="section container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionReveal}
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Now showing</p>
            <h2>Make tonight count.</h2>
          </div>
          <Link className="inline-link" to="/shows">
            View all <ArrowRight size={17} />
          </Link>
        </div>
        {shows.isError ? (
          <ErrorState
            detail="We couldn't load the current programme."
            retry={() => shows.refetch()}
          />
        ) : (
          <div className="shows-grid">
            {shows.isLoading
              ? Array.from({ length: 3 }, (_, i) => (
                  <div className="show-card skeleton-card" key={i}>
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                  </div>
                ))
              : shows.data?.slice(0, 3).map((show, index) => (
                  <ShowCard
                    key={show.id}
                    show={show}
                    movie={show.movieId ? moviesMap.get(show.movieId) : undefined}
                    event={show.eventId ? eventsMap.get(show.eventId) : undefined}
                    priority={index === 0}
                    index={index}
                  />
                ))}
          </div>
        )}
      </motion.section>

      {/* ── CURATED MOOD ── */}
      <motion.section
        className="curated-section container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer}
      >
        <motion.div className="section-heading" variants={staggerItem}>
          <div>
            <p className="eyebrow">Choose your mood</p>
            <h2>
              Not just what's on.
              <br />
              <em>What feels right.</em>
            </h2>
          </div>
          <p className="curated-section__lead">
            A considered way into the programme, whether you are chasing the
            first show, a familiar favourite, or something unexpected.
          </p>
        </motion.div>
        <div className="curated-grid">
          {[
            {
              to: "/shows?type=MOVIE",
              cls: "curated-card--cinema",
              icon: <Clapperboard />,
              eyebrow: "For the big screen",
              heading: "Films that deserve the room.",
              count: movies.data?.length || 0,
              suffix: "cinema titles in the current programme",
              cta: "Explore films",
            },
            {
              to: "/shows?type=EVENT",
              cls: "curated-card--live",
              icon: <Sparkles />,
              eyebrow: "Live & in the moment",
              heading: "Stories you can step into.",
              count: events.data?.length || 0,
              suffix: "live experiences to discover",
              cta: "Explore live events",
            },
            {
              to: "/shows",
              cls: "curated-card--date",
              icon: <Ticket />,
              eyebrow: "Plan the occasion",
              heading: "Your next great yes is nearby.",
              count: shows.data?.length || 0,
              suffix: "upcoming shows curated for you",
              cta: "See everything on",
            },
          ].map((card) => (
            <motion.div key={card.to} variants={staggerItem}>
              <Link to={card.to} className={`curated-card ${card.cls}`}>
                {card.icon}
                <span className="eyebrow">{card.eyebrow}</span>
                <h3>{card.heading}</h3>
                <p>
                  <AnimatedCount value={card.count} /> {card.suffix}
                </p>
                <b>
                  {card.cta} <ArrowRight size={16} />
                </b>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── EXPERIENCE BAND ── */}
      <section className="experience-band">
        <div className="container experience-band__grid">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={sectionReveal}
          >
            <p className="eyebrow">The Eventix difference</p>
            <h2>
              Less planning.
              <br />
              <em>More presence.</em>
            </h2>
          </motion.div>
          <motion.div
            className="experience-list"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
          >
            {[
              {
                n: "01",
                title: "Choose with confidence",
                body: "Live availability and crystal-clear pricing, right from discovery.",
              },
              {
                n: "02",
                title: "Book in a breath",
                body: "A calm, focused checkout built for the moment you decide to go.",
              },
              {
                n: "03",
                title: "Just show up",
                body: "Your plans, tickets, and memories—beautifully in one place.",
              },
            ].map((item) => (
              <motion.div key={item.n} variants={staggerItem}>
                <span>{item.n}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── VENUE SPOTLIGHT ── */}
      <motion.section
        className="section container venue-feature"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionReveal}
      >
        <div className="venue-feature__visual">
          <div className="venue-ring venue-ring--one" />
          <div className="venue-ring venue-ring--two" />
          <Star fill="currentColor" />
          <span>
            EVENTIX
            <br />
            ARENA
          </span>
        </div>
        <div>
          <p className="eyebrow">Spotlight venue</p>
          <h2>Every seat is a front-row feeling.</h2>
          <p>
            World-class sound, seamless arrivals, and an atmosphere that starts
            before the lights go down.
          </p>
          <Link className="inline-link" to="/shows">
            Find your next show <ArrowRight size={17} />
          </Link>
        </div>
      </motion.section>
    </>
  );
}
