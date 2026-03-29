import { Link, Navigate, Route, Routes } from "react-router-dom";

import { AccountSessionsPage } from "@/pages/AccountSessionsPage";
import { CliAuthPage } from "@/pages/CliAuthPage";
import { DeviceApprovalPage } from "@/pages/DeviceApprovalPage";
import { DevicePage } from "@/pages/DevicePage";
import { LoginPage } from "@/pages/LoginPage";

function HomePage() {
  return (
    <main className="center-shell">
      <section className="center-stage wide">
        <span className="eyebrow">iTE</span>
        <h1>Finish sign-in in your browser.</h1>
        <p className="muted lead">Use this page to complete sign-in or manage terminal access.</p>
        <div className="center-actions">
          <Link className="button" to="/login">
            Sign in
          </Link>
          <Link className="button secondary" to="/account/sessions">
            Devices
          </Link>
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
          <Link to="/login">Sign in</Link>
          <Link to="/account/sessions">Devices</Link>
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
