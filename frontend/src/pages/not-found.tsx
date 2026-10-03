import { Link } from "react-router-dom";
import { motion } from "motion/react";

export function NotFoundPage() {
  return (
    <div className="not-found">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="not-found__code">404</div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
      >
        <div className="not-found__title">Page not found</div>
        <p className="not-found__desc">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <Link to="/" className="btn btn--primary">Go home</Link>
          <Link to="/shows" className="btn btn--secondary">Browse shows</Link>
        </div>
      </motion.div>
    </div>
  );
}
