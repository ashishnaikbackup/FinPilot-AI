import React, { Component, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

type BoundaryState = { hasError: boolean };

class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("FinPilot failed to render", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#0b1020", color: "#edf1fa", fontFamily: "system-ui, sans-serif" }}>
          <section role="alert" aria-labelledby="display-error-title" style={{ maxWidth: 560, padding: 28, border: "1px solid #354467", borderRadius: 16, background: "#141e32" }}>
            <p style={{ color: "#9daaff", fontSize: 12, letterSpacing: 2 }}>FINPILOT AI</p>
            <h1 id="display-error-title" style={{ fontSize: 25 }}>The workspace hit a display error.</h1>
            <p style={{ color: "#a0aec8", lineHeight: 1.6 }}>Your saved browser data has not been intentionally cleared. Reload the page to try again. If this keeps happening, open the project Actions page and share the latest deployment run with the maintainer.</p>
            <button onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 8, padding: "11px 16px", background: "#6879ed", color: "white", fontWeight: 700, cursor: "pointer" }}>Reload FinPilot</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
if (!root) {
  document.body.innerHTML = "<main style='padding:24px;font-family:system-ui'>FinPilot could not find its page root. Please reload or contact the maintainer.</main>";
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>
  );
}
