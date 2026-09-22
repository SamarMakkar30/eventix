import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Layout } from "./components/layout";
import { AppErrorBoundary } from "./components/error-boundary";
import { Skeleton } from "./components/ui";
import { useAuth } from "./context/auth-context";

const HomePage = lazy(() =>
  import("./pages/home").then((module) => ({ default: module.HomePage })),
);
const ShowsPage = lazy(() =>
  import("./pages/shows").then((module) => ({ default: module.ShowsPage })),
);
const ShowDetailPage = lazy(() =>
  import("./pages/show-detail").then((module) => ({
    default: module.ShowDetailPage,
  })),
);
const SeatSelectionPage = lazy(() =>
  import("./pages/seat-selection").then((module) => ({
    default: module.SeatSelectionPage,
  })),
);
const CheckoutPage = lazy(() =>
  import("./pages/checkout").then((module) => ({
    default: module.CheckoutPage,
  })),
);
const ConfirmationPage = lazy(() =>
  import("./pages/confirmation").then((module) => ({
    default: module.ConfirmationPage,
  })),
);
const BookingsPage = lazy(() =>
  import("./pages/bookings").then((module) => ({
    default: module.BookingsPage,
  })),
);
const LoginPage = lazy(() =>
  import("./pages/auth").then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/auth").then((module) => ({ default: module.RegisterPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/profile").then((module) => ({ default: module.ProfilePage })),
);
const AdminPage = lazy(() =>
  import("./pages/admin").then((module) => ({ default: module.AdminPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/not-found").then((module) => ({
    default: module.NotFoundPage,
  })),
);

function PageFallback() {
  return (
    <div className="page container">
      <Skeleton className="route-loading route-loading--title" />
      <Skeleton className="route-loading" />
      <Skeleton className="route-loading" />
    </div>
  );
}
function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate
      to={`/login?next=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
}
function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login?next=/admin" replace />;
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}
function AppRoutes() {
  const location = useLocation();
  return (
    <AppErrorBoundary>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(1px)" }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shows" element={<ShowsPage />} />
                <Route path="/shows/:id" element={<ShowDetailPage />} />
                <Route
                  path="/shows/:id/seats"
                  element={<SeatSelectionPage />}
                />
                <Route
                  path="/checkout"
                  element={
                    <Protected>
                      <CheckoutPage />
                    </Protected>
                  }
                />
                <Route
                  path="/confirmation/:id"
                  element={
                    <Protected>
                      <ConfirmationPage />
                    </Protected>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <Protected>
                      <BookingsPage />
                    </Protected>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/profile"
                  element={
                    <Protected>
                      <ProfilePage />
                    </Protected>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminOnly>
                      <AdminPage />
                    </AdminOnly>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </Layout>
    </AppErrorBoundary>
  );
}
export default function App() {
  return <AppRoutes />;
}
