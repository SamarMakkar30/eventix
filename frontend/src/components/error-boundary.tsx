import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Audit fix: previously discarded entirely — keep it on the console so
    // failures are diagnosable in devtools without exposing anything to users.
    console.error("Eventix crashed inside the app boundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError)
      return (
        <main className="page container">
          <div className="state-card error-state">
            <div className="state-icon">
              <TriangleAlert />
            </div>
            <h1>We hit an unexpected interruption.</h1>
            <p>
              Your account and bookings are safe. Refresh to return to Eventix.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              <a href="/" className="btn btn--secondary" style={{ textDecoration: "none" }}>
                Go to the marquee
              </a>
              <button className="btn btn--primary" onClick={() => window.location.reload()}>
                <RotateCcw size={16} />
                Refresh Eventix
              </button>
            </div>
          </div>
        </main>
      );
    return this.props.children;
  }
}
