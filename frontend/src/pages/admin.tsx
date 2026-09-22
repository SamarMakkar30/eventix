import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  Film,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import { api } from "../api/eventix";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Skeleton,
} from "../components/ui";
import { useToast } from "../context/toast-context";
import type { Event, Movie } from "../types/api";

type Tab = "movies" | "events" | "venues" | "shows";
type DeleteTarget = { kind: "movie" | "event"; id: number; name: string };
const emptyMovie = {
  title: "",
  description: "",
  genre: "",
  language: "",
  durationMinutes: null as number | null,
  posterUrl: "",
  rating: null as number | null,
};
const emptyEvent = { name: "", description: "", category: "", bannerUrl: "" };

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("movies");
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
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
      client.invalidateQueries({ queryKey: ["movies"] });
      setDeleteTarget(null);
      toast.show("success", "Movie deleted");
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn’t delete movie", error.message),
  });

  const deleteEvent = useMutation({
    mutationFn: api.deleteEvent,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["events"] });
      setDeleteTarget(null);
      toast.show("success", "Event deleted");
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn’t delete event", error.message),
  });

  const deleteLoading = deleteMovie.isPending || deleteEvent.isPending;
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "movie") deleteMovie.mutate(deleteTarget.id);
    else deleteEvent.mutate(deleteTarget.id);
  };

  return (
    <>
      <div className="page container admin-page">
        <div className="page-intro compact">
          <p className="eyebrow">Admin studio</p>
          <h1>Shape the programme.</h1>
          <p>
            Build the Eventix catalogue using the backend’s supported catalogue
            endpoints.
          </p>
        </div>
        <div className="admin-tabs" role="tablist">
          {(["movies", "events", "venues", "shows"] as Tab[]).map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item === "movies" ? (
                <Film />
              ) : item === "events" ? (
                <UsersRound />
              ) : item === "venues" ? (
                <Landmark />
              ) : (
                <CalendarPlus />
              )}
              {item}
            </button>
          ))}
        </div>
        {tab === "movies" && (
          <AdminMovieTab
            movies={movies.data}
            loading={movies.isLoading}
            editing={editingMovie}
            setEditing={setEditingMovie}
            onSuccess={invalidate}
            onDelete={(id, name) =>
              setDeleteTarget({ kind: "movie", id, name })
            }
          />
        )}
        {tab === "events" && (
          <AdminEventTab
            events={events.data}
            loading={events.isLoading}
            editing={editingEvent}
            setEditing={setEditingEvent}
            onSuccess={invalidate}
            onDelete={(id, name) =>
              setDeleteTarget({ kind: "event", id, name })
            }
          />
        )}
        {tab === "venues" && (
          <AdminVenueTab
            venues={venues.data}
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name || "this entry"}?`}
        description="This deletes the catalogue entry permanently. This action cannot be undone."
        confirmLabel="Delete permanently"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

function AdminMovieTab({
  movies,
  loading,
  editing,
  setEditing,
  onSuccess,
  onDelete,
}: {
  movies?: Movie[];
  loading: boolean;
  editing: Movie | null;
  setEditing: (movie: Movie | null) => void;
  onSuccess: () => void;
  onDelete: (id: number, name: string) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(emptyMovie);

  const movieMutation = useMutation({
    mutationFn: () =>
      editing
        ? api.updateMovie(editing.id, form)
        : api.createMovie(form),
    onSuccess: () => {
      onSuccess();
      setEditing(null);
      setForm(emptyMovie);
      toast.show("success", "Catalogue saved");
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn’t save movie", error.message),
  });

  const onEdit = (movie: Movie) => {
    setEditing(movie);
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
  };

  return (
    <div className="admin-layout">
      <section className="admin-form">
        <div className="admin-form__heading">
          <div>
            <p className="eyebrow">{editing ? "Edit title" : "New title"}</p>
            <h2>{editing ? "Refine a movie" : "Add a movie"}</h2>
          </div>
          {editing && <button onClick={onCancel}>Cancel edit</button>}
        </div>
        <Input
          label="Title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <Input
          label="Genre"
          value={form.genre}
          onChange={(event) => setForm({ ...form, genre: event.target.value })}
        />
        <Input
          label="Language"
          value={form.language}
          onChange={(event) =>
            setForm({ ...form, language: event.target.value })
          }
        />
        <Input
          label="Duration (minutes)"
          type="number"
          value={form.durationMinutes ?? ""}
          onChange={(event) =>
            setForm({
              ...form,
              durationMinutes: event.target.value
                ? Number(event.target.value)
                : null,
            })
          }
        />
        <Input
          label="Poster URL (optional)"
          type="url"
          value={form.posterUrl}
          onChange={(event) =>
            setForm({ ...form, posterUrl: event.target.value })
          }
        />
        <label className="field">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </label>
        <Button loading={movieMutation.isPending} onClick={() => movieMutation.mutate()}>
          {editing ? "Save movie" : "Create movie"} <Plus size={16} />
        </Button>
      </section>
      <CatalogList
        title="Movies"
        items={movies}
        loading={loading}
        name={(item) => item.title}
        detail={(item) =>
          [item.genre, item.language].filter(Boolean).join(" · ") ||
          "No metadata"
        }
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function AdminEventTab({
  events,
  loading,
  editing,
  setEditing,
  onSuccess,
  onDelete,
}: {
  events?: Event[];
  loading: boolean;
  editing: Event | null;
  setEditing: (event: Event | null) => void;
  onSuccess: () => void;
  onDelete: (id: number, name: string) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(emptyEvent);

  const eventMutation = useMutation({
    mutationFn: () =>
      editing
        ? api.updateEvent(editing.id, form)
        : api.createEvent(form),
    onSuccess: () => {
      onSuccess();
      setEditing(null);
      setForm(emptyEvent);
      toast.show("success", "Catalogue saved");
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn’t save event", error.message),
  });

  const onEdit = (event: Event) => {
    setEditing(event);
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
  };

  return (
    <div className="admin-layout">
      <section className="admin-form">
        <div className="admin-form__heading">
          <div>
            <p className="eyebrow">
              {editing ? "Edit experience" : "New experience"}
            </p>
            <h2>{editing ? "Refine an event" : "Add an event"}</h2>
          </div>
          {editing && <button onClick={onCancel}>Cancel edit</button>}
        </div>
        <Input
          label="Event name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Input
          label="Category"
          value={form.category}
          onChange={(event) =>
            setForm({ ...form, category: event.target.value })
          }
        />
        <Input
          label="Banner URL (optional)"
          type="url"
          value={form.bannerUrl}
          onChange={(event) =>
            setForm({ ...form, bannerUrl: event.target.value })
          }
        />
        <label className="field">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </label>
        <Button loading={eventMutation.isPending} onClick={() => eventMutation.mutate()}>
          {editing ? "Save event" : "Create event"} <Plus size={16} />
        </Button>
      </section>
      <CatalogList
        title="Events"
        items={events}
        loading={loading}
        name={(item) => item.name}
        detail={(item) => item.category || "No category"}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function CatalogList<T extends { id: number }>({
  title,
  items,
  loading,
  name,
  detail,
  onEdit,
  onDelete,
}: {
  title: string;
  items?: T[];
  loading: boolean;
  name: (item: T) => string;
  detail: (item: T) => string;
  onEdit: (item: T) => void;
  onDelete: (id: number, name: string) => void;
}) {
  return (
    <section className="catalog-list">
      <div className="catalog-list__heading">
        <h2>{title}</h2>
        <span>{items?.length || 0} total</span>
      </div>
      {loading ? (
        <>
          <Skeleton className="list-skeleton" />
          <Skeleton className="list-skeleton" />
        </>
      ) : items?.length ? (
        items.map((item) => (
          <div className="catalog-row" key={item.id}>
            <div>
              <strong>{name(item)}</strong>
              <span>{detail(item)}</span>
            </div>
            <div>
              <button
                aria-label={`Edit ${name(item)}`}
                onClick={() => onEdit(item)}
              >
                <Pencil size={16} />
              </button>
              <button
                className="danger-icon"
                aria-label={`Delete ${name(item)}`}
                onClick={() => onDelete(item.id, name(item))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      ) : (
        <EmptyState
          title={`No ${title.toLowerCase()} yet`}
          detail="Create your first catalogue entry using the form."
        />
      )}
    </section>
  );
}

function AdminVenueTab({
  venues,
  loading,
  onSuccess,
}: {
  venues?: {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
  }[];
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
      toast.show("success", "Venue created");
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn’t create venue", error.message),
  });

  return (
    <div className="admin-layout">
      <section className="admin-form">
        <div className="admin-form__heading">
          <div>
            <p className="eyebrow">New venue</p>
            <h2>Add a place</h2>
          </div>
        </div>
        <Input
          label="Venue name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(event) =>
            setForm({ ...form, address: event.target.value })
          }
        />
        <Input
          label="City"
          value={form.city}
          onChange={(event) => setForm({ ...form, city: event.target.value })}
        />
        <Button loading={venueMutation.isPending} onClick={() => venueMutation.mutate()}>
          Create venue <Plus size={16} />
        </Button>
      </section>
      <section className="catalog-list">
        <div className="catalog-list__heading">
          <h2>Venues</h2>
          <span>{venues?.length || 0} total</span>
        </div>
        {loading ? (
          <Skeleton className="list-skeleton" />
        ) : venues?.length ? (
          venues.map((venue) => (
            <div className="catalog-row" key={venue.id}>
              <div>
                <strong>{venue.name}</strong>
                <span>
                  {[venue.address, venue.city].filter(Boolean).join(" · ") ||
                    "No address details"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No venues yet"
            detail="Add a venue to start scheduling experiences."
          />
        )}
      </section>
    </div>
  );
}

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
  venues: { id: number; name: string }[];
  shows: { id: number; title: string; venueName: string; totalSeats: number }[];
  loading: boolean;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    showType: "MOVIE",
    contentId: "",
    venueId: "",
    showDateTime: "",
    price: "",
    totalSeats: "",
  });

  const showMutation = useMutation({
    mutationFn: () =>
      api.createShow({
        showType: form.showType as "MOVIE" | "EVENT",
        movieId: form.showType === "MOVIE" ? Number(form.contentId) : null,
        eventId: form.showType === "EVENT" ? Number(form.contentId) : null,
        venueId: Number(form.venueId),
        showDateTime: form.showDateTime,
        price: Number(form.price),
        totalSeats: Number(form.totalSeats),
      }),
    onSuccess: () => {
      onSuccess();
      setForm({
        showType: "MOVIE",
        contentId: "",
        venueId: "",
        showDateTime: "",
        price: "",
        totalSeats: "",
      });
      toast.show(
        "success",
        "Show published",
        "Inventory was initialized through the catalog workflow.",
      );
    },
    onError: (error: Error) =>
      toast.show("error", "Couldn’t publish show", error.message),
  });

  const content = form.showType === "MOVIE" ? movies : events;
  const itemName = (item: Movie | Event) =>
    "title" in item ? item.title : item.name;

  return (
    <div className="admin-layout">
      <section className="admin-form">
        <div className="admin-form__heading">
          <div>
            <p className="eyebrow">Schedule</p>
            <h2>Publish a show</h2>
          </div>
        </div>
        <Select
          label="Experience type"
          value={form.showType}
          onChange={(event) =>
            setForm({ ...form, showType: event.target.value, contentId: "" })
          }
        >
          <option value="MOVIE">Movie</option>
          <option value="EVENT">Live event</option>
        </Select>
        <Select
          label={form.showType === "MOVIE" ? "Movie" : "Event"}
          value={form.contentId}
          onChange={(event) =>
            setForm({ ...form, contentId: event.target.value })
          }
        >
          <option value="">Choose an experience</option>
          {content.map((item) => (
            <option key={item.id} value={item.id}>
              {itemName(item)}
            </option>
          ))}
        </Select>
        <Select
          label="Venue"
          value={form.venueId}
          onChange={(event) =>
            setForm({ ...form, venueId: event.target.value })
          }
        >
          <option value="">Choose a venue</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </Select>
        <Input
          label="Date and time"
          type="datetime-local"
          value={form.showDateTime}
          onChange={(event) =>
            setForm({ ...form, showDateTime: event.target.value })
          }
        />
        <Input
          label="Ticket price (₹)"
          type="number"
          min="1"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
        />
        <Input
          label="Total tickets"
          type="number"
          min="1"
          value={form.totalSeats}
          onChange={(event) =>
            setForm({ ...form, totalSeats: event.target.value })
          }
        />
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
          Publish show <CalendarPlus size={16} />
        </Button>
      </section>
      <section className="catalog-list">
        <div className="catalog-list__heading">
          <h2>Published shows</h2>
          <span>{shows.length} total</span>
        </div>
        {loading ? (
          <Skeleton className="list-skeleton" />
        ) : shows.length ? (
          shows.map((show) => (
            <div className="catalog-row" key={show.id}>
              <div>
                <strong>{show.title}</strong>
                <span>
                  {show.venueName} · {show.totalSeats} tickets
                </span>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No shows scheduled"
            detail="Add a title, venue, and time to publish your first show."
          />
        )}
      </section>
    </div>
  );
}
