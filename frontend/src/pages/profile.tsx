import { CalendarCheck2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/auth-context";
import { initials } from "../lib/utils";

const linkVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.5 + i * 0.1, ease: "easeOut" as const },
  }),
};

export function ProfilePage() {
  const { user, isAdmin } = useAuth();
  if (!user) return null;
  return (
    <div className="page container">
      <motion.div
        className="page-intro compact"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="eyebrow">Account</p>
        <h1>Your Eventix profile.</h1>
        <p>Your details, your bookings, your next great plan.</p>
      </motion.div>
      <div className="profile-grid">
        <motion.section
          className="profile-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 200, delay: 0.15 }}
        >
          <motion.div
            className="profile-avatar"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 260, delay: 0.25 }}
          >
            {initials(user.name)}
          </motion.div>
          <div>
            <span className="eyebrow">
              {user.role === "ADMIN" ? "Administrator" : "Member"}
            </span>
            <h2>{user.name}</h2>
            <p>
              <Mail size={16} />
              {user.email}
            </p>
          </div>
        </motion.section>

        <section className="account-links">
          <motion.div variants={linkVariants} initial="hidden" animate="visible" custom={0}>
            <Link to="/bookings">
              <CalendarCheck2 />
              <div>
                <h3>My bookings</h3>
                <p>See your upcoming plans and booking history.</p>
              </div>
            </Link>
          </motion.div>
          {isAdmin && (
            <motion.div variants={linkVariants} initial="hidden" animate="visible" custom={1}>
              <Link to="/admin">
                <ShieldCheck />
                <div>
                  <h3>Admin studio</h3>
                  <p>Manage catalogue content and experiences.</p>
                </div>
              </Link>
            </motion.div>
          )}
          <motion.div
            variants={linkVariants}
            initial="hidden"
            animate="visible"
            custom={isAdmin ? 2 : 1}
          >
            <div>
              <UserRound />
              <div>
                <h3>Account security</h3>
                <p>Your session is secured using your Eventix sign-in token.</p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
