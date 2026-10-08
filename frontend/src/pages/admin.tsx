import { useEffect, useRef, useState } from "react";
import { useDocumentMeta } from "../lib/use-document-meta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart2, Ticket, Film, Plus, Trash2, RefreshCw,
  Users, DollarSign, ChevronRight, X, AlertTriangle, Inbox, Pencil,
  MapPin, Sparkles,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateOnly } from "../lib/utils";
import { useToast } from "../context/toast-context";
import { overlayVariants, panelVariants } from "../components/motion-kit";
import { bookingRef } from "./confirmation";
import type { ApiError } from "../api/client";
import type { Show, Movie, Event, Venue, BookingStatus } from "../types/api";

type Tab = "overview" | "shows" | "movies" | "events" | "venues" | "bookings";

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  PAYMENT_FAILED: "Failed",
  CANCELLED: "Cancelled",
};

/* ── Focus-trapped modal shell (shared by create + confirm) ───────────── */
function AdminModal({
  open, title, onClose, children, width,
}: {
  open: boolean; title: string; onClose: () => void;
  children: React.ReactNode; width?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement;
    panelRef.current?.querySelector<HTMLElement>("button, input, select")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && panelRef.current) {
        const els = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select, [href]"),
        );
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      (trigger as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          variants={overlayVariants}
          initial="hidden" animate="show" exit="exit"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={width ? { maxWidth: width } : undefined}
            variants={panelVariants}
            initial="hidden" animate="show" exit="exit"
          >
            <div className="modal__header">
              <div className="modal__title font-display" style={{ fontSize: "1.375rem" }}>{title}</div>
              <button
                type="button"
                className="modal__close"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                aria-label="Close dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Stat card ────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <motion.div
      className="card"
      style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: "var(--ev-radius-card)", flexShrink: 0,
        background: accent ? "linear-gradient(135deg, var(--ev-accent), #4A151D)" : "var(--ev-pale-pink)",
        color: accent ? "var(--ev-accent-ink)" : "var(--ev-text)",
        display: "grid", placeItems: "center",
        boxShadow: accent ? "0 8px 20px var(--ev-glow-accent)" : undefined,
      }} aria-hidden="true">
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.6875rem", color: "var(--ev-text-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>{label}</div>
        <div style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
        {sub && <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-muted)", marginTop: "0.125rem" }}>{sub}</div>}
      </div>
    </motion.div>
  );
}

