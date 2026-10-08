import { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { Ticket, Sun, Moon, LogOut, User, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useToast } from "../context/toast-context";
import { initials } from "../lib/utils";
import { startSmoothScroll, stopSmoothScroll, scrollToTop, scrollToAnchor } from "../lib/smooth-scroll";
import { CookieConsent } from "./cookie-consent";

/* ── Theme ────────────────────────────────────────────────────────────── */
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

/* ── Scrolled state (for header glass) ────────────────────────────────── */
function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

/* ── Lenis buttery smooth scroll (desktop pointers only) ──────────────── */
function SmoothScroll() {
  useEffect(() => {
    void startSmoothScroll();
    return () => stopSmoothScroll();
  }, []);

  // In-page anchor links glide through Lenis; native jumps would desync it
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.("a[href^='#']");
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const el = document.querySelector(hash);
      if (!el) return;
      e.preventDefault();
      scrollToAnchor(hash);
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}

/* ── Scroll to top on route change — Lenis-aware (fixes the "next page
      loads scrolled down" bug) ─────────────────────────────────────────── */
export function ScrollRestore() {
  const { pathname } = useLocation();
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    scrollToTop(true);
    // A second beat guarantees Lenis's rAF loop doesn't restore the old offset
    const t = window.setTimeout(() => scrollToTop(true), 60);
    return () => window.clearTimeout(t);
  }, [pathname]);
  return null;
}

