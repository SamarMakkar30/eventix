import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { CalendarDays, Filter, Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../api/eventix";
import { ShowCard } from "../components/show-card";
import { EmptyState, ErrorState, Select, Skeleton } from "../components/ui";
import { useSearchParams } from "react-router-dom";

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, delay: i * 0.06, ease: "easeOut" as const },
  }),
};

export function ShowsPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [type, setType] = useState(params.get("type") || "ALL");
  const [venue, setVenue] = useState("ALL");
  const [date, setDate] = useState("ALL");
  const [price, setPrice] = useState("ALL");
  const [sort, setSort] = useState("soonest");
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
  const inventoryQueries = useQueries({
    queries: (shows.data || []).map((show) => ({
      queryKey: ["inventory", String(show.id)],
      queryFn: () => api.inventory(show.id),
      retry: false,
    })),
  });
  const availability = useMemo(
    () =>
      new Map(
        (shows.data || []).map((show, index) => [
          show.id,
          inventoryQueries[index]?.data?.availableSeats,
        ]),
      ),
    [shows.data, inventoryQueries],
  );
  const venueOptions = useMemo(
    () =>
      Array.from(
        new Set((shows.data || []).map((show) => show.venueName)),
      ).sort(),
    [shows.data],
  );
  const dates = useMemo(
    () =>
      Array.from(
        new Set(
          (shows.data || []).map((show) => show.showDateTime.slice(0, 10)),
        ),
      ).sort(),
    [shows.data],
  );
  const filtered = useMemo(
    () =>
      (shows.data || [])
        .filter((show) => {
          const textMatches = `${show.title} ${show.venueName}`
            .toLowerCase()
            .includes(query.toLowerCase());
          const priceMatches =
            price === "ALL" ||
            (price === "UNDER_250" ? show.price < 250 : show.price >= 250);
          return (
            (type === "ALL" || show.showType === type) &&
            (venue === "ALL" || show.venueName === venue) &&
            (date === "ALL" || show.showDateTime.slice(0, 10) === date) &&
            priceMatches &&
            textMatches
          );
        })
        .sort((a, b) =>
          sort === "price"
            ? a.price - b.price
            : sort === "availability"
              ? (availability.get(b.id) || 0) - (availability.get(a.id) || 0)
              : new Date(a.showDateTime).getTime() -
                new Date(b.showDateTime).getTime(),
        ),
    [shows.data, type, venue, date, price, query, sort, availability],
  );
  const changeType = (value: string) => {
    setType(value);
    setParams(value === "ALL" ? {} : { type: value });
  };

  return (
    <div className="page container">
      <motion.div
        className="page-intro"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="eyebrow">Discover</p>
        <h1>Find a reason to go out.</h1>
        <p>
          Fresh screenings, live moments, and all the details that make a good
          plan easy.
        </p>
      </motion.div>

      <motion.div
        className="filters filters--expanded"
        aria-label="Show filters"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search shows or venues"
            aria-label="Search shows or venues"
          />
        </label>
        <Select
          label="Type"
          value={type}
          onChange={(event) => changeType(event.target.value)}
        >
          <option value="ALL">All experiences</option>
          <option value="MOVIE">Movies</option>
          <option value="EVENT">Live events</option>
        </Select>
        <Select
          label="Venue"
          value={venue}
          onChange={(event) => setVenue(event.target.value)}
        >
          <option value="ALL">All venues</option>
          {venueOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          label="Date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        >
          <option value="ALL">Any date</option>
          {dates.map((item) => (
            <option key={item} value={item}>
              {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                new Date(`${item}T12:00:00`),
              )}
            </option>
          ))}
        </Select>
        <Select
          label="Price"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        >
          <option value="ALL">Any price</option>
          <option value="UNDER_250">Under ₹250</option>
          <option value="250_PLUS">₹250 and above</option>
        </Select>
        <Select
          label="Sort"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="soonest">Soonest first</option>
          <option value="price">Lowest price</option>
          <option value="availability">Most available</option>
        </Select>
        <span className="filter-mark">
          <SlidersHorizontal size={17} /> Refine your plans
        </span>
      </motion.div>

      {shows.isError ? (
        <ErrorState
          detail="The programme is unavailable right now."
          retry={() => shows.refetch()}
        />
      ) : shows.isLoading ? (
        <div className="shows-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="show-card skeleton-card" key={i}>
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ))}
        </div>
      ) : filtered.length ? (
        <>
          <motion.p
            className="results-count"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Filter size={15} />
            {filtered.length}{" "}
            {filtered.length === 1 ? "experience" : "experiences"} to explore{" "}
            <span>
              <CalendarDays size={14} />
              Live availability shown where configured
            </span>
          </motion.p>
          <AnimatePresence mode="popLayout">
            <motion.div className="shows-grid" layout>
              {filtered.map((show, index) => (
                <motion.div
                  key={show.id}
                  layout
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  custom={index}
                >
                  <ShowCard
                    show={show}
                    movie={show.movieId ? moviesMap.get(show.movieId) : undefined}
                    event={show.eventId ? eventsMap.get(show.eventId) : undefined}
                    availableSeats={availability.get(show.id)}
                    index={0}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        <EmptyState
          title="Nothing matches that search"
          detail="Try a different title, venue, date, or price filter."
        />
      )}
    </div>
  );
}
