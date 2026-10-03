import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, Star, Film, Zap, X } from "lucide-react";
import { api } from "../api/eventix";
import { money, dateOnly } from "../lib/utils";
import type { Show, Movie, Event } from "../types/api";

const FALLBACKS = ["ember", "sand", "dusk", "pine", "slate", "ochre"] as const;
const SORT_OPTIONS = [
  { value: "date-asc",   label: "Date: soonest first" },
  { value: "date-desc",  label: "Date: latest first" },
  { value: "price-asc",  label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "title",      label: "Title A–Z" },
];

function ShowCard({ show, movies, events }: { show: Show; movies: Movie[]; events: Event[] }) {
  const url =
    show.showType === "MOVIE"
      ? movies.find((m) => m.id === show.movieId)?.posterUrl
      : events.find((e) => e.id === show.eventId)?.bannerUrl;
  const rating =
    show.showType === "MOVIE" ? movies.find((m) => m.id === show.movieId)?.rating : null;
  const ev = show.showType === "EVENT" ? events.find((e) => e.id === show.eventId) : null;
  const fb = FALLBACKS[show.id % FALLBACKS.length]!;

  return (
    <Link to={`/shows/${show.id}`} className="poster-card">
      <div className="poster-card__art">
        {url
          ? <img src={url} alt={show.title} loading="lazy" />
          : <div className={`poster-card__fallback artwork--${fb}`} style={{ height: "100%" }} />}
        <div className="poster-card__badge">
          <span className={`badge ${show.showType === "MOVIE" ? "badge--accent" : "badge--pink"}`}>
            {show.showType === "MOVIE" ? "Movie" : (ev?.category ?? "Event")}
          </span>
        </div>
      </div>
      <div className="poster-card__body">
        <div className="poster-card__title">{show.title}</div>
        <div className="poster-card__meta">{dateOnly(show.showDateTime)}</div>
        <div className="poster-card__meta">{show.venueName}</div>
        {rating != null && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", color: "var(--ev-text-muted)", marginTop: "0.25rem" }}>
            <Star size={12} fill="currentColor" /> {rating.toFixed(1)}
          </div>
        )}
        <div className="poster-card__footer">
          <span className="poster-card__price">{money(show.price)}</span>
          <span className="poster-card__link">Book →</span>
        </div>
      </div>
    </Link>
  );
}

function ShowCardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--ev-radius-card)", overflow: "hidden" }}>
      <div className="skeleton skeleton--card" style={{ aspectRatio: "2/3" }} />
      <div style={{ padding: "1rem", background: "var(--ev-surface)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="skeleton skeleton--text" style={{ width: "80%" }} />
        <div className="skeleton skeleton--text" style={{ width: "55%" }} />
        <div className="skeleton skeleton--text" style={{ width: "40%", marginTop: "0.5rem" }} />
      </div>
    </div>
  );
}

export function ShowsPage() {
  const [params, setParams] = useSearchParams();

  const typeFilter = params.get("type") ?? "ALL";
  const searchQuery = params.get("q") ?? "";
  const sortBy = params.get("sort") ?? "date-asc";

  function setParam(key: string, val: string) {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next, { replace: true });
  }

  const { data: shows = [], isLoading: showsLoading } = useQuery({ queryKey: ["shows"], queryFn: api.shows });
  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });

  const filtered = useMemo(() => {
    let result = [...shows];

    if (typeFilter !== "ALL") result = result.filter((s) => s.showType === typeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.venueName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":   return new Date(a.showDateTime).getTime() - new Date(b.showDateTime).getTime();
        case "date-desc":  return new Date(b.showDateTime).getTime() - new Date(a.showDateTime).getTime();
        case "price-asc":  return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "title":      return a.title.localeCompare(b.title);
        default:           return 0;
      }
    });

    return result;
  }, [shows, typeFilter, searchQuery, sortBy]);

  const hasFilters = typeFilter !== "ALL" || searchQuery;

  return (
    <div className="page">
      <div className="container">
        {/* Page header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>All shows</p>
          <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "0.25rem" }}>
            Browse &amp; discover
          </h1>
          {!showsLoading && (
            <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
              {filtered.length} show{filtered.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {/* Type chips */}
          <div className="filter-bar" role="group" aria-label="Filter by type">
            {(["ALL", "MOVIE", "EVENT"] as const).map((t) => (
              <button
                key={t}
                className={`filter-chip${typeFilter === t ? " filter-chip--active" : ""}`}
                onClick={() => setParam("type", t === "ALL" ? "" : t)}
                aria-pressed={typeFilter === t}
              >
                {t === "ALL" && <SlidersHorizontal size={14} />}
                {t === "MOVIE" && <Film size={14} />}
                {t === "EVENT" && <Zap size={14} />}
                {t === "ALL" ? "All shows" : t === "MOVIE" ? "Movies" : "Events"}
              </button>
            ))}
          </div>

          {/* Search + sort row */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-wrap" style={{ flex: "1 1 220px", maxWidth: "380px" }}>
              <Search className="search-icon" size={16} />
              <input
                id="shows-search"
                type="search"
                className="input"
                placeholder="Search shows or venues…"
                value={searchQuery}
                onChange={(e) => setParam("q", e.target.value)}
                aria-label="Search shows"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto", flexWrap: "wrap" }}>
              <label htmlFor="shows-sort" className="field-label" style={{ whiteSpace: "nowrap" }}>Sort by</label>
              <select
                id="shows-sort"
                className="input"
                value={sortBy}
                onChange={(e) => setParam("sort", e.target.value)}
                style={{ width: "auto", minWidth: "180px" }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {hasFilters && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className="text-subtle" style={{ fontSize: "0.8125rem" }}>Active filters:</span>
              {typeFilter !== "ALL" && (
                <button
                  className="badge badge--accent"
                  style={{ cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  onClick={() => setParam("type", "")}
                  aria-label={`Remove ${typeFilter} filter`}
                >
                  {typeFilter} <X size={11} />
                </button>
              )}
              {searchQuery && (
                <button
                  className="badge badge--neutral"
                  style={{ cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  onClick={() => setParam("q", "")}
                  aria-label="Remove search filter"
                >
                  "{searchQuery}" <X size={11} />
                </button>
              )}
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setParams({}, { replace: true })}
                style={{ height: "auto", padding: "0.2rem 0.625rem", fontSize: "0.8125rem" }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        {showsLoading ? (
          <div className="grid--cards">
            {Array.from({ length: 8 }).map((_, i) => <ShowCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Search className="empty-state__icon" />
            <div className="empty-state__title">No shows found</div>
            <p className="empty-state__desc">
              {hasFilters ? "Try adjusting your filters or search term." : "No shows are available yet."}
            </p>
            {hasFilters && (
              <button className="btn btn--secondary" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid--cards">
            <AnimatePresence mode="popLayout">
              {filtered.map((show, i) => (
                <motion.div
                  key={show.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                >
                  <ShowCard show={show} movies={movies} events={events} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
