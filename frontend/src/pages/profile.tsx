import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Ticket, CalendarDays, User, Mail, ShieldCheck, Sparkles, AlertTriangle, RefreshCw,
} from "lucide-react";
import { api } from "../api/eventix";
import { useAuth } from "../context/auth-context";
import { money, dateOnly } from "../lib/utils";
import { CountUp, Reveal } from "../components/motion-kit";

export function ProfilePage() {
  const { user } = useAuth();

  const { data: bookings = [], isLoading, error, refetch } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.bookings,
  });

  if (!user) return null;

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const totalSpent = confirmed.reduce((s, b) => s + b.totalAmount, 0);
  const upcoming = confirmed
    .filter((b) => new Date(b.showDateTime) > new Date())
    .sort((a, b) => new Date(a.showDateTime).getTime() - new Date(b.showDateTime).getTime());

  const stats = [
    { label: "Bookings", value: bookings.length, isMoney: false },
    { label: "Confirmed", value: confirmed.length, isMoney: false },
    { label: "Upcoming", value: upcoming.length, isMoney: false },
    { label: "Total spent", value: totalSpent, isMoney: true },
  ];

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 880 }}>
        {/* Profile header */}
        <Reveal style={{ marginBottom: "2.25rem" }}>
          <div className="profile-header">
            <motion.div
              className="profile-avatar"
              aria-label={`Avatar for ${user.name}`}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
              style={{
                background: "linear-gradient(135deg, var(--ev-accent), #4A151D)",
                boxShadow: "0 12px 32px var(--ev-glow-accent)",
                fontFamily: "var(--ev-font-display)",
                fontSize: "1.75rem",
              }}
            >
              {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </motion.div>
            <div style={{ flex: 1 }}>
              <h1 className="font-display" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: 1.05 }}>{user.name}</h1>
              <div className="profile-email">{user.email}</div>
              <div style={{ marginTop: "0.625rem" }}>
                <span className={`badge ${user.role === "ADMIN" ? "badge--accent" : "badge--neutral"}`}>
                  {user.role === "ADMIN" && <ShieldCheck size={11} aria-hidden="true" />} {user.role}
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Stats */}
        <Reveal delay={0.06} style={{ marginBottom: "2rem" }}>
          <div className="profile-stat-grid">
            {stats.map(({ label, value, isMoney }) => (
              <motion.div
                key={label}
                className="profile-stat gold-top"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <div className="profile-stat__val">
                  {isMoney && <span style={{ fontSize: "1rem", color: "var(--ev-text-subtle)", fontWeight: 500 }}>₹</span>}
                  {isLoading ? "—" : isMoney ? <CountUp to={value} /> : <CountUp to={value} />}
                </div>
                <div className="profile-stat__label">{label}</div>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {error ? (
          <div className="error-state">
            <AlertTriangle className="error-state__icon" style={{ color: "var(--ev-warning)" }} />
            <div className="error-state__title">Couldn't load your activity</div>
            <p className="error-state__desc">Your account details are fine — the bookings list just won't load right now.</p>
            <button className="btn btn--primary" onClick={() => void refetch()}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* Account details */}
            <Reveal delay={0.1}>
              <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
                <h2 className="font-display" style={{ fontSize: "1.375rem", marginBottom: "1.25rem" }}>Account details</h2>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <User size={16} style={{ color: "var(--ev-text-subtle)", flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--ev-text-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.125rem" }}>Full name</div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{user.name}</div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "var(--ev-border)" }} />
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <Mail size={16} style={{ color: "var(--ev-text-subtle)", flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--ev-text-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.125rem" }}>Email</div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "var(--ev-border)" }} />
                  <p className="kbd-hint">
                    <Sparkles size={12} aria-hidden="true" /> Profile editing arrives with the next release — for now your details are managed by the box office.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Upcoming */}
            {!isLoading && upcoming.length > 0 && (
              <Reveal delay={0.12}>
                <section style={{ marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <h2 className="font-display" style={{ fontSize: "1.5rem" }}>Next up for you</h2>
                    <Link to="/bookings" className="btn btn--ghost btn--sm">All bookings →</Link>
                  </div>
                  <div className="grid--list">
                    {upcoming.slice(0, 3).map((b) => (
                      <Link key={b.id} to={`/confirmation/${b.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <div className="booking-v2 booking-v2--confirmed">
                          <div>
                            <div className="font-display" style={{ fontSize: "1.375rem", lineHeight: 1.15 }}>{b.showTitle}</div>
                            <div className="booking-card__meta" style={{ marginTop: "0.5rem" }}>
                              <span className="booking-card__meta-item">
                                <CalendarDays size={13} aria-hidden="true" /> {dateOnly(b.showDateTime)}
                              </span>
                              <span className="booking-card__meta-item">{b.venueName}</span>
                            </div>
                          </div>
                          <div className="booking-card__side">
                            <span className="booking-card__amount">{money(b.totalAmount)}</span>
                            <span className="status-badge status-badge--confirmed">{b.status}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </Reveal>
            )}

            {/* Empty */}
            {!isLoading && bookings.length === 0 && (
              <div className="empty-state">
                <Ticket className="empty-state__icon" />
                <div className="empty-state__title">Your season starts here</div>
                <p className="empty-state__desc">Book your first show — your stats and tickets will live here.</p>
                <Link to="/shows" className="btn btn--primary btn-shine">Browse shows</Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
