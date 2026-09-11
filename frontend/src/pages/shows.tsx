import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { CalendarDays, Filter, Search, SlidersHorizontal } from "lucide-react";
import { api } from "../api/eventix";
import { ShowCard } from "../components/show-card";
import { EmptyState, ErrorState, Select, Skeleton } from "../components/ui";
import { useSearchParams } from "react-router-dom";

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
  const inventoryQueries = useQueries({ queries: (shows.data || []).map((show) => ({ queryKey: ["inventory", String(show.id)], queryFn: () => api.inventory(show.id), retry: false })) });
  const availability = useMemo(() => new Map((shows.data || []).map((show, index) => [show.id, inventoryQueries[index]?.data?.availableSeats])), [shows.data, inventoryQueries]);
  const venueOptions = useMemo(() => Array.from(new Set((shows.data || []).map((show) => show.venueName))).sort(), [shows.data]);
  const dates = useMemo(() => Array.from(new Set((shows.data || []).map((show) => show.showDateTime.slice(0, 10)))).sort(), [shows.data]);
  const filtered = useMemo(() => (shows.data || []).filter((show) => {
    const textMatches = `${show.title} ${show.venueName}`.toLowerCase().includes(query.toLowerCase());
    const priceMatches = price === "ALL" || (price === "UNDER_250" ? show.price < 250 : show.price >= 250);
    return (type === "ALL" || show.showType === type) && (venue === "ALL" || show.venueName === venue) && (date === "ALL" || show.showDateTime.slice(0, 10) === date) && priceMatches && textMatches;
  }).sort((a, b) => sort === "price" ? a.price - b.price : sort === "availability" ? (availability.get(b.id) || 0) - (availability.get(a.id) || 0) : new Date(a.showDateTime).getTime() - new Date(b.showDateTime).getTime()), [shows.data, type, venue, date, price, query, sort, availability]);
  const changeType = (value: string) => { setType(value); setParams(value === "ALL" ? {} : { type: value }); };
  return <div className="page container"><div className="page-intro"><p className="eyebrow">Discover</p><h1>Find a reason to go out.</h1><p>Fresh screenings, live moments, and all the details that make a good plan easy.</p></div>
    <div className="filters filters--expanded" aria-label="Show filters"><label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shows or venues" aria-label="Search shows or venues" /></label><Select label="Type" value={type} onChange={(event) => changeType(event.target.value)}><option value="ALL">All experiences</option><option value="MOVIE">Movies</option><option value="EVENT">Live events</option></Select><Select label="Venue" value={venue} onChange={(event) => setVenue(event.target.value)}><option value="ALL">All venues</option>{venueOptions.map((item) => <option key={item} value={item}>{item}</option>)}</Select><Select label="Date" value={date} onChange={(event) => setDate(event.target.value)}><option value="ALL">Any date</option>{dates.map((item) => <option key={item} value={item}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(`${item}T12:00:00`))}</option>)}</Select><Select label="Price" value={price} onChange={(event) => setPrice(event.target.value)}><option value="ALL">Any price</option><option value="UNDER_250">Under ₹250</option><option value="250_PLUS">₹250 and above</option></Select><Select label="Sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="soonest">Soonest first</option><option value="price">Lowest price</option><option value="availability">Most available</option></Select><span className="filter-mark"><SlidersHorizontal size={17} /> Refine your plans</span></div>
    {shows.isError ? <ErrorState detail="The programme is unavailable right now." retry={() => shows.refetch()} /> : shows.isLoading ? <div className="shows-grid">{Array.from({ length: 6 }, (_, index) => <div className="show-card skeleton-card" key={index}><Skeleton /><Skeleton /><Skeleton /></div>)}</div> : filtered.length ? <><p className="results-count"><Filter size={15} />{filtered.length} {filtered.length === 1 ? "experience" : "experiences"} to explore <span><CalendarDays size={14} />Live availability shown where configured</span></p><div className="shows-grid">{filtered.map((show) => <ShowCard key={show.id} show={show} movie={movies.data?.find((movie) => movie.id === show.movieId)} event={events.data?.find((event) => event.id === show.eventId)} availableSeats={availability.get(show.id)} />)}</div></> : <EmptyState title="Nothing matches that search" detail="Try a different title, venue, date, or price filter." />}
  </div>;
}