/* ── Show row ─────────────────────────────────────────────────────────── */
function ShowRow({ show, onEdit, onDelete }: { show: Show; onEdit: (show: Show) => void; onDelete: (show: Show) => void }) {
  const isPast = new Date(show.showDateTime) < new Date();
  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {show.thumbnailUrl && (
            <img src={show.thumbnailUrl} alt="" style={{ width: 36, height: 48, objectFit: "cover", borderRadius: "var(--ev-radius-control)", background: "var(--ev-surface-raised)" }} />
          )}
          <div style={{ fontWeight: 600 }}>{show.title}</div>
        </div>
        <div className="text-muted" style={{ fontSize: "0.8125rem" }}>{show.venueName}</div>
      </td>
      <td>
        <span className={`badge ${show.showType === "MOVIE" ? "badge--accent" : "badge--pink"}`}>
          {show.showType === "MOVIE" ? "Movie" : "Event"}
        </span>
      </td>
      <td>
        <span className={isPast ? "status-badge status-badge--cancelled" : "status-badge status-badge--confirmed"}>
          {isPast ? "Past" : "Active"}
        </span>
      </td>
      <td>{dateOnly(show.showDateTime)}</td>
      <td style={{ fontVariantNumeric: "tabular-nums" }}>{money(show.price)}</td>
      <td style={{ fontVariantNumeric: "tabular-nums" }}>{show.totalSeats.toLocaleString("en-IN")}</td>
      <td>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn btn--ghost btn--icon btn--sm"
            onClick={() => onEdit(show)}
            title={`Edit ${show.title}`}
            aria-label={`Edit ${show.title}`}
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            className="btn btn--ghost btn--icon btn--sm"
            onClick={() => onDelete(show)}
            title={`Delete ${show.title}`}
            aria-label={`Delete ${show.title}`}
            style={{ color: "var(--ev-danger)" }}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Bookings table (shared) ──────────────────────────────────────────── */
function BookingsTable({ bookings }: { bookings: Array<{ id: number; showTitle: string; venueName: string; showDateTime: string; quantity: number; totalAmount: number; status: BookingStatus; userName?: string }> }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Ref</th>
            <th>Show</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Qty</th>
            <th>Amount</th>
            <th>Show date</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td className="mono" style={{ color: "var(--ev-gold)", fontWeight: 600 }}>{bookingRef(b.id)}</td>
              <td>
                <div style={{ fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.showTitle}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-muted)" }}>{b.venueName}</div>
              </td>
              <td style={{ fontSize: "0.9rem" }}>{b.userName ?? "You (demo)"}</td>
              <td>
                <span className={`status-badge status-badge--${b.status === "PAYMENT_FAILED" ? "payment_failed" : b.status.toLowerCase()}`}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </td>
              <td style={{ fontVariantNumeric: "tabular-nums" }}>{b.quantity}</td>
              <td style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{money(b.totalAmount)}</td>
              <td style={{ fontSize: "0.8125rem", color: "var(--ev-text-muted)", whiteSpace: "nowrap" }}>{dateOnly(b.showDateTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Create show modal ────────────────────────────────────────────────── */
function CreateShowModal({ movies, events, venues, editingShow, onClose }: {
  movies: Movie[]; events: Event[]; venues: Venue[]; editingShow?: Show; onClose: () => void;
}) {
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    showType: editingShow?.showType ?? "MOVIE",
    movieId: editingShow?.movieId ?? movies[0]?.id ?? 0,
    eventId: editingShow?.eventId ?? events[0]?.id ?? 0,
    thumbnailUrl: editingShow?.thumbnailUrl ?? "",
    venueId: editingShow?.venueId ?? venues[0]?.id ?? 1,
    showDateTime: editingShow ? new Date(editingShow.showDateTime).toISOString().slice(0, 16) : "",
    totalSeats: editingShow?.totalSeats ?? 100,
    price: editingShow?.price ?? 250,
  });

  const [showNewMovie, setShowNewMovie] = useState(false);
  const [newMovie, setNewMovie] = useState({ title: "", genre: "Sci-Fi", language: "English", durationMinutes: 135, rating: 8.5 });

  const [showNewVenue, setShowNewVenue] = useState(false);
  const [newVenue, setNewVenue] = useState({ name: "", city: "Mumbai", address: "City Center" });

  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: "", category: "Music", description: "Live performance" });

  const addMovie = useMutation({
    mutationFn: () => api.createMovie({ ...newMovie, description: "", posterUrl: null }),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: ["movies"] });
      set("movieId", created.id);
      setShowNewMovie(false);
      setNewMovie({ title: "", genre: "Sci-Fi", language: "English", durationMinutes: 135, rating: 8.5 });
      toast("success", "Movie added", `${created.title} added and selected.`);
    },
    onError: (err) => toast("error", "Failed to add movie", (err as ApiError)?.message ?? "Check fields and try again."),
  });

  const addVenue = useMutation({
    mutationFn: () => api.createVenue(newVenue),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: ["venues"] });
      set("venueId", created.id);
      setShowNewVenue(false);
      setNewVenue({ name: "", city: "Mumbai", address: "City Center" });
      toast("success", "Venue added", `${created.name} added and selected.`);
    },
    onError: (err) => toast("error", "Failed to add venue", (err as ApiError)?.message ?? "Check fields and try again."),
  });

  const addEvent = useMutation({
    mutationFn: () => api.createEvent({ ...newEvent, bannerUrl: null }),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: ["events"] });
      set("eventId", created.id);
      setShowNewEvent(false);
      setNewEvent({ name: "", category: "Music", description: "Live performance" });
      toast("success", "Event added", `${created.name} added and selected.`);
    },
    onError: (err) => toast("error", "Failed to add event", (err as ApiError)?.message ?? "Check fields and try again."),
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        showType: form.showType as "MOVIE" | "EVENT",
        movieId: form.showType === "MOVIE" ? form.movieId : null,
        eventId: form.showType === "EVENT" ? form.eventId : null,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        venueId: Number(form.venueId),
        showDateTime: new Date(form.showDateTime).toISOString(),
        totalSeats: Number(form.totalSeats),
        price: Number(form.price),
      };
      return editingShow ? api.updateShow(editingShow.id, payload) : api.createShow(payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["shows"] });
      toast("success", editingShow ? "Show updated" : "Show created", editingShow ? "The show details were updated." : "The new show is live on the marquee.");
      onClose();
    },
    onError: (err) => toast("error", "Creation failed", (err as ApiError)?.message ?? "Please check the form and try again."),
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = !!(form.venueId && form.showDateTime && (form.showType === "MOVIE" ? form.movieId : form.eventId));

  return (
    <AdminModal open title="Create a show" onClose={onClose} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
        <div className="field">
          <label className="field-label" htmlFor="cs-type">Show type</label>
          <select id="cs-type" className="input" value={form.showType} onChange={(e) => set("showType", e.target.value)}>
            <option value="MOVIE">Movie</option>
            <option value="EVENT">Event</option>
          </select>
        </div>

        {form.showType === "MOVIE" ? (
          <div className="field">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <label className="field-label" htmlFor="cs-movie" style={{ margin: 0 }}>
                Movie
                <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "var(--ev-text-subtle)", fontWeight: 400 }}>
                  ({movies.length} available)
                </span>
              </label>
              <button
                type="button"
                className="btn btn--ghost btn--xs"
                onClick={() => setShowNewMovie((v) => !v)}
                style={{ fontSize: "0.8125rem" }}
              >
                {showNewMovie ? "Choose existing" : "+ Add new movie"}
              </button>
            </div>

            {showNewMovie ? (
              <div style={{ padding: "0.875rem", background: "var(--ev-surface-raised, var(--ev-surface))", border: "1px solid var(--ev-border)", borderRadius: "var(--ev-radius-control)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Create and select new movie</div>
                <input
                  className="input"
                  placeholder="Movie title (e.g. Oppenheimer)"
                  value={newMovie.title}
                  onChange={(e) => setNewMovie((m) => ({ ...m, title: e.target.value }))}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <input
                    className="input"
                    placeholder="Genre (e.g. Sci-Fi)"
                    value={newMovie.genre}
                    onChange={(e) => setNewMovie((m) => ({ ...m, genre: e.target.value }))}
                  />
                  <input
                    className="input"
                    placeholder="Language (e.g. English)"
                    value={newMovie.language}
                    onChange={(e) => setNewMovie((m) => ({ ...m, language: e.target.value }))}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <input
                    className="input"
                    type="number"
                    placeholder="Duration (minutes)"
                    value={newMovie.durationMinutes}
                    onChange={(e) => setNewMovie((m) => ({ ...m, durationMinutes: Number(e.target.value) }))}
                  />
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    placeholder="Rating (e.g. 8.8)"
                    value={newMovie.rating}
                    onChange={(e) => setNewMovie((m) => ({ ...m, rating: Number(e.target.value) }))}
                  />
                </div>
                <button
                  type="button"
                  className={`btn btn--primary btn--sm${addMovie.isPending ? " btn--loading" : ""}`}
                  disabled={!newMovie.title.trim() || addMovie.isPending}
                  onClick={() => addMovie.mutate()}
                >
                  {addMovie.isPending ? "" : "Save & select movie"}
                </button>
              </div>
            ) : movies.length > 0 ? (
              <select id="cs-movie" className="input" value={form.movieId} onChange={(e) => set("movieId", Number(e.target.value))}>
                {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            ) : (
              <div className="info-banner" style={{ padding: "0.75rem 1rem" }}>
                <AlertTriangle size={15} style={{ color: "var(--ev-warning)", flexShrink: 0 }} />
                <span>No movies in catalogue yet — click "+ Add new movie" above to create one.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="field">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <label className="field-label" htmlFor="cs-event" style={{ margin: 0 }}>
                Event
                <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "var(--ev-text-subtle)", fontWeight: 400 }}>
                  ({events.length} available)
                </span>
              </label>
              <button
                type="button"
                className="btn btn--ghost btn--xs"
                onClick={() => setShowNewEvent((v) => !v)}
                style={{ fontSize: "0.8125rem" }}
              >
                {showNewEvent ? "Choose existing" : "+ Add new event"}
              </button>
            </div>

            {showNewEvent ? (
              <div style={{ padding: "0.875rem", background: "var(--ev-surface-raised, var(--ev-surface))", border: "1px solid var(--ev-border)", borderRadius: "var(--ev-radius-control)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Create and select new event</div>
                <input
                  className="input"
                  placeholder="Event name (e.g. Coldplay Live)"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent((ev) => ({ ...ev, name: e.target.value }))}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <input
                    className="input"
                    placeholder="Category (e.g. Music, Comedy)"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent((ev) => ({ ...ev, category: e.target.value }))}
                  />
                  <input
                    className="input"
                    placeholder="Description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent((ev) => ({ ...ev, description: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  className={`btn btn--primary btn--sm${addEvent.isPending ? " btn--loading" : ""}`}
                  disabled={!newEvent.name.trim() || addEvent.isPending}
                  onClick={() => addEvent.mutate()}
                >
                  {addEvent.isPending ? "" : "Save & select event"}
                </button>
              </div>
            ) : events.length > 0 ? (
              <select id="cs-event" className="input" value={form.eventId} onChange={(e) => set("eventId", Number(e.target.value))}>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            ) : (
              <div className="info-banner" style={{ padding: "0.75rem 1rem" }}>
                <AlertTriangle size={15} style={{ color: "var(--ev-warning)", flexShrink: 0 }} />
                <span>No events in catalogue yet — click "+ Add new event" above to create one.</span>
              </div>
            )}
          </div>
        )}

        <div className="field">
          <label className="field-label" htmlFor="cs-datetime">Date &amp; time</label>
          <input id="cs-datetime" type="datetime-local" className="input" value={form.showDateTime} onChange={(e) => set("showDateTime", e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="cs-thumbnail">Thumbnail image URL <span className="text-muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <input id="cs-thumbnail" type="url" className="input" placeholder="https://example.com/show-image.jpg" value={form.thumbnailUrl} onChange={(e) => set("thumbnailUrl", e.target.value)} />
        </div>


        <div className="field">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <label className="field-label" htmlFor="cs-venue" style={{ margin: 0 }}>
              Venue
              {venues.length > 0 && (
                <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "var(--ev-text-subtle)", fontWeight: 400 }}>
                  ({venues.length} available)
                </span>
              )}
            </label>
            <button
              type="button"
              className="btn btn--ghost btn--xs"
              onClick={() => setShowNewVenue((v) => !v)}
              style={{ fontSize: "0.8125rem" }}
            >
              {showNewVenue ? "Choose existing" : "+ Add new venue"}
            </button>
          </div>

          {showNewVenue ? (
            <div style={{ padding: "0.875rem", background: "var(--ev-surface-raised, var(--ev-surface))", border: "1px solid var(--ev-border)", borderRadius: "var(--ev-radius-control)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Create and select new venue</div>
              <input
                className="input"
                placeholder="Venue name (e.g. IMAX Cinema)"
                value={newVenue.name}
                onChange={(e) => setNewVenue((v) => ({ ...v, name: e.target.value }))}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input
                  className="input"
                  placeholder="City (e.g. Mumbai)"
                  value={newVenue.city}
                  onChange={(e) => setNewVenue((v) => ({ ...v, city: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Address (e.g. High Street)"
                  value={newVenue.address}
                  onChange={(e) => setNewVenue((v) => ({ ...v, address: e.target.value }))}
                />
              </div>
              <button
                type="button"
                className={`btn btn--primary btn--sm${addVenue.isPending ? " btn--loading" : ""}`}
                disabled={!newVenue.name.trim() || addVenue.isPending}
                onClick={() => addVenue.mutate()}
              >
                {addVenue.isPending ? "" : "Save & select venue"}
              </button>
            </div>
          ) : venues.length > 0 ? (
            <select id="cs-venue" className="input" value={form.venueId} onChange={(e) => set("venueId", Number(e.target.value))}>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}{v.city ? ` (${v.city})` : ""}</option>)}
            </select>
          ) : (
            <input id="cs-venue" type="number" min={1} className="input" placeholder="Venue ID" value={form.venueId} onChange={(e) => set("venueId", Number(e.target.value))} />
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="field">
            <label className="field-label" htmlFor="cs-seats">Total seats</label>
            <input id="cs-seats" type="number" min={1} max={10000} className="input" value={form.totalSeats} onChange={(e) => set("totalSeats", e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="cs-price">Price (₹)</label>
            <input id="cs-price" type="number" min={0} step={10} className="input" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="modal__footer" style={{ marginTop: "1.5rem" }}>
        <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
        <button
          className={`btn btn--primary btn-shine${create.isPending ? " btn--loading" : ""}`}
          onClick={() => create.mutate()}
          disabled={create.isPending || !canSubmit}
        >
          {create.isPending ? "" : editingShow ? "Save changes" : "Create show"}
        </button>
      </div>
    </AdminModal>
  );
}

/* ── Create movie modal ────────────────────────────────────────────────── */
function CreateMovieModal({ onClose }: { onClose: () => void }) {
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    genre: "Drama",
    language: "English",
    durationMinutes: 120,
    rating: 8.0,
    description: "",
  });

  const create = useMutation({
    mutationFn: () => api.createMovie({ ...form, posterUrl: null }),
    onSuccess: (m) => {
      void qc.invalidateQueries({ queryKey: ["movies"] });
      toast("success", "Movie added", `${m.title} is now in the catalogue.`);
      onClose();
    },
    onError: (err) => toast("error", "Creation failed", (err as ApiError)?.message ?? "Please try again."),
  });

  return (
    <AdminModal open title="Add movie" onClose={onClose} width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="field">
          <label className="field-label" htmlFor="cm-title">Title</label>
          <input id="cm-title" className="input" placeholder="Movie title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className="field">
            <label className="field-label" htmlFor="cm-genre">Genre</label>
            <input id="cm-genre" className="input" placeholder="e.g. Action" value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="cm-lang">Language</label>
            <input id="cm-lang" className="input" placeholder="e.g. English" value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className="field">
            <label className="field-label" htmlFor="cm-dur">Duration (min)</label>
            <input id="cm-dur" type="number" min={1} className="input" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="cm-rate">Rating (0 - 10)</label>
            <input id="cm-rate" type="number" step="0.1" min={0} max={10} className="input" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))} />
          </div>
        </div>
      </div>
      <div className="modal__footer" style={{ marginTop: "1.5rem" }}>
        <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
        <button className={`btn btn--primary btn-shine${create.isPending ? " btn--loading" : ""}`} disabled={!form.title.trim() || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? "" : "Add movie"}
        </button>
      </div>
    </AdminModal>
  );
}

/* ── Create event modal ────────────────────────────────────────────────── */
function CreateEventModal({ onClose }: { onClose: () => void }) {
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    category: "Music",
    description: "",
  });

  const create = useMutation({
    mutationFn: () => api.createEvent({ ...form, bannerUrl: null }),
    onSuccess: (e) => {
      void qc.invalidateQueries({ queryKey: ["events"] });
      toast("success", "Event added", `${e.name} is now in the catalogue.`);
      onClose();
    },
    onError: (err) => toast("error", "Creation failed", (err as ApiError)?.message ?? "Please try again."),
  });

  return (
    <AdminModal open title="Add event" onClose={onClose} width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="field">
          <label className="field-label" htmlFor="ce-name">Event name</label>
          <input id="ce-name" className="input" placeholder="e.g. Coldplay Live" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ce-cat">Category</label>
          <input id="ce-cat" className="input" placeholder="e.g. Music, Comedy" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ce-desc">Description</label>
          <input id="ce-desc" className="input" placeholder="Short description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
      </div>
      <div className="modal__footer" style={{ marginTop: "1.5rem" }}>
        <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
        <button className={`btn btn--primary btn-shine${create.isPending ? " btn--loading" : ""}`} disabled={!form.name.trim() || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? "" : "Add event"}
        </button>
      </div>
    </AdminModal>
  );
}

