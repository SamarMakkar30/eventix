import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Ticket, CalendarDays, User, Mail, Edit3 } from "lucide-react";
import { api } from "../api/eventix";
import { useAuth } from "../context/auth-context";
import { money, dateOnly, initials } from "../lib/utils";

export function ProfilePage() {
  const { user } = useAuth();

  const { data: bookings = [], isLoading } = useQuery({
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
    { label: "Total bookings", value: bookings.length },
    { label: "Confirmed", value: confirmed.length },
    { label: "Upcoming", value: upcoming.length },
    { label: "Total spent", value: money(totalSpent) },
  ];

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 860 }}>
        {/* Profile header */}
        <motion.div
          className="profile-header"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="profile-avatar" aria-label={`Avatar for ${user.name}`}>
            {initials(user.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div className="profile-name">{user.name}</div>
            <div className="profile-email">{user.email}</div>
            <div style={{ marginTop: "0.5rem" }}>
              <span className={`badge ${user.role === "ADMIN" ? "badge--accent" : "badge--neutral"}`}>
                {user.role ?? "USER"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Edit3 size={13} /> Profile editing coming soon
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="profile-stat-grid">
          {stats.map(({ label, value }, i) => (
            <motion.div
              key={label}
              className="profile-stat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <div className="profile-stat__val">{value}</div>
              <div className="profile-stat__label">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Account details card */}
        <motion.div
          className="card"
          style={{ padding: "1.5rem", marginBottom: "2rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>Account details</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <User size={16} style={{ color: "var(--ev-text-subtle)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--ev-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.125rem" }}>Full name</div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{user.name}</div>
              </div>
            </div>
            <div style={{ height: 1, background: "var(--ev-border)" }} />
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Mail size={16} style={{ color: "var(--ev-text-subtle)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--ev-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.125rem" }}>Email</div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{user.email}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Upcoming bookings */}
        {!isLoading && upcoming.length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.025em" }}>Upcoming shows</h2>
              <Link to="/bookings" className="btn btn--ghost btn--sm">See all →</Link>
            </div>
            <div className="grid--list">
              {upcoming.slice(0, 3).map((b) => (
                <Link key={b.id} to={`/confirmation/${b.id}`} style={{ textDecoration: "none" }}>
                  <div className="booking-card">
                    <div>
                      <div className="booking-card__title">{b.showTitle}</div>
                      <div className="booking-card__meta">
                        <span className="booking-card__meta-item">
                          <CalendarDays size={13} /> {dateOnly(b.showDateTime)}
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
        )}

        {/* Invite to browse if no bookings */}
        {!isLoading && bookings.length === 0 && (
          <div className="empty-state">
            <Ticket className="empty-state__icon" />
            <div className="empty-state__title">No bookings yet</div>
            <p className="empty-state__desc">Book your first show to see your activity here.</p>
            <Link to="/shows" className="btn btn--primary">Browse shows</Link>
          </div>
        )}
      </div>
    </div>
  );
}
