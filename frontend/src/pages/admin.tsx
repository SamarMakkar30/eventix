import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  BarChart2, Ticket, Film, Plus, Trash2, Edit3, RefreshCw,
  Users, DollarSign, ChevronRight,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateOnly, initials } from "../lib/utils";
import { useToast } from "../context/toast-context";
import type { Show, Movie, Event, Venue } from "../types/api";

/* ───── Types ───── */
type Tab = "overview" | "shows" | "bookings";

/* ───── Stat card ───── */
function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
      <div style={{
        width: 44, height: 44, borderRadius: "var(--ev-radius-card)", flexShrink: 0,
        background: accent ? "var(--ev-accent)" : "var(--ev-pale-pink)",
        color: accent ? "var(--ev-accent-ink)" : "var(--ev-text)",
        display: "grid", placeItems: "center",
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.75rem", color: "var(--ev-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>{label}</div>
        <div style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
        {sub && <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-muted)", marginTop: "0.125rem" }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ───── Show row ───── */
function ShowRow({ show, onDelete }: { show: Show; onDelete: (id: number) => void }) {
  const isPast = new Date(show.showDateTime) < new Date();
  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600 }}>{show.title}</div>
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
      <td style={{ fontVariantNumeric: "tabular-nums" }}>{show.totalSeats}</td>
      <td>
        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
          <button className="btn btn--ghost btn--icon btn--sm" title="Edit (coming soon)" disabled>
            <Edit3 size={14} />
          </button>
          <button
            className="btn btn--ghost btn--icon btn--sm"
            onClick={() => onDelete(show.id)}
            title="Delete show"
            style={{ color: "var(--ev-danger)" }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ───── Create show modal ───── */
function CreateShowModal({ movies, events, venues, onClose }: {
  movies: Movie[]; events: Event[]; venues: Venue[]; onClose: () => void;
}) {
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    showType: "MOVIE",
    movieId: movies[0]?.id ?? 0,
    eventId: events[0]?.id ?? 0,
    venueId: venues[0]?.id ?? 1,
    showDateTime: "",
    totalSeats: 100,
    price: 250,
  });

  const create = useMutation({
    mutationFn: () => api.createShow({
      showType: form.showType as "MOVIE" | "EVENT",
      movieId: form.showType === "MOVIE" ? form.movieId : null,
      eventId: form.showType === "EVENT" ? form.eventId : null,
      venueId: Number(form.venueId),
      showDateTime: new Date(form.showDateTime).toISOString(),
      totalSeats: Number(form.totalSeats),
      price: Number(form.price),
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["shows"] });
      toast("success", "Show created!", "The new show is live.");
      onClose();
    },
    onError: () => toast("error", "Creation failed", "Please check the form and try again."),
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <motion.div
        className="modal"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        style={{ maxWidth: 540 }}
      >
        <div className="modal__header">
          <div className="modal__title">Create show</div>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
          {/* Type */}
          <div className="field">
            <label className="field-label" htmlFor="cs-type">Show type</label>
            <select id="cs-type" className="input" value={form.showType} onChange={(e) => set("showType", e.target.value)}>
              <option value="MOVIE">Movie</option>
              <option value="EVENT">Event</option>
            </select>
          </div>

          {/* Movie / Event select */}
          {form.showType === "MOVIE" ? (
            <div className="field">
              <label className="field-label" htmlFor="cs-movie">Movie</label>
              <select id="cs-movie" className="input" value={form.movieId} onChange={(e) => set("movieId", Number(e.target.value))}>
                {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
          ) : (
            <div className="field">
              <label className="field-label" htmlFor="cs-event">Event</label>
              <select id="cs-event" className="input" value={form.eventId} onChange={(e) => set("eventId", Number(e.target.value))}>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          )}

          {/* Date time */}
          <div className="field">
            <label className="field-label" htmlFor="cs-datetime">Date & time</label>
            <input id="cs-datetime" type="datetime-local" className="input" value={form.showDateTime} onChange={(e) => set("showDateTime", e.target.value)} />
          </div>

          {/* Venue select */}
          <div className="field">
            <label className="field-label" htmlFor="cs-venue">Venue</label>
            {venues.length > 0 ? (
              <select id="cs-venue" className="input" value={form.venueId} onChange={(e) => set("venueId", Number(e.target.value))}>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}{v.city ? ` (${v.city})` : ""}</option>)}
              </select>
            ) : (
              <input id="cs-venue" type="number" min={1} className="input" placeholder="Venue ID" value={form.venueId} onChange={(e) => set("venueId", Number(e.target.value))} />
            )}
          </div>

          {/* Seats + Price */}
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
            className={`btn btn--primary${create.isPending ? " btn--loading" : ""}`}
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.venueId || !form.showDateTime}
          >
            {create.isPending ? "" : "Create show"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ───── Main admin page ───── */
export function AdminPage() {
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: shows = [], isLoading: showsLoading, refetch: refetchShows } = useQuery({ queryKey: ["shows"], queryFn: api.shows });
  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });
  const { data: venues = [] } = useQuery({ queryKey: ["venues"], queryFn: api.venues });
  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({ queryKey: ["admin-bookings"], queryFn: api.allBookings });

  const deleteShow = useMutation({
    mutationFn: (id: number) => api.deleteShow(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["shows"] });
      toast("success", "Show deleted", "The show has been removed.");
    },
    onError: () => toast("error", "Delete failed", "Unable to delete this show."),
  });

  // Overview stats
  const confirmed = allBookings.filter((b) => b.status === "CONFIRMED");
  const totalRevenue = confirmed.reduce((s, b) => s + b.totalAmount, 0);
  const movieShows = shows.filter((s) => s.showType === "MOVIE");
  const eventShows = shows.filter((s) => s.showType === "EVENT");
  const activeShows = shows.filter((s) => new Date(s.showDateTime) > new Date());

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart2 size={17} /> },
    { key: "shows", label: "Shows", icon: <Ticket size={17} /> },
    { key: "bookings", label: "Bookings", icon: <Users size={17} /> },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar__label">Admin</div>
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
          <motion.div
            key="overview"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
          >
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "1.75rem" }}>
              Dashboard overview
            </h1>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
              <StatCard label="Total shows" value={shows.length} sub={`${activeShows.length} active`} icon={<Ticket size={20} />} accent />
              <StatCard label="Total bookings" value={allBookings.length} sub={`${confirmed.length} confirmed`} icon={<Users size={20} />} />
              <StatCard label="Revenue" value={money(totalRevenue)} sub="Confirmed bookings" icon={<DollarSign size={20} />} />
              <StatCard label="Movies" value={movieShows.length} sub={`${eventShows.length} events`} icon={<Film size={20} />} />
            </div>

            {/* Recent bookings */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, letterSpacing: "-0.025em" }}>Recent bookings</h2>
                <button className="btn btn--ghost btn--sm" onClick={() => setTab("bookings")}>
                  View all <ChevronRight size={15} />
                </button>
              </div>
              {bookingsLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "var(--ev-radius-card)" }} />)}
                </div>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Show</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allBookings.slice(0, 8).map((b) => (
                        <tr key={b.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{b.showTitle}</div>
                            <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-muted)" }}>{b.quantity} ticket{b.quantity > 1 ? "s" : ""}</div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--ev-accent)", color: "var(--ev-accent-ink)", display: "grid", placeItems: "center", fontSize: "0.6875rem", fontWeight: 700, flexShrink: 0 }}>
                                {initials(b.userName ?? "U")}
                              </div>
                              <span style={{ fontSize: "0.9rem" }}>{b.userName ?? "—"}</span>
                            </div>
                          </td>
                          <td><span className={`status-badge status-badge--${b.status.toLowerCase()}`}>{b.status}</span></td>
                          <td style={{ fontSize: "0.875rem", color: "var(--ev-text-muted)" }}>{dateOnly(b.showDateTime)}</td>
                          <td style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{money(b.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── SHOWS ─── */}
        {tab === "shows" && (
          <motion.div
            key="shows"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.04em" }}>Shows</h1>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{shows.length} total</p>
              </div>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button className="btn btn--secondary btn--sm" onClick={() => void refetchShows()}>
                  <RefreshCw size={14} /> Refresh
                </button>
                <button className="btn btn--primary btn--sm" onClick={() => setShowCreateModal(true)}>
                  <Plus size={14} /> New show
                </button>
              </div>
            </div>

            {showsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "56px", borderRadius: "var(--ev-radius-card)" }} />)}
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
                      <ShowRow
                        key={show.id}
                        show={show}
                        onDelete={(id) => {
                          if (window.confirm(`Delete "${show.title}"? This cannot be undone.`)) {
                            deleteShow.mutate(id);
                          }
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── BOOKINGS ─── */}
        {tab === "bookings" && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
          >
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "1.75rem" }}>All bookings</h1>
            {bookingsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: "56px", borderRadius: "var(--ev-radius-card)" }} />)}
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Show</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="mono">{String(b.id).padStart(6, "0")}</td>
                        <td>
                          <div style={{ fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.showTitle}</div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-muted)" }}>{b.venueName}</div>
                        </td>
                        <td style={{ fontSize: "0.9rem" }}>{b.userName ?? "—"}</td>
                        <td>
                          <span className={`badge ${b.type === "MOVIE" ? "badge--accent" : "badge--pink"}`}>{b.type}</span>
                        </td>
                        <td><span className={`status-badge status-badge--${b.status.toLowerCase()}`}>{b.status}</span></td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{b.quantity}</td>
                        <td style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{money(b.totalAmount)}</td>
                        <td style={{ fontSize: "0.8125rem", color: "var(--ev-text-muted)", whiteSpace: "nowrap" }}>{dateOnly(b.showDateTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Create show modal */}
      {showCreateModal && (
        <CreateShowModal
          movies={movies}
          events={events}
          venues={venues}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