/* ── Create venue modal ────────────────────────────────────────────────── */
function CreateVenueModal({ onClose }: { onClose: () => void }) {
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    city: "Mumbai",
    address: "",
  });

  const create = useMutation({
    mutationFn: () => api.createVenue(form),
    onSuccess: (v) => {
      void qc.invalidateQueries({ queryKey: ["venues"] });
      toast("success", "Venue added", `${v.name} is now in the catalogue.`);
      onClose();
    },
    onError: (err) => toast("error", "Creation failed", (err as ApiError)?.message ?? "Please try again."),
  });

  return (
    <AdminModal open title="Add venue" onClose={onClose} width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="field">
          <label className="field-label" htmlFor="cv-name">Venue name</label>
          <input id="cv-name" className="input" placeholder="e.g. IMAX Mumbai" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className="field">
            <label className="field-label" htmlFor="cv-city">City</label>
            <input id="cv-city" className="input" placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="cv-addr">Address</label>
            <input id="cv-addr" className="input" placeholder="Address / Location" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
        </div>
      </div>
      <div className="modal__footer" style={{ marginTop: "1.5rem" }}>
        <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
        <button className={`btn btn--primary btn-shine${create.isPending ? " btn--loading" : ""}`} disabled={!form.name.trim() || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? "" : "Add venue"}
        </button>
      </div>
    </AdminModal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN
   ══════════════════════════════════════════════════════════════════════════ */
export function AdminPage() {
  useDocumentMeta("Admin studio — Eventix", "Eventix operations dashboard.");
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [createMovieOpen, setCreateMovieOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createVenueOpen, setCreateVenueOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Show | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Show | null>(null);

  const { data: shows = [], isLoading: showsLoading, isError: showsError, refetch: refetchShows } = useQuery({ queryKey: ["shows"], queryFn: api.shows, staleTime: 0, refetchInterval: 15_000, refetchOnWindowFocus: true });
  const { data: movies = [], refetch: refetchMovies } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [], refetch: refetchEvents } = useQuery({ queryKey: ["events"], queryFn: api.events });
  const { data: venues = [], refetch: refetchVenues } = useQuery({ queryKey: ["venues"], queryFn: api.venues });

  /* Audit note: the backend has no admin-wide bookings endpoint yet — this
     query returns YOUR OWN bookings. It degrades gracefully below. */
  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    isError: bookingsError,
  } = useQuery({ queryKey: ["bookings"], queryFn: api.bookings, retry: 0 });

  const deleteShow = useMutation({
    mutationFn: (id: number) => api.deleteShow(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["shows"] });
      toast("success", "Show deleted", "The show has been removed.");
      setDeleteTarget(null);
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast("error", "Delete failed", apiErr?.message ?? "Unable to delete this show.");
      setDeleteTarget(null);
    },
  });

  const deleteMovie = useMutation({
    mutationFn: (id: number) => api.deleteMovie(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["movies"] });
      toast("success", "Movie deleted", "Movie removed from catalogue.");
    },
    onError: (err) => toast("error", "Failed to delete movie", (err as ApiError)?.message ?? "Cannot delete movie."),
  });

  const deleteEvent = useMutation({
    mutationFn: (id: number) => api.deleteEvent(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["events"] });
      toast("success", "Event deleted", "Event removed from catalogue.");
    },
    onError: (err) => toast("error", "Failed to delete event", (err as ApiError)?.message ?? "Cannot delete event."),
  });

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const totalRevenue = confirmed.reduce((s, b) => s + b.totalAmount, 0);
  const movieShows = shows.filter((s) => s.showType === "MOVIE");
  const eventShows = shows.filter((s) => s.showType === "EVENT");
  const activeShows = shows.filter((s) => new Date(s.showDateTime) > new Date());

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart2 size={17} /> },
    { key: "shows", label: "Shows", icon: <Ticket size={17} /> },
    { key: "movies", label: "Movies", icon: <Film size={17} /> },
    { key: "events", label: "Events", icon: <Sparkles size={17} /> },
    { key: "venues", label: "Venues", icon: <MapPin size={17} /> },
    { key: "bookings", label: "Bookings", icon: <Users size={17} /> },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar__label">Admin studio</div>
        {navItems.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`admin-nav-item${tab === key ? " admin-nav-item--active" : ""}`}
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
          >
            {icon} {label}
          </button>
        ))}
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* ─── OVERVIEW ─── */}
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "1.75rem" }}>Dashboard</h1>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
              <StatCard label="Total shows" value={shows.length} sub={`${activeShows.length} upcoming`} icon={<Ticket size={20} />} accent />
              <StatCard label="Movies / Events" value={`${movieShows.length}/${eventShows.length}`} sub="On the marquee" icon={<Film size={20} />} />
              <StatCard
                label="Bookings (yours)"
                value={bookingsError ? "—" : bookings.length}
                sub={bookingsError ? "Live data unavailable" : `${confirmed.length} confirmed`}
                icon={<Users size={20} />}
              />
              <StatCard label="Revenue" value={bookingsError ? "—" : money(totalRevenue)} sub="Confirmed bookings" icon={<DollarSign size={20} />} />
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 className="font-display" style={{ fontSize: "1.375rem" }}>Recent bookings</h2>
                <button className="btn btn--ghost btn--sm" onClick={() => setTab("bookings")}>
                  View all <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
              {bookingsLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "var(--ev-radius-card)" }} />)}
                </div>
              ) : bookingsError ? (
                <div className="info-banner" role="status">
                  <AlertTriangle size={16} style={{ color: "var(--ev-warning)", flexShrink: 0 }} aria-hidden="true" />
                  <span>The admin bookings feed is still a backend gap — figures above reflect only this account.</span>
                </div>
              ) : bookings.length === 0 ? (
                <div className="empty-state" style={{ padding: "2rem" }}>
                  <Inbox className="empty-state__icon" />
                  <div className="empty-state__title" style={{ fontSize: "1rem" }}>No bookings yet</div>
                </div>
              ) : (
                <BookingsTable bookings={bookings.slice(0, 8)} />
              )}
            </div>
          </motion.div>
        )}

        {/* ─── SHOWS ─── */}
        {tab === "shows" && (
          <motion.div key="shows" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 className="font-display" style={{ fontSize: "2rem" }}>Shows</h1>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{shows.length} on the marquee</p>
              </div>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button className="btn btn--secondary btn--sm" onClick={() => void refetchShows()}>
                  <RefreshCw size={14} aria-hidden="true" /> Refresh
                </button>
                <button className="btn btn--primary btn--sm btn-shine" onClick={() => setCreateOpen(true)}>
                  <Plus size={14} aria-hidden="true" /> New show
                </button>
              </div>
            </div>

            {showsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: "56px", borderRadius: "var(--ev-radius-card)" }} />)}
              </div>
            ) : showsError ? (
              <div className="error-state">
                <AlertTriangle className="error-state__icon" style={{ color: "var(--ev-warning)" }} />
                <div className="error-state__title">Catalogue won't load</div>
                <button className="btn btn--primary" onClick={() => void refetchShows()}>
                  <RefreshCw size={16} /> Retry
                </button>
              </div>
            ) : shows.length === 0 ? (
              <div className="empty-state">
                <Ticket className="empty-state__icon" />
                <div className="empty-state__title">No shows yet</div>
                <p className="empty-state__desc">Create the first show and the box office opens.</p>
                <button className="btn btn--primary" onClick={() => setCreateOpen(true)}>
                  <Plus size={16} aria-hidden="true" /> New show
                </button>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Show</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Price</th>
                      <th>Seats</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shows.map((show) => (
                      <ShowRow key={show.id} show={show} onEdit={setEditTarget} onDelete={setDeleteTarget} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── MOVIES ─── */}
        {tab === "movies" && (
          <motion.div key="movies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 className="font-display" style={{ fontSize: "2rem" }}>Movies</h1>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{movies.length} title{movies.length !== 1 ? "s" : ""} in catalogue</p>
              </div>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button className="btn btn--secondary btn--sm" onClick={() => void refetchMovies()}>
                  <RefreshCw size={14} aria-hidden="true" /> Refresh
                </button>
                <button className="btn btn--primary btn--sm btn-shine" onClick={() => setCreateMovieOpen(true)}>
                  <Plus size={14} aria-hidden="true" /> New movie
                </button>
              </div>
            </div>

            {movies.length === 0 ? (
              <div className="empty-state">
                <Film className="empty-state__icon" />
                <div className="empty-state__title">No movies in catalogue</div>
                <button className="btn btn--primary" onClick={() => setCreateMovieOpen(true)}>
                  <Plus size={16} /> Add movie
                </button>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Genre</th>
                      <th>Language</th>
                      <th>Duration</th>
                      <th>Rating</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.title}</div>
                        </td>
                        <td><span className="badge badge--accent">{m.genre || "Drama"}</span></td>
                        <td>{m.language || "English"}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{m.durationMinutes} mins</td>
                        <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--ev-gold)" }}>★ {m.rating ?? "—"}</td>
                        <td>
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                              className="btn btn--ghost btn--icon btn--sm"
                              onClick={() => deleteMovie.mutate(m.id)}
                              title={`Delete ${m.title}`}
                              style={{ color: "var(--ev-danger)" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── EVENTS ─── */}
        {tab === "events" && (
          <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 className="font-display" style={{ fontSize: "2rem" }}>Events</h1>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{events.length} event{events.length !== 1 ? "s" : ""} in catalogue</p>
              </div>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button className="btn btn--secondary btn--sm" onClick={() => void refetchEvents()}>
                  <RefreshCw size={14} aria-hidden="true" /> Refresh
                </button>
                <button className="btn btn--primary btn--sm btn-shine" onClick={() => setCreateEventOpen(true)}>
                  <Plus size={14} aria-hidden="true" /> New event
                </button>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="empty-state">
                <Sparkles className="empty-state__icon" />
                <div className="empty-state__title">No events in catalogue</div>
                <button className="btn btn--primary" onClick={() => setCreateEventOpen(true)}>
                  <Plus size={16} /> Add event
                </button>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 600 }}>{e.name}</td>
                        <td><span className="badge badge--pink">{e.category || "Live"}</span></td>
                        <td style={{ fontSize: "0.875rem", color: "var(--ev-text-muted)" }}>{e.description || "—"}</td>
                        <td>
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                              className="btn btn--ghost btn--icon btn--sm"
                              onClick={() => deleteEvent.mutate(e.id)}
                              title={`Delete ${e.name}`}
                              style={{ color: "var(--ev-danger)" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── VENUES ─── */}
        {tab === "venues" && (
          <motion.div key="venues" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 className="font-display" style={{ fontSize: "2rem" }}>Venues</h1>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{venues.length} venue{venues.length !== 1 ? "s" : ""} in catalogue</p>
              </div>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button className="btn btn--secondary btn--sm" onClick={() => void refetchVenues()}>
                  <RefreshCw size={14} aria-hidden="true" /> Refresh
                </button>
                <button className="btn btn--primary btn--sm btn-shine" onClick={() => setCreateVenueOpen(true)}>
                  <Plus size={14} aria-hidden="true" /> New venue
                </button>
              </div>
            </div>

            {venues.length === 0 ? (
              <div className="empty-state">
                <MapPin className="empty-state__icon" />
                <div className="empty-state__title">No venues in catalogue</div>
                <button className="btn btn--primary" onClick={() => setCreateVenueOpen(true)}>
                  <Plus size={16} /> Add venue
                </button>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>City</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>{v.name}</td>
                        <td><span className="badge badge--neutral">{v.city || "—"}</span></td>
                        <td style={{ fontSize: "0.875rem", color: "var(--ev-text-muted)" }}>{v.address || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── BOOKINGS ─── */}
        {tab === "bookings" && (
          <motion.div key="bookings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "0.375rem" }}>Bookings</h1>
            <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1.75rem" }}>
              Backend note: the API currently returns this account's bookings — an admin-wide feed is on the roadmap.
            </p>
            {bookingsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: "56px", borderRadius: "var(--ev-radius-card)" }} />)}
              </div>
            ) : bookingsError ? (
              <div className="error-state">
                <AlertTriangle className="error-state__icon" style={{ color: "var(--ev-warning)" }} />
                <div className="error-state__title">Bookings feed unavailable</div>
                <p className="error-state__desc">The API didn't respond. Try again shortly.</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <Inbox className="empty-state__icon" />
                <div className="empty-state__title">No bookings yet</div>
              </div>
            ) : (
              <BookingsTable bookings={bookings} />
            )}
          </motion.div>
        )}
      </main>

      {/* Create modal */}
      {(createOpen || editTarget !== null) && (
        <CreateShowModal
          key={editTarget?.id ?? "create"}
          movies={movies}
          events={events}
          venues={venues}
          editingShow={editTarget ?? undefined}
          onClose={() => { setCreateOpen(false); setEditTarget(null); }}
        />
      )}

      {createMovieOpen && (
        <CreateMovieModal onClose={() => setCreateMovieOpen(false)} />
      )}

      {createEventOpen && (
        <CreateEventModal onClose={() => setCreateEventOpen(false)} />
      )}

      {createVenueOpen && (
        <CreateVenueModal onClose={() => setCreateVenueOpen(false)} />
      )}

      {/* Delete confirm — styled, focus-trapped, Escape-aware */}
      <AdminModal open={deleteTarget !== null} title="Delete this show?" onClose={() => setDeleteTarget(null)} width={440}>
        {deleteTarget && (
          <>
            <div className="modal__body" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <AlertTriangle size={20} style={{ color: "var(--ev-danger)", flexShrink: 0, marginTop: "0.125rem" }} aria-hidden="true" />
                <div>
                  <strong>{deleteTarget.title}</strong> on {dateOnly(deleteTarget.showDateTime)} will be removed
                  from the catalogue. This can't be undone.
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteTarget(null)}>Keep show</button>
              <button
                className={`btn btn--destructive${deleteShow.isPending ? " btn--loading" : ""}`}
                onClick={() => deleteTarget && deleteShow.mutate(deleteTarget.id)}
                disabled={deleteShow.isPending}
              >
                {deleteShow.isPending ? "" : "Delete show"}
              </button>
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}
