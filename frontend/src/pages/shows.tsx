import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { api } from "../api/eventix";
import { ShowCard } from "../components/show-card";
import { EmptyState, ErrorState, Select, Skeleton } from "../components/ui";
import { useSearchParams } from "react-router-dom";

export function ShowsPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [type, setType] = useState(params.get("type") || "ALL");
  const [sort, setSort] = useState("soonest");
  const shows = useQuery({ queryKey: ["shows"], queryFn: api.shows });
  const movies = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const events = useQuery({ queryKey: ["events"], queryFn: api.events });
  const filtered = useMemo(() => (shows.data || []).filter((show) => (type === "ALL" || show.showType === type) && `${show.title} ${show.venueName}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "price" ? a.price - b.price : new Date(a.showDateTime).getTime() - new Date(b.showDateTime).getTime()), [shows.data, type, query, sort]);
  const changeType = (value: string) => { setType(value); setParams(value === "ALL" ? {} : { type: value }); };
  return <div className="page container"><div className="page-intro"><p className="eyebrow">Discover</p><h1>Find a reason to go out.</h1><p>Fresh screenings, live moments, and all the details that make a good plan easy.</p></div>
    <div className="filters" aria-label="Show filters"><label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shows or venues" aria-label="Search shows or venues" /></label><Select label="Type" value={type} onChange={(event) => changeType(event.target.value)}><option value="ALL">All experiences</option><option value="MOVIE">Movies</option><option value="EVENT">Live events</option></Select><Select label="Sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="soonest">Soonest first</option><option value="price">Lowest price</option></Select><span className="filter-mark"><SlidersHorizontal size={17} /> Refine your plans</span></div>
    {shows.isError ? <ErrorState detail="The programme is unavailable right now." retry={() => shows.refetch()} /> : shows.isLoading ? <div className="shows-grid">{Array.from({ length: 6 }, (_, index) => <div className="show-card skeleton-card" key={index}><Skeleton /><Skeleton /><Skeleton /></div>)}</div> : filtered.length ? <><p className="results-count"><Filter size={15} />{filtered.length} {filtered.length === 1 ? "experience" : "experiences"} to explore</p><div className="shows-grid">{filtered.map((show) => <ShowCard key={show.id} show={show} movie={movies.data?.find((movie) => movie.id === show.movieId)} event={events.data?.find((event) => event.id === show.eventId)} />)}</div></> : <EmptyState title="Nothing matches that search" detail="Try a different title, venue, or filter." />}
  </div>;
}
