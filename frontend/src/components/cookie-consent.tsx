import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Cookie } from "lucide-react";

/* Minimal, honest cookie consent: one banner, one purpose, no dark patterns.
   Decline works exactly as well as accept (only essential keys are used). */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay so it never blocks first paint or LCP
    const t = window.setTimeout(() => {
      if (!localStorage.getItem("eventix_cookie_consent")) setVisible(true);
    }, 1400);
    return () => window.clearTimeout(t);
  }, []);

  const answer = (choice: "accepted" | "essential") => {
    localStorage.setItem("eventix_cookie_consent", choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Cookie preferences"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass-deep"
          style={{
            position: "fixed",
            left: "1rem",
            bottom: "1rem",
            right: "1rem",
            zIndex: 90,
            maxWidth: "min(30rem, calc(100vw - 2rem))",
            borderRadius: "var(--ev-radius-panel)",
            padding: "1.125rem 1.25rem",
            boxShadow: "var(--ev-shadow-elevated)",
            display: "flex",
            flexDirection: "column",
            gap: "0.875rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <Cookie size={18} style={{ color: "var(--ev-gold)", flexShrink: 0, marginTop: "0.125rem" }} aria-hidden="true" />
            <p style={{ fontSize: "0.875rem", color: "var(--ev-text-muted)", lineHeight: 1.6 }}>
              We use a few essential cookies to keep you signed in and remember your theme —
              no trackers, no ads.{" "}
              <Link to="/cookies" style={{ color: "var(--ev-gold)", textDecoration: "underline" }}>Cookie policy</Link>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
            <button className="btn btn--primary btn--sm" onClick={() => answer("accepted")} style={{ flex: 1 }}>
              Accept
            </button>
            <button className="btn btn--secondary btn--sm" onClick={() => answer("essential")} style={{ flex: 1 }}>
              Essential only
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
