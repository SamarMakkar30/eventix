import { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Ticket, Sun, Moon, LogOut, User, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useToast } from "../context/toast-context";
import { initials } from "../lib/utils";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("eventix_theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("eventix_theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, toggle };
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

export function Layout() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    show("success", "Signed out", "See you again soon!");
    navigate("/");
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const navItems = [
    { to: "/", label: "Home", end: true },
    { to: "/shows", label: "Browse" },
  ];

  return (
    <>
      {/* ── SITE HEADER ── */}
      <header className={`site-header${scrolled ? " site-header--scrolled" : ""}`}>
        <nav className="nav-inner" aria-label="Main navigation">
          {/* Brand */}
          <Link to="/" className="brand" aria-label="Eventix home">
            <span className="brand-mark" aria-hidden="true">EX</span>
            Eventix
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links" role="list">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                role="listitem"
                className={({ isActive }) => isActive ? "active" : ""}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="nav-actions">
            {/* Theme toggle */}
            <button
              className="theme-toggle btn--icon"
              onClick={toggle}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            {isAuthenticated && user ? (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  className="nav-avatar"
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label={`Account menu for ${user.name}`}
                  title={user.name}
                >
                  {initials(user.name)}
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: "absolute", top: "calc(100% + 0.5rem)", right: 0,
                        background: "var(--ev-surface)", border: "1px solid var(--ev-border)",
                        borderRadius: "var(--ev-radius-card)", boxShadow: "var(--ev-shadow-elevated)",
                        minWidth: 200, zIndex: 60, overflow: "hidden",
                      }}
                      role="menu"
                    >
                      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--ev-border)" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--ev-text)" }}>{user.name}</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-muted)", marginTop: "0.125rem" }}>{user.email}</div>
                      </div>
                      <div style={{ padding: "0.375rem" }}>
                        <DropdownItem icon={<User size={15} />} label="Profile" to="/profile" onClick={() => setDropdownOpen(false)} />
                        <DropdownItem icon={<Ticket size={15} />} label="My Bookings" to="/bookings" onClick={() => setDropdownOpen(false)} />
                        {isAdmin && <DropdownItem icon={<ShieldCheck size={15} />} label="Admin Panel" to="/admin" onClick={() => setDropdownOpen(false)} />}
                        <div style={{ height: 1, background: "var(--ev-border)", margin: "0.375rem 0" }} />
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.625rem",
                            width: "100%", padding: "0.5rem 0.75rem", border: "none",
                            background: "none", borderRadius: "var(--ev-radius-control)",
                            fontSize: "0.9375rem", cursor: "pointer",
                            color: "var(--ev-danger)", transition: "background 0.15s",
                          }}
                          onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--ev-danger) 8%, transparent)"; }}
                          onFocus={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--ev-danger) 8%, transparent)"; }}
                          onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                          onBlur={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                        >
                          <LogOut size={15} /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm">Sign in</Link>
                <Link to="/register" className="btn btn--primary btn--sm">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span style={menuOpen ? { transform: "translateY(6.5px) rotate(45deg)" } : {}} />
            <span style={menuOpen ? { opacity: 0, transform: "scaleX(0)" } : {}} />
            <span style={menuOpen ? { transform: "translateY(-6.5px) rotate(-45deg)" } : {}} />
          </button>
        </nav>
      </header>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => isActive ? "active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            <div className="mobile-menu-divider" />
            {isAuthenticated ? (
              <>
                <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""} onClick={() => setMenuOpen(false)}>Profile</NavLink>
                <NavLink to="/bookings" className={({ isActive }) => isActive ? "active" : ""} onClick={() => setMenuOpen(false)}>My Bookings</NavLink>
                {isAdmin && <NavLink to="/admin" className={({ isActive }) => isActive ? "active" : ""} onClick={() => setMenuOpen(false)}>Admin</NavLink>}
                <div className="mobile-menu-divider" />
                <button
                  onClick={handleLogout}
                  style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "1rem 1.25rem", fontSize: "1.0625rem", fontWeight: 500, color: "var(--ev-danger)", background: "none", border: "none", borderRadius: "var(--ev-radius-card)", cursor: "pointer", width: "100%" }}
                >
                  <LogOut size={18} /> Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""} onClick={() => setMenuOpen(false)}>Sign in</NavLink>
                <NavLink to="/register" className={({ isActive }) => isActive ? "active" : ""} onClick={() => setMenuOpen(false)}>Get started</NavLink>
              </>
            )}
            <div className="mobile-menu-divider" />
            <button
              onClick={() => { toggle(); }}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", fontSize: "1.0625rem", fontWeight: 500, color: "var(--ev-text-muted)", background: "none", border: "none", borderRadius: "var(--ev-radius-card)", cursor: "pointer" }}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main id="main-content">
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className="site-footer" aria-label="Site footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="footer-brand-name">Eventix</Link>
            <p className="footer-brand-desc">The premium way to discover and book events and movies.</p>
          </div>
          <div className="footer-col">
            <h5>Discover</h5>
            <Link to="/shows">All Shows</Link>
            <Link to="/shows?type=MOVIE">Movies</Link>
            <Link to="/shows?type=EVENT">Events</Link>
          </div>
          <div className="footer-col">
            <h5>Account</h5>
            {isAuthenticated ? (
              <>
                <Link to="/bookings">My Bookings</Link>
                <Link to="/profile">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/login">Sign In</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <Link to="/shows">About</Link>
            <Link to="/shows">Contact</Link>
            <Link to="/shows">Privacy</Link>
            <Link to="/shows">Terms</Link>
          </div>
        </div>
        <div className="footer-inner">
          <div className="footer-bottom" style={{ gridColumn: "1 / -1" }}>
            <p className="footer-legal">© {new Date().getFullYear()} Eventix. All rights reserved.</p>
            <p className="footer-legal">Payments are simulated — no real transactions occur.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

// Dropdown menu item
function DropdownItem({ icon, label, to, onClick }: { icon: React.ReactNode; label: string; to: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "0.625rem",
        padding: "0.5rem 0.75rem", borderRadius: "var(--ev-radius-control)",
        fontSize: "0.9375rem", color: "var(--ev-text)", textDecoration: "none",
        transition: "background 0.15s",
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--ev-pink-wash)"; }}
      onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "none"; }}
    >
      <span style={{ color: "var(--ev-text-subtle)" }}>{icon}</span>
      {label}
    </Link>
  );
}

// Protected route guard
export function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true });
    }
  }, [isAuthenticated, isReady, navigate]);

  if (!isReady) return <RouteLoadingFallback />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}

// Admin-only route guard
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) navigate(`/login?next=/admin`, { replace: true });
    else if (!isAdmin) navigate("/", { replace: true });
  }, [isAuthenticated, isAdmin, isReady, navigate]);

  if (!isReady) return <RouteLoadingFallback />;
  if (!isAuthenticated || !isAdmin) return null;
  return <>{children}</>;
}

// Route loading skeleton
export function RouteLoadingFallback() {
  return (
    <div className="page container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="skeleton" style={{ height: "2rem", width: "40%", borderRadius: "var(--ev-radius-control)" }} />
      <div className="skeleton" style={{ height: "1rem", width: "70%", borderRadius: "var(--ev-radius-control)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.25rem", marginTop: "1rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton skeleton--card" style={{ aspectRatio: "2/3" }} />
        ))}
      </div>
    </div>
  );
}
