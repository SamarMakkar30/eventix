import { useEffect, useMemo, useRef, useState } from "react";
import { useDocumentMeta } from "../lib/use-document-meta";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, SlidersHorizontal, Film, Zap, X,
  RefreshCw, Compass, AlertTriangle,
} from "lucide-react";
import { api } from "../api/eventix";
import { Stagger, StaggerItem, Tilt, Reveal } from "../components/motion-kit";
import { PosterV2 } from "./home";
import type { ShowType } from "../types/api";

const SORT_OPTIONS = [
  { value: "date-asc", label: "Date — soonest first" },
  { value: "date-desc", label: "Date — latest first" },
  { value: "price-asc", label: "Price — low to high" },
  { value: "price-desc", label: "Price — high to low" },
  { value: "title", label: "Title — A to Z" },
] as const;

/* ── Skeleton ─────────────────────────────────────────────────────────── */
function ShowCardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--ev-radius-card)", overflow: "hidden" }}>
      <div className="skeleton skeleton--card" style={{ aspectRatio: "2/3" }} />
      <div style={{ padding: "1rem", background: "var(--ev-surface)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="skeleton" style={{ height: "1.0625rem", width: "80%" }} />
        <div className="skeleton" style={{ height: "0.8125rem", width: "55%" }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   BROWSE — catalogue with URL-synced filters
   ══════════════════════════════════════════════════════════════════════════ */
export function ShowsPage() {
  useDocumentMeta("Browse shows & events — Eventix", "The full Eventix catalogue: movies and live events, filterable and sortable.");
  const [params, setParams] = useSearchParams();

  const typeFilter = params.get("type") ?? "ALL";
  const searchQuery = params.get("q") ?? "";
  const sortBy = params.get("sort") ?? "date-asc";

  /* Debounce keystrokes before they hit the URL (audit fix: was per-keystroke).
     The input owns its text locally; every code path that clears filters
     below also resets it, so no sync effect is needed. */
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debounceRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (searchInput === searchQuery) return;
    debounceRef.current = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (searchInput) next.set("q", searchInput); else next.delete("q");
      setParams(next, { replace: true });
    }, 280);
    return () => window.clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const clearSearchOnly = () => { setSearchInput(""); setParam("q", ""); };
  const clearAllFilters = () => { setSearchInput(""); setParams({}, { replace: true }); };

  function setParam(key: string, val: string) {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next, { replace: true });
  }

  const {
    data: shows = [],
    isLoading: showsLoading,
    isError: showsError,
    refetch,
  } = useQuery({ queryKey: ["shows"], queryFn: api.shows, staleTime: 0, refetchInterval: 15_000, refetchOnWindowFocus: true });
  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });

  const filtered = useMemo(() => {
    let result = [...shows];

    if (typeFilter !== "ALL") result = result.filter((s) => s.showType === typeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.venueName.toLowerCase().includes(q),
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
  const typeCounts = useMemo(() => ({
    ALL: shows.length,
    MOVIE: shows.filter((s) => s.showType === "MOVIE").length,
    EVENT: shows.filter((s) => s.showType === "EVENT").length,
  }), [shows]);

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <Reveal style={{ marginBottom: "2rem" }}>
          <p className="section-head__eyebrow">The full catalogue</p>
          <h1 className="display" style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", lineHeight: 1.02, margin: "0.5rem 0 0.5rem" }}>
            Browse &amp; <em>discover</em>
          </h1>
          {!showsLoading && (
            <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
              {filtered.length} {filtered.length === 1 ? "show" : "shows"}
              {hasFilters ? " matching your filters" : " on the calendar"}
            </p>
          )}
        </Reveal>

        {/* Filter bar */}
        <Reveal style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="filter-bar" role="group" aria-label="Filter by type">
              {(["ALL", "MOVIE", "EVENT"] as const).map((t: "ALL" | ShowType) => (
                <button
                  key={t}
                  className={`chip-v2${typeFilter === t ? " chip-v2--active" : ""}`}
                  onClick={() => setParam("type", t === "ALL" ? "" : t)}
                  aria-pressed={typeFilter === t}
                >
                  {t === "ALL" && <SlidersHorizontal size={14} aria-hidden="true" />}
                  {t === "MOVIE" && <Film size={14} aria-hidden="true" />}
                  {t === "EVENT" && <Zap size={14} aria-hidden="true" />}
                  {t === "ALL" ? "All shows" : t === "MOVIE" ? "Movies" : "Live events"}
                  <span className="chip-v2__count" aria-hidden="true">{typeCounts[t]}</span>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <div className="search-wrap" style={{ flex: "1 1 220px", maxWidth: "380px" }}>
                <Search className="search-icon" size={16} aria-hidden="true" />
                <input
                  id="shows-search"
                  type="search"
                  className="input"
                  placeholder="Search titles or venues…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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
                  style={{ width: "auto", minWidth: "190px" }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasFilters && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}
              >
                <span className="text-subtle" style={{ fontSize: "0.8125rem" }}>Active filters:</span>
                {typeFilter !== "ALL" && (
                  <button
                    className="badge badge--accent"
                    style={{ cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    onClick={() => setParam("type", "")}
                    aria-label={`Remove ${typeFilter} filter`}
                  >
                    {typeFilter} <X size={11} aria-hidden="true" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    className="badge badge--neutral"
                    style={{ cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    onClick={clearSearchOnly}
                    aria-label="Remove search filter"
                  >
                    &ldquo;{searchQuery}&rdquo; <X size={11} aria-hidden="true" />
                  </button>
                )}
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={clearAllFilters}
                  style={{ height: "auto", padding: "0.2rem 0.625rem", fontSize: "0.8125rem" }}
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </div>
        </Reveal>

        {/* Grid */}
        {showsLoading ? (
          <div className="grid--cards">
            {Array.from({ length: 8 }).map((_, i) => <ShowCardSkeleton key={i} />)}
          </div>
        ) : showsError ? (
          /* Failure ≠ empty catalogue (audit fix) */
          <div className="error-state">
            <AlertTriangle className="error-state__icon" style={{ color: "var(--ev-warning)" }} />
            <div className="error-state__title">The catalogue won't load</div>
            <p className="error-state__desc">We couldn't reach the box office. Check your connection and try again.</p>
            <button className="btn btn--primary" onClick={() => void refetch()}>
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Compass className="empty-state__icon" />
            <div className="empty-state__title">Nothing matches — yet</div>
            <p className="empty-state__desc">
              {hasFilters ? "Loosen the filters or try a different search." : "The calendar is being finalised. Check back shortly."}
            </p>
            {hasFilters && (
              <button className="btn btn--secondary" onClick={clearAllFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <Stagger
            /* Re-keyed on filter change so each result set plays its entrance */
            key={`${typeFilter}|${searchQuery}|${sortBy}`}
            gap={0.045}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(208px, 100%), 1fr))", gap: "1.25rem" }}
          >
            {filtered.map((show) => (
              <StaggerItem key={show.id}>
                <Tilt max={5}>
                  <PosterV2 show={show} movies={movies} events={events} />
                </Tilt>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}