/* ── Gold scroll-progress hairline ────────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, var(--ev-accent), var(--ev-gold))",
        transformOrigin: "0% 50%", scaleX, zIndex: 80,
      }}
    />
  );
}

/* ── Layout ───────────────────────────────────────────────────────────── */
export function Layout() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click or Escape; restore focus to the avatar
  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        avatarRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    show("success", "Signed out", "See you at the next show.");
    navigate("/");
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const navItems = [
    { to: "/", label: "Home", end: true },
    { to: "/shows", label: "Browse", end: false },
  ];

  return (
    <>
      <SmoothScroll />
      <ScrollRestore />
      <ScrollProgress />

      {/* ── HEADER ── */}
      <header className={`header-v2${scrolled ? " header-v2--scrolled" : ""}`}>
        <nav className="header-v2__bar" aria-label="Main navigation">
          <Link to="/" className="brand-v2" aria-label="Eventix home">
            <span className="brand-v2__mark" aria-hidden="true">EX</span>
            <span className="brand-v2__name">Eventix</span>
          </Link>

          <div className="nav-v2" role="list">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                role="listitem"
                className={({ isActive }) => isActive ? "active nav-v2__link" : "nav-v2__link"}
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="nav-actions">
            <button
              className="theme-toggle btn--icon"
              onClick={toggle}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -70, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 70, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "grid", placeItems: "center" }}
                >
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {isAuthenticated && user ? (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <motion.button
                  ref={avatarRef}
                  className="nav-avatar"
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label={`Account menu for ${user.name}`}
                  title={user.name}
                  whileTap={{ scale: 0.92 }}
                >
                  {initials(user.name)}
                </motion.button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="glass"
                      style={{
                        position: "absolute", top: "calc(100% + 0.625rem)", right: 0,
                        borderRadius: "var(--ev-radius-card)",
                        boxShadow: "var(--ev-shadow-elevated)",
                        minWidth: 216, zIndex: 70, overflow: "hidden",
                      }}
                      role="menu"
                    >
                      <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--ev-border)" }}>
                        <div style={{ fontWeight: 650, fontSize: "0.9375rem" }}>{user.name}</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-muted)", marginTop: "0.125rem", wordBreak: "break-all" }}>{user.email}</div>
                      </div>
                      <div style={{ padding: "0.375rem" }}>
                        <DropdownItem icon={<User size={15} />} label="Profile" to="/profile" onClick={() => setDropdownOpen(false)} />
                        <DropdownItem icon={<Ticket size={15} />} label="My bookings" to="/bookings" onClick={() => setDropdownOpen(false)} />
                        {isAdmin && <DropdownItem icon={<ShieldCheck size={15} />} label="Admin studio" to="/admin" onClick={() => setDropdownOpen(false)} />}
                        <div style={{ height: 1, background: "var(--ev-border)", margin: "0.375rem 0" }} />
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          className="menu-item menu-item--danger"
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
                <Link to="/register" className="btn btn--primary btn--sm btn-shine">Get started</Link>
              </>
            )}
          </div>

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
            className="mobile-v2 grain"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {[
              ...navItems,
              ...(isAuthenticated
                ? [
                    { to: "/profile", label: "Profile", end: false },
                    { to: "/bookings", label: "My bookings", end: false },
                    ...(isAdmin ? [{ to: "/admin", label: "Admin studio", end: false }] : []),
                  ]
                : [
                    { to: "/login", label: "Sign in", end: false },
                    { to: "/register", label: "Get started", end: false },
                  ]),
            ].map(({ to, label }, i) => (
              <motion.div
                key={to}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <NavLink
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) => isActive ? "active mobile-v2__link" : "mobile-v2__link"}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                  <ArrowUpRight size={22} style={{ color: "var(--ev-gold)" }} aria-hidden="true" />
                </NavLink>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ marginTop: "auto", display: "flex", gap: "0.75rem", paddingTop: "1.5rem" }}
            >
              {isAuthenticated ? (
                <button onClick={handleLogout} className="btn btn--secondary" style={{ flex: 1 }}>
                  <LogOut size={16} /> Sign out
                </button>
              ) : null}
              <button onClick={toggle} className="btn btn--secondary" style={{ flex: isAuthenticated ? undefined : 1 }}>
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                {theme === "light" ? "Dark mode" : "Light mode"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <main id="main-content">
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer-v2 grain" aria-label="Site footer">
        <div className="footer-v2__cols">
          <div>
            <Link to="/" className="brand-v2" style={{ marginBottom: "1rem" }} aria-label="Eventix home">
              <span className="brand-v2__mark" aria-hidden="true">EX</span>
              <span className="brand-v2__name">Eventix</span>
            </Link>
            <p style={{ color: "var(--ev-text-muted)", fontSize: "0.9375rem", lineHeight: 1.7, maxWidth: "30ch" }}>
              Cinema and live experiences, beautifully booked. Premières, concerts and one-night-only lineups — reserved in seconds.
            </p>
          </div>
          <div>
            <h5 style={{ fontSize: "0.6875rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ev-text-subtle)", marginBottom: "1rem" }}>Discover</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <Link to="/shows" className="footer-v2__link">All shows</Link>
              <Link to="/shows?type=MOVIE" className="footer-v2__link">Movies</Link>
              <Link to="/shows?type=EVENT" className="footer-v2__link">Live events</Link>
              <Link to="/about" className="footer-v2__link">About</Link>
              <Link to="/faq" className="footer-v2__link">FAQ</Link>
            </div>
          </div>
          <div>
            <h5 style={{ fontSize: "0.6875rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ev-text-subtle)", marginBottom: "1rem" }}>Legal &amp; support</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <Link to="/privacy" className="footer-v2__link">Privacy policy</Link>
              <Link to="/terms" className="footer-v2__link">Terms of service</Link>
              <Link to="/refunds" className="footer-v2__link">Refunds &amp; cancellations</Link>
              <Link to="/cookies" className="footer-v2__link">Cookie policy</Link>
              <a href="mailto:support@eventix.app" className="footer-v2__link">support@eventix.app</a>
            </div>
          </div>
          <div>
            <h5 style={{ fontSize: "0.6875rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ev-text-subtle)", marginBottom: "1rem" }}>Account</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {isAuthenticated ? (
                <>
                  <Link to="/bookings" className="footer-v2__link">My bookings</Link>
                  <Link to="/profile" className="footer-v2__link">Profile</Link>
                  {isAdmin && <Link to="/admin" className="footer-v2__link">Admin studio</Link>}
                </>
              ) : (
                <>
                  <Link to="/login" className="footer-v2__link">Sign in</Link>
                  <Link to="/register" className="footer-v2__link">Create account</Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="footer-v2__wordmark" aria-hidden="true">Eventix</div>
        <div
          style={{
            width: "min(var(--page-max), calc(100% - 3rem))",
            margin: "0 auto",
            padding: "1.25rem 0 1.75rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem 1.5rem",
            justifyContent: "space-between",
            borderTop: "1px solid var(--ev-border)",
            fontSize: "0.8125rem",
            color: "var(--ev-text-subtle)",
          }}
        >
          <span>© {new Date().getFullYear()} Eventix. All rights reserved.</span>
          <span>Payments are simulated — no real transactions occur.</span>
        </div>
      </footer>

      <CookieConsent />
    </>
  );
}

/* ── Dropdown item ────────────────────────────────────────────────────── */
function DropdownItem({ icon, label, to, onClick }: { icon: React.ReactNode; label: string; to: string; onClick: () => void }) {
  return (
    <Link to={to} role="menuitem" onClick={onClick} className="menu-item">
      <span style={{ color: "var(--ev-text-subtle)" }}>{icon}</span>
      {label}
    </Link>
  );
}

/* ── Route guards ─────────────────────────────────────────────────────── */
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

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isReady } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();

  const bounce = useCallback(() => {
    show("info", "Admins only", "That area is reserved for Eventix administrators.");
  }, [show]);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) navigate(`/login?next=/admin`, { replace: true });
    else if (!isAdmin) {
      bounce();
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isAdmin, isReady, navigate, bounce]);

  if (!isReady) return <RouteLoadingFallback />;
  if (!isAuthenticated || !isAdmin) return null;
  return <>{children}</>;
}

/* ── Route loading skeleton ───────────────────────────────────────────── */
export function RouteLoadingFallback() {
  return (
    <div className="page container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="skeleton" style={{ height: "2rem", width: "38%", borderRadius: "var(--ev-radius-control)" }} />
      <div className="skeleton" style={{ height: "1rem", width: "68%", borderRadius: "var(--ev-radius-control)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.25rem", marginTop: "1rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton skeleton--card" style={{ aspectRatio: "2/3" }} />
        ))}
      </div>
    </div>
  );
}
