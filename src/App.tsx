import { Link, Navigate, Route, Routes } from "react-router-dom";

import { AccountSessionsPage } from "@/pages/AccountSessionsPage";
import { CliAuthPage } from "@/pages/CliAuthPage";
import { DeviceApprovalPage } from "@/pages/DeviceApprovalPage";
import { DevicePage } from "@/pages/DevicePage";
import { LoginPage } from "@/pages/LoginPage";

function HomePage() {
  return (
    <main className="hero-shell">
      <div className="hero-orb" aria-hidden="true" />
      <section className="hero-card">
        <span className="brand-chip">iTE Cloud</span>
        <div className="ascii-wrap" aria-hidden="true">
          <pre className="ascii-art">{`  ██╗ ██████╗ ███████╗
  ╚═╝ ╚═██╔═╝ ██╔═══╝
  ██╗   ██║   ████╗
  ██║   ██║   ██╔═╝
  ██║   ██║   ███████╗
  ╚═╝   ╚═╝   ╚══════╝`}</pre>
        </div>
        <div className="stack hero-copy">
          <span className="eyebrow">Browser handoff for the terminal</span>
          <h1>Sign in once. Return to the terminal. Keep moving.</h1>
          <p className="muted lead">
            The web app exists to complete iTE Cloud authentication, manage terminal sessions,
            and later handle billing and usage. The backend truth stays in <code>ite-cloud-api</code>.
          </p>
        </div>
        <div className="row">
          <Link className="button" to="/login">
            Open account access
          </Link>
          <Link className="button secondary" to="/auth/cli">
            Continue a terminal login
          </Link>
        </div>
        <div className="status-rail">
          <div className="status-item">
            <span className="status-pulse" aria-hidden="true" />
            <span className="status-label">browser-first auth</span>
          </div>
          <div className="status-dot" aria-hidden="true" />
          <div className="status-item">
            <span className="status-key">service</span>
            <span className="status-value">ite-cloud-web</span>
          </div>
          <div className="status-dot" aria-hidden="true" />
          <div className="status-item">
            <span className="status-key">api</span>
            <span className="status-value">fastify</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export function App() {
  return (
    <>
      <header className="topbar">
        <Link className="brand-mark" to="/">
          iTE
        </Link>
        <nav className="row">
          <Link to="/login">Login</Link>
          <Link to="/auth/cli">CLI auth</Link>
          <Link to="/account/sessions">Sessions</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/cli" element={<CliAuthPage />} />
        <Route path="/device" element={<DevicePage />} />
        <Route path="/device/approve" element={<DeviceApprovalPage />} />
        <Route path="/account/sessions" element={<AccountSessionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
