import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, Ticket, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../context/auth-context";
import { initials } from "../lib/utils";

const navItems = [
  { to: "/shows", label: "Explore" },
  { to: "/shows?type=MOVIE", label: "Movies" },
  { to: "/shows?type=EVENT", label: "Events" },
];

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Eventix home">
      <motion.span
        className="brand-mark"
        whileHover={{ rotate: 12, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Ticket size={17} />
      </motion.span>
      <span>EVENTIX</span>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("eventix_theme") as "dark" | "light") || "dark",
  );
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("eventix_theme", theme);
  }, [theme]);
  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);
  const toggleTheme = () =>
    setTheme((value) => (value === "dark" ? "light" : "dark"));

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="app-shell">
      <header
        className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}
      >
        <div className="nav-wrap">
          <Brand />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <motion.button
              className="icon-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              whileTap={{ scale: 0.88, rotate: 180 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "grid", placeItems: "center" }}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            {user ? (
              <>
                <NavLink className="nav-text desktop-only" to="/bookings">
                  My bookings
                </NavLink>
                {isAdmin && (
                  <NavLink className="nav-text desktop-only" to="/admin">
                    Admin
                  </NavLink>
                )}
                <NavLink
                  className="avatar-link desktop-only"
                  to="/profile"
                  aria-label="Profile"
                >
                  {initials(user.name)}
                </NavLink>
                <button className="nav-text desktop-only" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink className="nav-text desktop-only" to="/login">
                  Log in
                </NavLink>
                <NavLink
                  className="button button--small desktop-only"
                  to="/register"
                >
                  Join Eventix
                </NavLink>
              </>
            )}
            <button
              className="icon-button mobile-toggle"
              aria-expanded={open}
              aria-label="Open navigation"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
          >
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/bookings">My bookings</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                {isAdmin && <NavLink to="/admin">Admin studio</NavLink>}
                <button onClick={logout}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <NavLink to="/register">Create your account</NavLink>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <main>{children}</main>
      <motion.footer
        className="site-footer"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div>
          <Brand />
          <p>Moments worth leaving home for.</p>
        </div>
        <div className="footer-links">
          <Link to="/shows">Explore shows</Link>
          <Link to="/bookings">My bookings</Link>
          <Link to="/profile">Account</Link>
        </div>
        <p className="copyright">© {new Date().getFullYear()} Eventix</p>
      </motion.footer>
    </div>
  );
}
