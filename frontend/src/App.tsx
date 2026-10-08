import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { motion } from "motion/react";
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
const DesignSystemGallery = lazy(() =>
  import("./pages/design-system").then((m) => ({ default: m.DesignSystemGallery })),
);
const PrivacyPage = lazy(() => import("./pages/legal").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./pages/legal").then((m) => ({ default: m.TermsPage })));
const RefundsPage = lazy(() => import("./pages/legal").then((m) => ({ default: m.RefundsPage })));
const CookiesPage = lazy(() => import("./pages/legal").then((m) => ({ default: m.CookiesPage })));
const FaqPage = lazy(() => import("./pages/faq-about").then((m) => ({ default: m.FaqPage })));
const AboutPage = lazy(() => import("./pages/faq-about").then((m) => ({ default: m.AboutPage })));

/* Page transition wrapper — mounted per keyed route so exits can actually play */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      {/* Pages animate IN via PageShell. Exit animations around <Routes> are
          deliberately absent: AnimatePresence mode="wait" can deadlock when the
          incoming lazy route suspends, freezing the old page on screen. */}
      <Routes>
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <PageShell><HomePage /></PageShell>
                </Suspense>
              }
            />
            <Route
              path="/shows"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <PageShell><ShowsPage /></PageShell>
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
                  <PageShell><ShowDetailPage /></PageShell>
                </Suspense>
              }
            />
            <Route
              path="/shows/:id/seats"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <PageShell><SeatSelectionPage /></PageShell>
                </Suspense>
              }
            />

            {/* Protected routes */}
            <Route
              path="/checkout"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Protected>
                    <PageShell><CheckoutPage /></PageShell>
                  </Protected>
                </Suspense>
              }
            />
            <Route
              path="/confirmation/:id"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Protected>
                    <PageShell><ConfirmationPage /></PageShell>
                  </Protected>
                </Suspense>
              }
            />
            <Route
              path="/bookings"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Protected>
                    <PageShell><BookingsPage /></PageShell>
                  </Protected>
                </Suspense>
              }
            />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Protected>
                    <PageShell><ProfilePage /></PageShell>
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
                    <PageShell><AdminPage /></PageShell>
                  </AdminOnly>
                </Suspense>
              }
            />

            {/* Auth pages — full-bleed split screens */}
            <Route
              path="/login"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <PageShell><LoginPage /></PageShell>
                </Suspense>
              }
            />
            <Route
              path="/register"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <PageShell><RegisterPage /></PageShell>
                </Suspense>
              }
            />

            {/* Content & legal pages */}
            <Route
              path="/about"
              element={<Suspense fallback={<RouteLoadingFallback />}><PageShell><AboutPage /></PageShell></Suspense>}
            />
            <Route
              path="/faq"
              element={<Suspense fallback={<RouteLoadingFallback />}><PageShell><FaqPage /></PageShell></Suspense>}
            />
            <Route
              path="/privacy"
              element={<Suspense fallback={<RouteLoadingFallback />}><PageShell><PrivacyPage /></PageShell></Suspense>}
            />
            <Route
              path="/terms"
              element={<Suspense fallback={<RouteLoadingFallback />}><PageShell><TermsPage /></PageShell></Suspense>}
            />
            <Route
              path="/refunds"
              element={<Suspense fallback={<RouteLoadingFallback />}><PageShell><RefundsPage /></PageShell></Suspense>}
            />
            <Route
              path="/cookies"
              element={<Suspense fallback={<RouteLoadingFallback />}><PageShell><CookiesPage /></PageShell></Suspense>}
            />

            {/* Design system gallery (documented at /_design) */}
            <Route
              path="/_design"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <DesignSystemGallery />
                </Suspense>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <PageShell><NotFoundPage /></PageShell>
                </Suspense>
              }
            />
          </Route>
      </Routes>
    </AppErrorBoundary>
  );
}
