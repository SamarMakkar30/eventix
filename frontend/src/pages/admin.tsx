import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart2, Ticket, Film, Plus, Trash2, RefreshCw,
  Users, DollarSign, ChevronRight, X, AlertTriangle, Inbox,
} from "lucide-react";
import { api } from "../api/eventix";
import { money, dateOnly } from "../lib/utils";
import { useToast } from "../context/toast-context";
import { overlayVariants, panelVariants } from "../components/motion-kit";
import { bookingRef } from "./confirmation";
import type { ApiError } from "../api/client";
import type { Show, Movie, Event, Venue, BookingStatus } from "../types/api";

type Tab = "overview" | "shows" | "bookings";

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
              <button className="modal__close" onClick={onClose} aria-label="Close dialog">
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
function ShowRow({ show, onDelete }: { show: Show; onDelete: (show: Show) => void }) {
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
      <td style={{ fontVariantNumeric: "tabular-nums" }}>{show.totalSeats.toLocaleString("en-IN")}</td>
      <td>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
      toast("success", "Show created", "The new show is live on the marquee.");
      onClose();
    },
    onError: (err) => toast("error", "Creation failed", (err as ApiError)?.message ?? "Please check the form and try again."),
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = !!(form.venueId && form.showDateTime && (form.showType === "MOVIE" ? form.movieId : form.eventId));

  return (
    <AdminModal open title="Create a show" onClose={onClose} width={540}>
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
            <label className="field-label" htmlFor="cs-movie">Movie</label>
            <select id="cs-movie" className="input" value={form.movieId} onChange={(e) => set("movieId", Number(e.target.value))}>
              {movies.length === 0 && <option value={0}>No movies available — add one in the catalogue first</option>}
              {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
        ) : (
          <div className="field">
            <label className="field-label" htmlFor="cs-event">Event</label>
            <select id="cs-event" className="input" value={form.eventId} onChange={(e) => set("eventId", Number(e.target.value))}>
              {events.length === 0 && <option value={0}>No events available — add one in the catalogue first</option>}
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        )}

        <div className="field">
          <label className="field-label" htmlFor="cs-datetime">Date &amp; time</label>
          <input id="cs-datetime" type="datetime-local" className="input" value={form.showDateTime} onChange={(e) => set("showDateTime", e.target.value)} />
        </div>

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
          {create.isPending ? "" : "Create show"}
        </button>
      </div>
    </AdminModal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN
   ══════════════════════════════════════════════════════════════════════════ */
export function AdminPage() {
  const { show: toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Show | null>(null);

  const { data: shows = [], isLoading: showsLoading, isError: showsError, refetch: refetchShows } = useQuery({ queryKey: ["shows"], queryFn: api.shows });
  const { data: movies = [] } = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });
  const { data: venues = [] } = useQuery({ queryKey: ["venues"], queryFn: api.venues });

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
      /* Real backends without a DELETE route answer 403/405 — say exactly that. */
      const apiErr = err as ApiError;
      const hint = apiErr?.status === 405 || apiErr?.status === 403
        ? "The catalogue service doesn't expose show deletion yet — remove it at the database or add the endpoint."
        : (apiErr?.message ?? "Unable to delete this show.");
      toast("error", "Delete unavailable", hint);
      setDeleteTarget(null);
    },
  });

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
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
                      <ShowRow key={show.id} show={show} onDelete={setDeleteTarget} />
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
      {createOpen && (
        <CreateShowModal
          movies={movies}
          events={events}
          venues={venues}
          onClose={() => setCreateOpen(false)}
        />
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
