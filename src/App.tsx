import { Link, Navigate, Route, Routes } from "react-router-dom";

import iteImage from "@/assets/ite-image.png";
import { AmbientTriangles } from "@/components/AmbientTriangles";
import { AccountSessionsPage } from "@/pages/AccountSessionsPage";
import { CliAuthPage } from "@/pages/CliAuthPage";
import { LoginPage } from "@/pages/LoginPage";

function HomePage() {
  return (
    <main className="hero-shell">
      <section className="hero-stage">
        <header className="hero-topbar">
          <nav className="hero-nav">
            <Link to="/login">Sign in</Link>
            <Link to="/account/sessions">Account</Link>
          </nav>
        </header>

        <div className="hero-layout">
          <div className="hero-copy">
            <div className="hero-brand-block">
              <img alt="iTE" className="hero-brand-image" src={iteImage} />
            </div>
            <div className="hero-body">
              <h1>The AI agent for real work.</h1>
              <p className="hero-summary">
                Plan, execute, and stay in control.
              </p>
              <div className="hero-actions">
                <Link className="button" to="/login">
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function App() {
  return (
    <>
      <div className="app-ambient" aria-hidden="true">
        <AmbientTriangles className="triangle-field-global" />
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/cli" element={<CliAuthPage />} />
        <Route path="/account/sessions" element={<AccountSessionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
