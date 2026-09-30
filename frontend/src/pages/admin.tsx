import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  Film,
  Globe,
  Landmark,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Ticket,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/eventix";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  Select,
  Skeleton,
} from "../components/ui";
import { useToast } from "../context/toast-context";
import type { Event, Movie, Show, Venue } from "../types/api";

type Tab = "movies" | "events" | "venues" | "shows";
type DeleteTarget = { kind: "movie" | "event"; id: number; name: string };
type QuickPublishTarget = {
  kind: "movie" | "event";
  id: number;
  name: string;
  posterUrl?: string | null;
};

// Generates a default showtime guaranteed to be in the future (Tomorrow at 7:00 PM)
function getDefaultShowDateTime(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = tomorrow.getFullYear();
  const mm = pad(tomorrow.getMonth() + 1);
  const dd = pad(tomorrow.getDate());
  const hh = pad(tomorrow.getHours());
  const min = pad(tomorrow.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// Generates min datetime attribute to prevent selecting past dates in HTML5 datepicker
function getMinShowDateTime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatShowDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

const emptyMovie = {
  title: "",
  description: "",
  genre: "",
  language: "",
  durationMinutes: null as number | null,
  posterUrl: "",
  rating: null as number | null,
};

const emptyEvent = {
  name: "",
  description: "",
  category: "",
  bannerUrl: "",
};

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("movies");
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [quickPublishTarget, setQuickPublishTarget] =
    useState<QuickPublishTarget | null>(null);

  const client = useQueryClient();
  const toast = useToast();

  const movies = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const events = useQuery({ queryKey: ["events"], queryFn: api.events });
  const venues = useQuery({ queryKey: ["venues"], queryFn: api.venues });
  const shows = useQuery({ queryKey: ["shows"], queryFn: api.shows });

  const invalidate = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["movies"] }),
      client.invalidateQueries({ queryKey: ["events"] }),
      client.invalidateQueries({ queryKey: ["venues"] }),
      client.invalidateQueries({ queryKey: ["shows"] }),
    ]);

  const deleteMovie = useMutation({
    mutationFn: api.deleteMovie,
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.show("success", "Movie deleted from catalog");
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn't delete movie", error.message),
  });

  const deleteEvent = useMutation({
    mutationFn: api.deleteEvent,
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.show("success", "Event deleted from catalog");
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn't delete event", error.message),
  });

  const deleteLoading = deleteMovie.isPending || deleteEvent.isPending;
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "movie") deleteMovie.mutate(deleteTarget.id);
    else deleteEvent.mutate(deleteTarget.id);
  };

  // Metrics
  const totalMovies = movies.data?.length || 0;
  const totalEvents = events.data?.length || 0;
  const totalVenues = venues.data?.length || 0;
  const totalShows = shows.data?.length || 0;

  return (
    <>
      <div className="page container admin-page">
        {/* Admin Header with Live Website quick link */}
        <div className="admin-header">
          <div className="admin-header__info">
            <span className="admin-pill">
              <Sparkles size={13} /> Admin Studio
            </span>
            <h1>Eventix Control Center</h1>
            <p>
              Manage titles, venues, and instant show scheduling for the live
              website.
            </p>
          </div>
          <div className="admin-header__actions">
            <Link
              to="/shows"
              className="button button--secondary admin-view-site-btn"
              title="Open the main user-facing Explore page"
            >
              <Globe size={15} /> View Main Website <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        {/* Dashboard Analytics & Metrics Bar */}
        <div className="admin-stats-grid">
          <div
            className={`admin-stat-card ${tab === "movies" ? "active" : ""}`}
            onClick={() => setTab("movies")}
          >
            <div className="admin-stat-icon">
              <Film size={20} />
            </div>
            <div>
              <span className="admin-stat-number">{totalMovies}</span>
              <span className="admin-stat-label">Movies in Catalog</span>
            </div>
          </div>

          <div
            className={`admin-stat-card ${tab === "events" ? "active" : ""}`}
            onClick={() => setTab("events")}
          >
            <div className="admin-stat-icon">
              <UsersRound size={20} />
            </div>
            <div>
              <span className="admin-stat-number">{totalEvents}</span>
              <span className="admin-stat-label">Live Events</span>
            </div>
          </div>

          <div
            className={`admin-stat-card ${tab === "venues" ? "active" : ""}`}
            onClick={() => setTab("venues")}
          >
            <div className="admin-stat-icon">
              <Landmark size={20} />
            </div>
            <div>
              <span className="admin-stat-number">{totalVenues}</span>
              <span className="admin-stat-label">Venues / Theaters</span>
            </div>
          </div>

          <div
            className={`admin-stat-card admin-stat-card--highlight ${
              tab === "shows" ? "active" : ""
            }`}
            onClick={() => setTab("shows")}
          >
            <div className="admin-stat-icon">
              <CalendarDays size={20} />
            </div>
            <div>
              <span className="admin-stat-number">{totalShows}</span>
              <span className="admin-stat-label">Published Shows</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "movies"}
            className={tab === "movies" ? "active" : ""}
            onClick={() => setTab("movies")}
          >
            <Film size={16} /> Movies
            <span className="admin-tab-badge">{totalMovies}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "events"}
            className={tab === "events" ? "active" : ""}
            onClick={() => setTab("events")}
          >
            <UsersRound size={16} /> Events
            <span className="admin-tab-badge">{totalEvents}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "venues"}
            className={tab === "venues" ? "active" : ""}
            onClick={() => setTab("venues")}
          >
            <Landmark size={16} /> Venues
            <span className="admin-tab-badge">{totalVenues}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "shows"}
            className={tab === "shows" ? "active" : ""}
            onClick={() => setTab("shows")}
          >
            <CalendarPlus size={16} /> Shows & Scheduling
            <span className="admin-tab-badge">{totalShows}</span>
          </button>
        </div>

        {/* Tab Content */}
        {tab === "movies" && (
          <AdminMovieTab
            movies={movies.data}
            venues={venues.data || []}
            shows={shows.data || []}
            loading={movies.isLoading}
            editing={editingMovie}
            setEditing={setEditingMovie}
            onSuccess={invalidate}
            onDelete={(id, name) =>
              setDeleteTarget({ kind: "movie", id, name })
            }
            onQuickPublish={(movie) =>
              setQuickPublishTarget({
                kind: "movie",
                id: movie.id,
                name: movie.title,
                posterUrl: movie.posterUrl,
              })
            }
          />
        )}

        {tab === "events" && (
          <AdminEventTab
            events={events.data}
            venues={venues.data || []}
            shows={shows.data || []}
            loading={events.isLoading}
            editing={editingEvent}
            setEditing={setEditingEvent}
            onSuccess={invalidate}
            onDelete={(id, name) =>
              setDeleteTarget({ kind: "event", id, name })
            }
            onQuickPublish={(event) =>
              setQuickPublishTarget({
                kind: "event",
                id: event.id,
                name: event.name,
                posterUrl: event.bannerUrl,
              })
            }
          />
        )}

        {tab === "venues" && (
          <AdminVenueTab
            venues={venues.data}
            shows={shows.data || []}
            loading={venues.isLoading}
            onSuccess={() => client.invalidateQueries({ queryKey: ["venues"] })}
          />
        )}

        {tab === "shows" && (
          <AdminShowTab
            movies={movies.data || []}
            events={events.data || []}
            venues={venues.data || []}
            shows={shows.data || []}
            loading={
              shows.isLoading ||
              venues.isLoading ||
              movies.isLoading ||
              events.isLoading
            }
            onSuccess={invalidate}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name || "this entry"}?`}
        description="This removes the catalogue entry permanently. Any existing shows linked to this title may also be affected."
        confirmLabel="Delete permanently"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Quick 1-Click Show Publishing Modal for any Draft/Existing title */}
      {quickPublishTarget && (
        <QuickPublishModal
          target={quickPublishTarget}
          venues={venues.data || []}
          onSuccess={invalidate}
          onClose={() => setQuickPublishTarget(null)}
        />
      )}
    </>
  );
}

/* =========================================================================
   MOVIES TAB: Comprehensive Form with Automatic Web Publishing
   ========================================================================= */
function AdminMovieTab({
  movies,
  venues,
  shows,
  loading,
  editing,
  setEditing,
  onSuccess,
  onDelete,
  onQuickPublish,
}: {
  movies?: Movie[];
  venues: Venue[];
  shows: Show[];
  loading: boolean;
  editing: Movie | null;
  setEditing: (movie: Movie | null) => void;
  onSuccess: () => void;
  onDelete: (id: number, name: string) => void;
  onQuickPublish: (movie: Movie) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(emptyMovie);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">(
    "all",
  );

  // Auto-Publish Show Option
  const [publishToWeb, setPublishToWeb] = useState(true);
  const [scheduleVenueId, setScheduleVenueId] = useState(
    venues[0]?.id ? String(venues[0].id) : "",
  );
  const [scheduleDateTime, setScheduleDateTime] = useState(
    getDefaultShowDateTime(),
  );
  const [schedulePrice, setSchedulePrice] = useState("250");
  const [scheduleSeats, setScheduleSeats] = useState("100");

  const movieMutation = useMutation({
    mutationFn: async () => {
      // Validate showtime if publishing
      if (!editing && publishToWeb) {
        const selected = new Date(scheduleDateTime);
        if (isNaN(selected.getTime()) || selected <= new Date()) {
          throw new Error("Show date & time must be in the future (after today).");
        }
      }

      let createdOrUpdated: Movie;
      if (editing) {
        createdOrUpdated = await api.updateMovie(editing.id, form);
      } else {
        createdOrUpdated = await api.createMovie(form);
        if (publishToWeb && scheduleVenueId) {
          try {
            await api.createShow({
              showType: "MOVIE",
              movieId: createdOrUpdated.id,
              eventId: null,
              venueId: Number(scheduleVenueId),
              showDateTime: scheduleDateTime,
              price: Number(schedulePrice) || 250,
              totalSeats: Number(scheduleSeats) || 100,
            });
          } catch (err: any) {
            toast.show(
              "error",
              "Movie created, but show schedule failed",
              err.message,
            );
          }
        }
      }
      return createdOrUpdated;
    },
    onSuccess: () => {
      onSuccess();
      setEditing(null);
      setForm(emptyMovie);
      setPublishToWeb(true);
      toast.show(
        "success",
        editing
          ? "Movie updated successfully"
          : publishToWeb
            ? "Movie created and published live to main website!"
            : "Movie saved to catalog",
      );
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn't save movie", error.message),
  });

  const onEdit = (movie: Movie) => {
    setEditing(movie);
    setPublishToWeb(false);
    setForm({
      title: movie.title,
      description: movie.description || "",
      genre: movie.genre || "",
      language: movie.language || "",
      durationMinutes: movie.durationMinutes,
      posterUrl: movie.posterUrl || "",
      rating: movie.rating,
    });
  };

  const onCancel = () => {
    setEditing(null);
    setForm(emptyMovie);
    setPublishToWeb(true);
  };

  const filteredMovies = useMemo(() => {
    if (!movies) return [];
    return movies.filter((movie) => {
      const matchesSearch =
        movie.title.toLowerCase().includes(search.toLowerCase()) ||
        (movie.genre || "").toLowerCase().includes(search.toLowerCase()) ||
        (movie.language || "").toLowerCase().includes(search.toLowerCase());

      const movieShows = shows.filter((s) => s.movieId === movie.id);
      const isLive = movieShows.length > 0;

      if (statusFilter === "live" && !isLive) return false;
      if (statusFilter === "draft" && isLive) return false;

      return matchesSearch;
    });
  }, [movies, shows, search, statusFilter]);

  return (
    <div className="admin-layout">
      {/* Creation & Edit Form */}
      <section className="admin-form">
        <div className="admin-form__heading">
          <div>
            <p className="eyebrow">{editing ? "Edit Title" : "New Title"}</p>
            <h2>{editing ? "Refine Movie" : "Add Movie to Catalog"}</h2>
          </div>
          {editing && (
            <button className="admin-cancel-btn" onClick={onCancel}>
              <X size={14} /> Cancel edit
            </button>
          )}
        </div>

        <Input
          label="Movie Title *"
          placeholder="e.g. Interstellar, Inception"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <div className="admin-form-row">
          <Input
            label="Genre"
            placeholder="e.g. Sci-Fi, Action, Thriller"
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
          />
          <Input
            label="Language"
            placeholder="e.g. English, Hindi"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          />
        </div>

        <div className="admin-form-row">
          <Input
            label="Duration (minutes)"
            type="number"
            placeholder="120"
            value={form.durationMinutes ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                durationMinutes: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
          <Input
            label="Rating (1-10)"
            type="number"
            step="0.1"
            placeholder="8.5"
            value={form.rating ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                rating: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>

        <Input
          label="Poster URL (Direct image link)"
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={form.posterUrl}
          onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
        />

        {form.posterUrl && (
          <div className="admin-poster-preview">
            <img
              src={form.posterUrl}
              alt="Poster preview"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span>Artwork preview</span>
          </div>
        )}

        <label className="field">
          <span>Synopsis / Description</span>
          <textarea
            rows={3}
            placeholder="Brief overview of the storyline..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        {/* AUTOMATIC WEB PUBLISHING PANEL */}
        {!editing && (
          <div className="admin-publish-box">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={publishToWeb}
                onChange={(e) => setPublishToWeb(e.target.checked)}
              />
              <span className="admin-checkbox-custom"></span>
              <span className="admin-checkbox-text">
                <strong>Publish show immediately to website</strong>
                <small>Automatically makes it bookable on the main page</small>
              </span>
            </label>

            {publishToWeb && (
              <div className="admin-publish-fields">
                <Select
                  label="Select Venue"
                  value={scheduleVenueId}
                  onChange={(e) => setScheduleVenueId(e.target.value)}
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city || "Main Hall"})
                    </option>
                  ))}
                  {venues.length === 0 && (
                    <option value="">No venues available</option>
                  )}
                </Select>

                <label className="field">
                  <span>Show Date & Time (Must be in future)</span>
                  <input
                    type="datetime-local"
                    min={getMinShowDateTime()}
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                  />
                  <small style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "3px", display: "block" }}>
                    Select a future date & time (e.g. tomorrow or later)
                  </small>
                </label>

                <div className="admin-form-row">
                  <Input
                    label="Price (₹)"
                    type="number"
                    value={schedulePrice}
                    onChange={(e) => setSchedulePrice(e.target.value)}
                  />
                  <Input
                    label="Total Seats"
                    type="number"
                    value={scheduleSeats}
                    onChange={(e) => setScheduleSeats(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          loading={movieMutation.isPending}
          disabled={!form.title.trim()}
          onClick={() => movieMutation.mutate()}
        >
          {editing
            ? "Save Changes"
            : publishToWeb
              ? "Create & Publish to Main Web"
              : "Save Movie (Draft)"}{" "}
          <Plus size={16} />
        </Button>
      </section>

      {/* Catalog List */}
      <section className="catalog-list">
        <div className="catalog-list__heading">
          <div>
            <h2>Movies Catalog</h2>
            <span className="catalog-subtitle">
              {filteredMovies.length} of {movies?.length || 0} titles
            </span>
          </div>

          <div className="admin-filter-pills">
            <button
              className={statusFilter === "all" ? "active" : ""}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
            <button
              className={statusFilter === "live" ? "active" : ""}
              onClick={() => setStatusFilter("live")}
            >
              Live on Web
            </button>
            <button
              className={statusFilter === "draft" ? "active" : ""}
              onClick={() => setStatusFilter("draft")}
            >
              Drafts
            </button>
          </div>
        </div>

        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search movie titles, genres, languages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="admin-search-clear"
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <>
            <Skeleton className="list-skeleton" />
            <Skeleton className="list-skeleton" />
            <Skeleton className="list-skeleton" />
          </>
        ) : filteredMovies.length ? (
          filteredMovies.map((movie) => {
            const movieShows = shows.filter((s) => s.movieId === movie.id);
            const isLive = movieShows.length > 0;

            return (
              <div className="admin-catalog-card" key={movie.id}>
                <div className="admin-catalog-card__media">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="admin-thumb"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="admin-thumb-fallback">
                      <Film size={20} />
                    </div>
                  )}
                </div>

                <div className="admin-catalog-card__content">
                  <div className="admin-catalog-card__title-row">
                    <strong>{movie.title}</strong>
                    {isLive ? (
                      <span
                        className="admin-badge admin-badge--live"
                        title={`${movieShows.length} show(s) scheduled`}
                      >
                        <CheckCircle2 size={12} /> Live ({movieShows.length})
                      </span>
                    ) : (
                      <span
                        className="admin-badge admin-badge--draft"
                        title="Not scheduled on website yet"
                      >
                        Draft
                      </span>
                    )}
                  </div>

                  <p className="admin-catalog-card__meta">
                    {[
                      movie.genre,
                      movie.language,
                      movie.durationMinutes ? `${movie.durationMinutes}m` : "",
                      movie.rating ? `★ ${movie.rating}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No extra metadata"}
                  </p>

                  {isLive ? (
                    <div className="admin-show-links">
                      {movieShows.slice(0, 2).map((s) => (
                        <Link
                          key={s.id}
                          to={`/shows/${s.id}`}
                          className="admin-mini-link"
                          title="View live show on website"
                        >
                          <Ticket size={11} /> {s.venueName} · ₹{s.price}
                        </Link>
                      ))}
                      {movieShows.length > 2 && (
                        <span className="admin-mini-more">
                          +{movieShows.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="admin-draft-hint">
                      Not appearing on main site until a show is scheduled.
                    </p>
                  )}
                </div>

                <div className="admin-catalog-card__actions">
                  <button
                    className="admin-action-btn admin-action-btn--publish"
                    title="Publish as a Show to website"
                    onClick={() => onQuickPublish(movie)}
                  >
                    <Plus size={14} /> Schedule Show
                  </button>
                  <button
                    className="admin-action-btn"
                    title={`Edit ${movie.title}`}
                    onClick={() => onEdit(movie)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="admin-action-btn admin-action-btn--danger"
                    title={`Delete ${movie.title}`}
                    onClick={() => onDelete(movie.id, movie.title)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No movies found"
            detail={
              search
                ? "No titles matched your filter. Try clearing the search."
                : "Add your first movie using the form on the left."
            }
          />
        )}
      </section>
    </div>
  );
}

/* =========================================================================
   EVENTS TAB: Live Experience Form with Instant Web Publishing
   ========================================================================= */
function AdminEventTab({
  events,
  venues,
  shows,
  loading,
  editing,
  setEditing,
  onSuccess,
  onDelete,
  onQuickPublish,
}: {
  events?: Event[];
  venues: Venue[];
  shows: Show[];
  loading: boolean;
  editing: Event | null;
  setEditing: (event: Event | null) => void;
  onSuccess: () => void;
  onDelete: (id: number, name: string) => void;
  onQuickPublish: (event: Event) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(emptyEvent);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">(
    "all",
  );

  const [publishToWeb, setPublishToWeb] = useState(true);
  const [scheduleVenueId, setScheduleVenueId] = useState(
    venues[0]?.id ? String(venues[0].id) : "",
  );
  const [scheduleDateTime, setScheduleDateTime] = useState(
    getDefaultShowDateTime(),
  );
  const [schedulePrice, setSchedulePrice] = useState("350");
  const [scheduleSeats, setScheduleSeats] = useState("100");

  const eventMutation = useMutation({
    mutationFn: async () => {
      if (!editing && publishToWeb) {
        const selected = new Date(scheduleDateTime);
        if (isNaN(selected.getTime()) || selected <= new Date()) {
          throw new Error("Show date & time must be in the future (after today).");
        }
      }

      let createdOrUpdated: Event;
      if (editing) {
        createdOrUpdated = await api.updateEvent(editing.id, form);
      } else {
        createdOrUpdated = await api.createEvent(form);
        if (publishToWeb && scheduleVenueId) {
          try {
            await api.createShow({
              showType: "EVENT",
              movieId: null,
              eventId: createdOrUpdated.id,
              venueId: Number(scheduleVenueId),
              showDateTime: scheduleDateTime,
              price: Number(schedulePrice) || 350,
              totalSeats: Number(scheduleSeats) || 100,
            });
          } catch (err: any) {
            toast.show(
              "error",
              "Event created, but show schedule failed",
              err.message,
            );
          }
        }
      }
      return createdOrUpdated;
    },
    onSuccess: () => {
      onSuccess();
      setEditing(null);
      setForm(emptyEvent);
      setPublishToWeb(true);
      toast.show(
        "success",
        editing
          ? "Event updated successfully"
          : publishToWeb
            ? "Event created and published live to main website!"
            : "Event saved to catalog",
      );
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn't save event", error.message),
  });

  const onEdit = (event: Event) => {
    setEditing(event);
    setPublishToWeb(false);
    setForm({
      name: event.name,
      description: event.description || "",
      category: event.category || "",
      bannerUrl: event.bannerUrl || "",
    });
  };

  const onCancel = () => {
    setEditing(null);
    setForm(emptyEvent);
    setPublishToWeb(true);
  };

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((ev) => {
      const matchesSearch =
        ev.name.toLowerCase().includes(search.toLowerCase()) ||
        (ev.category || "").toLowerCase().includes(search.toLowerCase());

      const eventShows = shows.filter((s) => s.eventId === ev.id);
      const isLive = eventShows.length > 0;

      if (statusFilter === "live" && !isLive) return false;
      if (statusFilter === "draft" && isLive) return false;

      return matchesSearch;
    });
  }, [events, shows, search, statusFilter]);

  return (
    <div className="admin-layout">
      {/* Event Form */}
      <section className="admin-form">
        <div className="admin-form__heading">
          <div>
            <p className="eyebrow">{editing ? "Edit Event" : "New Event"}</p>
            <h2>{editing ? "Refine Event" : "Add Live Event"}</h2>
          </div>
          {editing && (
            <button className="admin-cancel-btn" onClick={onCancel}>
              <X size={14} /> Cancel edit
            </button>
          )}
        </div>

        <Input
          label="Event Name *"
          placeholder="e.g. Symphony Live, Standup Comedy Night"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <Input
          label="Category"
          placeholder="e.g. Concert, Theater, Comedy, Workshop"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <Input
          label="Banner Image URL (optional)"
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={form.bannerUrl}
          onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
        />

        {form.bannerUrl && (
          <div className="admin-poster-preview">
            <img
              src={form.bannerUrl}
              alt="Banner preview"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span>Artwork preview</span>
          </div>
        )}

        <label className="field">
          <span>Event Description</span>
          <textarea
            rows={3}
            placeholder="Details about performer, venue rules, timings..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        {/* Automatic Web Publishing Section */}
        {!editing && (
          <div className="admin-publish-box">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={publishToWeb}
                onChange={(e) => setPublishToWeb(e.target.checked)}
              />
              <span className="admin-checkbox-custom"></span>
              <span className="admin-checkbox-text">
                <strong>Publish show immediately to website</strong>
                <small>Automatically makes it bookable on the main page</small>
              </span>
            </label>

            {publishToWeb && (
              <div className="admin-publish-fields">
                <Select
                  label="Select Venue"
                  value={scheduleVenueId}
                  onChange={(e) => setScheduleVenueId(e.target.value)}
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city || "Main Hall"})
                    </option>
                  ))}
                  {venues.length === 0 && (
                    <option value="">No venues available</option>
                  )}
                </Select>

                <label className="field">
                  <span>Show Date & Time (Must be in future)</span>
                  <input
                    type="datetime-local"
                    min={getMinShowDateTime()}
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                  />
                  <small style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "3px", display: "block" }}>
                    Select a future date & time (e.g. tomorrow or later)
                  </small>
                </label>

                <div className="admin-form-row">
                  <Input
                    label="Price (₹)"
                    type="number"
                    value={schedulePrice}
                    onChange={(e) => setSchedulePrice(e.target.value)}
                  />
                  <Input
                    label="Total Seats"
                    type="number"
                    value={scheduleSeats}
                    onChange={(e) => setScheduleSeats(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          loading={eventMutation.isPending}
          disabled={!form.name.trim()}
          onClick={() => eventMutation.mutate()}
        >
          {editing
            ? "Save Changes"
            : publishToWeb
              ? "Create & Publish to Main Web"
              : "Save Event (Draft)"}{" "}
          <Plus size={16} />
        </Button>
      </section>

      {/* Events List */}
      <section className="catalog-list">
        <div className="catalog-list__heading">
          <div>
            <h2>Events Catalog</h2>
            <span className="catalog-subtitle">
              {filteredEvents.length} of {events?.length || 0} events
            </span>
          </div>

          <div className="admin-filter-pills">
            <button
              className={statusFilter === "all" ? "active" : ""}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
            <button
              className={statusFilter === "live" ? "active" : ""}
              onClick={() => setStatusFilter("live")}
            >
              Live on Web
            </button>
            <button
              className={statusFilter === "draft" ? "active" : ""}
              onClick={() => setStatusFilter("draft")}
            >
              Drafts
            </button>
          </div>
        </div>

        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search event names, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="admin-search-clear"
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <>
            <Skeleton className="list-skeleton" />
            <Skeleton className="list-skeleton" />
          </>
        ) : filteredEvents.length ? (
          filteredEvents.map((ev) => {
            const eventShows = shows.filter((s) => s.eventId === ev.id);
            const isLive = eventShows.length > 0;

            return (
              <div className="admin-catalog-card" key={ev.id}>
                <div className="admin-catalog-card__media">
                  {ev.bannerUrl ? (
                    <img
                      src={ev.bannerUrl}
                      alt={ev.name}
                      className="admin-thumb"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="admin-thumb-fallback">
                      <UsersRound size={20} />
                    </div>
                  )}
                </div>

                <div className="admin-catalog-card__content">
                  <div className="admin-catalog-card__title-row">
                    <strong>{ev.name}</strong>
                    {isLive ? (
                      <span className="admin-badge admin-badge--live">
                        <CheckCircle2 size={12} /> Live ({eventShows.length})
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge--draft">
                        Draft
                      </span>
                    )}
                  </div>

                  <p className="admin-catalog-card__meta">
                    {ev.category || "General Event"}
                  </p>

                  {isLive ? (
                    <div className="admin-show-links">
                      {eventShows.slice(0, 2).map((s) => (
                        <Link
                          key={s.id}
                          to={`/shows/${s.id}`}
                          className="admin-mini-link"
                          title="View live show on website"
                        >
                          <Ticket size={11} /> {s.venueName} · ₹{s.price}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-draft-hint">
                      Not visible on main site until a show is scheduled.
                    </p>
                  )}
                </div>

                <div className="admin-catalog-card__actions">
                  <button
                    className="admin-action-btn admin-action-btn--publish"
                    title="Publish as a Show to website"
                    onClick={() => onQuickPublish(ev)}
                  >
                    <Plus size={14} /> Schedule Show
                  </button>
                  <button
                    className="admin-action-btn"
                    title={`Edit ${ev.name}`}
                    onClick={() => onEdit(ev)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="admin-action-btn admin-action-btn--danger"
                    title={`Delete ${ev.name}`}
                    onClick={() => onDelete(ev.id, ev.name)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No events found"
            detail={
              search
                ? "No events matched your search query."
                : "Add your first live event using the form on the left."
            }
          />
        )}
      </section>
    </div>
  );
}

/* =========================================================================
   VENUES TAB: Manage Locations & View Connected Shows
   ========================================================================= */
function AdminVenueTab({
  venues,
  shows,
  loading,
  onSuccess,
}: {
  venues?: Venue[];
  shows: Show[];
  loading: boolean;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", address: "", city: "" });

  const venueMutation = useMutation({
    mutationFn: () => api.createVenue(form),
    onSuccess: () => {
      onSuccess();
      setForm({ name: "", address: "", city: "" });
      toast.show("success", "Venue created successfully");
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn't create venue", error.message),
  });

  return (
    <div className="admin-layout">
      <section className="admin-form">
        <div className="admin-form__heading">
          <div>
            <p className="eyebrow">Locations</p>
            <h2>Add Venue or Theater</h2>
          </div>
        </div>

        <Input
          label="Venue Name *"
          placeholder="e.g. Grand Rex IMAX, Royal Opera"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <Input
          label="City *"
          placeholder="e.g. Mumbai, Delhi, Bengaluru"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />

        <Input
          label="Street Address (optional)"
          placeholder="e.g. Plot 45, Entertainment Boulevard"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <Button
          loading={venueMutation.isPending}
          disabled={!form.name.trim()}
          onClick={() => venueMutation.mutate()}
        >
          Create Venue <Plus size={16} />
        </Button>
      </section>

      <section className="catalog-list">
        <div className="catalog-list__heading">
          <div>
            <h2>Venues Directory</h2>
            <span className="catalog-subtitle">
              {venues?.length || 0} locations available
            </span>
          </div>
        </div>

        {loading ? (
          <Skeleton className="list-skeleton" />
        ) : venues?.length ? (
          venues.map((venue) => {
            const venueShows = shows.filter((s) => s.venueId === venue.id);

            return (
              <div className="admin-catalog-card" key={venue.id}>
                <div className="admin-catalog-card__media">
                  <div className="admin-thumb-fallback">
                    <Landmark size={20} />
                  </div>
                </div>

                <div className="admin-catalog-card__content">
                  <div className="admin-catalog-card__title-row">
                    <strong>{venue.name}</strong>
                    <span className="admin-badge admin-badge--venue">
                      {venueShows.length} show(s) scheduled
                    </span>
                  </div>
                  <p className="admin-catalog-card__meta">
                    <MapPin size={13} style={{ verticalAlign: "middle" }} />{" "}
                    {[venue.address, venue.city].filter(Boolean).join(", ") ||
                      "No physical address provided"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No venues registered"
            detail="Add your first venue to start scheduling shows on the website."
          />
        )}
      </section>
    </div>
  );
}

/* =========================================================================
   SHOWS & SCHEDULING TAB: Full Control of Website Inventory
   ========================================================================= */
function AdminShowTab({
  movies,
  events,
  venues,
  shows,
  loading,
  onSuccess,
}: {
  movies: Movie[];
  events: Event[];
  venues: Venue[];
  shows: Show[];
  loading: boolean;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    showType: "MOVIE",
    contentId: movies[0]?.id ? String(movies[0].id) : "",
    venueId: venues[0]?.id ? String(venues[0].id) : "",
    showDateTime: getDefaultShowDateTime(),
    price: "250",
    totalSeats: "100",
  });

  const showMutation = useMutation({
    mutationFn: async () => {
      const selected = new Date(form.showDateTime);
      if (isNaN(selected.getTime()) || selected <= new Date()) {
        throw new Error("Show date & time must be in the future (after today).");
      }

      return api.createShow({
        showType: form.showType as "MOVIE" | "EVENT",
        movieId: form.showType === "MOVIE" ? Number(form.contentId) : null,
        eventId: form.showType === "EVENT" ? Number(form.contentId) : null,
        venueId: Number(form.venueId),
        showDateTime: form.showDateTime,
        price: Number(form.price),
        totalSeats: Number(form.totalSeats),
      });
    },
    onSuccess: () => {
      onSuccess();
      toast.show(
        "success",
        "Show published live!",
        "It is now bookable on the main website immediately.",
      );
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn't publish show", error.message),
  });

  const content = form.showType === "MOVIE" ? movies : events;
  const itemName = (item: Movie | Event) =>
    "title" in item ? item.title : item.name;

  return (
    <div className="admin-layout">
      {/* Schedule Form */}
      <section className="admin-form">
        <div className="admin-form__heading">
          <div>
            <p className="eyebrow">Inventory</p>
            <h2>Publish a New Show</h2>
          </div>
        </div>

        <Select
          label="Experience Type"
          value={form.showType}
          onChange={(e) => {
            const nextType = e.target.value;
            const nextList = nextType === "MOVIE" ? movies : events;
            setForm({
              ...form,
              showType: nextType,
              contentId: nextList[0]?.id ? String(nextList[0].id) : "",
            });
          }}
        >
          <option value="MOVIE">Movie (Cinema)</option>
          <option value="EVENT">Live Event (Performance)</option>
        </Select>

        <Select
          label={form.showType === "MOVIE" ? "Choose Movie" : "Choose Event"}
          value={form.contentId}
          onChange={(e) => setForm({ ...form, contentId: e.target.value })}
        >
          <option value="">-- Choose an experience --</option>
          {content.map((item) => (
            <option key={item.id} value={item.id}>
              {itemName(item)}
            </option>
          ))}
        </Select>

        <Select
          label="Select Venue"
          value={form.venueId}
          onChange={(e) => setForm({ ...form, venueId: e.target.value })}
        >
          <option value="">-- Choose a venue --</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name} ({venue.city || "Main Hall"})
            </option>
          ))}
        </Select>

        <label className="field">
          <span>Date & Showtime (Must be in future)</span>
          <input
            type="datetime-local"
            min={getMinShowDateTime()}
            value={form.showDateTime}
            onChange={(e) => setForm({ ...form, showDateTime: e.target.value })}
          />
          <small style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "3px", display: "block" }}>
            Select a future date & time (e.g. tomorrow or later)
          </small>
        </label>

        <div className="admin-form-row">
          <Input
            label="Ticket Price (₹)"
            type="number"
            min="1"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Input
            label="Total Available Tickets"
            type="number"
            min="1"
            value={form.totalSeats}
            onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
          />
        </div>

        <Button
          disabled={
            !form.contentId ||
            !form.venueId ||
            !form.showDateTime ||
            !form.price ||
            !form.totalSeats
          }
          loading={showMutation.isPending}
          onClick={() => showMutation.mutate()}
        >
          Publish to Main Web <CalendarPlus size={16} />
        </Button>
      </section>

      {/* Shows List */}
      <section className="catalog-list">
        <div className="catalog-list__heading">
          <div>
            <h2>Published Shows</h2>
            <span className="catalog-subtitle">
              {shows.length} shows active & bookable on the main website
            </span>
          </div>
          <Link to="/shows" className="admin-quick-link" target="_blank">
            Open Explore <ExternalLink size={13} />
          </Link>
        </div>

        {loading ? (
          <>
            <Skeleton className="list-skeleton" />
            <Skeleton className="list-skeleton" />
            <Skeleton className="list-skeleton" />
          </>
        ) : shows.length ? (
          shows.map((show) => (
            <div className="admin-catalog-card" key={show.id}>
              <div className="admin-catalog-card__media">
                <div className="admin-thumb-fallback">
                  {show.showType === "MOVIE" ? (
                    <Film size={20} />
                  ) : (
                    <UsersRound size={20} />
                  )}
                </div>
              </div>

              <div className="admin-catalog-card__content">
                <div className="admin-catalog-card__title-row">
                  <strong>{show.title}</strong>
                  <span
                    className={`admin-badge ${
                      show.showType === "MOVIE"
                        ? "admin-badge--movie"
                        : "admin-badge--event"
                    }`}
                  >
                    {show.showType}
                  </span>
                </div>

                <p className="admin-catalog-card__meta">
                  <MapPin size={13} style={{ verticalAlign: "middle" }} />{" "}
                  {show.venueName} · ₹{show.price} · {show.totalSeats} total
                  seats
                </p>

                <p className="admin-catalog-card__time">
                  <CalendarDays size={13} style={{ verticalAlign: "middle" }} />{" "}
                  {formatShowDateTime(show.showDateTime)}
                </p>
              </div>

              <div className="admin-catalog-card__actions">
                <Link
                  to={`/shows/${show.id}`}
                  className="admin-action-btn admin-action-btn--site"
                  title="View and test book this show on the live site"
                >
                  <ExternalLink size={14} /> View on Site
                </Link>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No shows scheduled yet"
            detail="Publish a show using the form to have it appear on the main website."
          />
        )}
      </section>
    </div>
  );
}

/* =========================================================================
   QUICK PUBLISH MODAL: Instant 1-Click Show Publishing
   ========================================================================= */
function QuickPublishModal({
  target,
  venues,
  onSuccess,
  onClose,
}: {
  target: QuickPublishTarget;
  venues: Venue[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [venueId, setVenueId] = useState(
    venues[0]?.id ? String(venues[0].id) : "",
  );
  const [showDateTime, setShowDateTime] = useState(getDefaultShowDateTime());
  const [price, setPrice] = useState("250");
  const [totalSeats, setTotalSeats] = useState("100");

  const publishMutation = useMutation({
    mutationFn: async () => {
      const selected = new Date(showDateTime);
      if (isNaN(selected.getTime()) || selected <= new Date()) {
        throw new Error("Show date & time must be in the future (after today).");
      }

      return api.createShow({
        showType: target.kind === "movie" ? "MOVIE" : "EVENT",
        movieId: target.kind === "movie" ? target.id : null,
        eventId: target.kind === "event" ? target.id : null,
        venueId: Number(venueId),
        showDateTime,
        price: Number(price) || 250,
        totalSeats: Number(totalSeats) || 100,
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
      toast.show(
        "success",
        `Show published for "${target.name}"!`,
        "It is now live and bookable on the main website.",
      );
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn't publish show", error.message),
  });

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="confirm-dialog admin-quick-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-quick-modal__header">
          <div>
            <span className="admin-pill">
              <Sparkles size={13} /> Instant Web Publishing
            </span>
            <h2>Publish "{target.name}" to Website</h2>
            <p>
              Schedule a showtime to make this title immediately live and
              bookable on the main site.
            </p>
          </div>
          <button className="admin-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="admin-quick-modal__body">
          <Select
            label="Venue / Hall"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.city || "Main Hall"})
              </option>
            ))}
          </Select>

          <label className="field">
            <span>Date & Showtime (Must be in future)</span>
            <input
              type="datetime-local"
              min={getMinShowDateTime()}
              value={showDateTime}
              onChange={(e) => setShowDateTime(e.target.value)}
            />
            <small style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "3px", display: "block" }}>
              Select a future date & time (e.g. tomorrow or later)
            </small>
          </label>

          <div className="admin-form-row">
            <Input
              label="Ticket Price (₹)"
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Available Seats / Capacity"
              type="number"
              min="1"
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value)}
            />
          </div>
        </div>

        <div className="confirm-dialog__actions">
          <Button className="button--ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={publishMutation.isPending}
            disabled={!venueId || !showDateTime || !price || !totalSeats}
            onClick={() => publishMutation.mutate()}
          >
            Publish Live on Website <Globe size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
