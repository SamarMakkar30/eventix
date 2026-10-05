import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Compass } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="not-found" style={{ minHeight: "100svh" }}>
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(60% 45% at 50% 42%, var(--ev-glow-accent), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative" }}
      >
        <div
          className="not-found__code font-display"
          style={{
            background: "linear-gradient(120deg, var(--ev-text), var(--ev-gold) 60%, var(--ev-text))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          404
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.875rem" }}
      >
        <div className="not-found__title font-display" style={{ fontSize: "1.75rem" }}>
          This scene doesn't exist
        </div>
        <p className="not-found__desc" style={{ textAlign: "center" }}>
          The page you're after was never filmed, moved, or sold out permanently. The catalogue, however, is very real.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link to="/" className="btn btn--primary btn-shine">
            Back to the marquee <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/shows" className="btn btn--secondary">
            <Compass size={16} aria-hidden="true" /> Browse shows
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
