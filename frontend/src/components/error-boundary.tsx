import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "./ui";

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

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Keep errors private; this boundary gives users a recovery path without exposing internals.
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
            <Button onClick={() => window.location.reload()}>
              <RotateCcw size={16} />
              Refresh Eventix
            </Button>
          </div>
        </main>
      );
    return this.props.children;
  }
}
