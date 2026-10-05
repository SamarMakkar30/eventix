import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/auth-context";
import { ToastProvider } from "./context/toast-context";
import "@fontsource-variable/geist";
import "@fontsource/instrument-serif";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/geist-mono";
import "./styles/design-system.css";
import "./styles/global.css";
import "./styles/atelier.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

/* Prefetch every route chunk while the browser is idle — route switches
   then render instantly instead of waiting on a first-visit fetch. */
const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
idle(() => {
  void import("./pages/shows");
  void import("./pages/show-detail");
  void import("./pages/seat-selection");
  void import("./pages/checkout");
  void import("./pages/confirmation");
  void import("./pages/bookings");
  void import("./pages/auth");
  void import("./pages/profile");
  void import("./pages/admin");
  void import("./pages/not-found");
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
