import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Layout, Protected, AdminOnly, RouteLoadingFallback } from "./components/layout";
import { AppErrorBoundary } from "./components/error-boundary";

const HomePage = lazy(() =>
  import("./pages/home").then((m) => ({ default: m.HomePage })),
);
const ShowsPage = lazy(() =>
  import("./pages/shows").then((m) => ({ default: m.ShowsPage })),
);
const ShowDetailPage = lazy(() =>
  import("./pages/show-detail").then((m) => ({ default: m.ShowDetailPage })),
);
const SeatSelectionPage = lazy(() =>
  import("./pages/seat-selection").then((m) => ({ default: m.SeatSelectionPage })),
);
const CheckoutPage = lazy(() =>
  import("./pages/checkout").then((m) => ({ default: m.CheckoutPage })),
);
const ConfirmationPage = lazy(() =>
  import("./pages/confirmation").then((m) => ({ default: m.ConfirmationPage })),
);
const BookingsPage = lazy(() =>
  import("./pages/bookings").then((m) => ({ default: m.BookingsPage })),
);
const LoginPage = lazy(() =>
  import("./pages/auth").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/auth").then((m) => ({ default: m.RegisterPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/profile").then((m) => ({ default: m.ProfilePage })),
);
const AdminPage = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.AdminPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/not-found").then((m) => ({ default: m.NotFoundPage })),
);

function AnimatedPage({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AppErrorBoundary>
      <Routes location={location}>
        {/* Layout shell — nav + footer, all child routes rendered via <Outlet> */}
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <AnimatedPage><HomePage /></AnimatedPage>
              </Suspense>
            }
          />
          {/* /shows is the canonical browse route; /explore redirects for backwards compat */}
          <Route
            path="/shows"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <AnimatedPage><ShowsPage /></AnimatedPage>
              </Suspense>
            }
          />
          <Route path="/explore" element={<Navigate to="/shows" replace />} />
          <Route path="/explore/:category" element={<Navigate to="/shows" replace />} />
          <Route path="/search" element={<Navigate to="/shows" replace />} />

          <Route
            path="/shows/:id"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <AnimatedPage><ShowDetailPage /></AnimatedPage>
              </Suspense>
            }
          />
          <Route
            path="/shows/:id/seats"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <AnimatedPage><SeatSelectionPage /></AnimatedPage>
              </Suspense>
            }
          />

          {/* Protected routes */}
          <Route
            path="/checkout"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Protected>
                  <AnimatedPage><CheckoutPage /></AnimatedPage>
                </Protected>
              </Suspense>
            }
          />
          <Route
            path="/confirmation/:id"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Protected>
                  <AnimatedPage><ConfirmationPage /></AnimatedPage>
                </Protected>
              </Suspense>
            }
          />
          <Route
            path="/bookings"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Protected>
                  <AnimatedPage><BookingsPage /></AnimatedPage>
                </Protected>
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Protected>
                  <AnimatedPage><ProfilePage /></AnimatedPage>
                </Protected>
              </Suspense>
            }
          />

          {/* Admin only */}
          <Route
            path="/admin"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <AdminOnly>
                  <AnimatedPage><AdminPage /></AnimatedPage>
                </AdminOnly>
              </Suspense>
            }
          />

          {/* Auth pages (full screen — still inside Layout shell but auth-shell covers viewport) */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/register"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <RegisterPage />
              </Suspense>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AppErrorBoundary>
  );
}
