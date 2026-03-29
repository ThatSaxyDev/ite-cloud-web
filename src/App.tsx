import { Link, Navigate, Route, Routes } from "react-router-dom";

import iteImage from "@/assets/ite-image.png";
import { AccountSessionsPage } from "@/pages/AccountSessionsPage";
import { CliAuthPage } from "@/pages/CliAuthPage";
import { LoginPage } from "@/pages/LoginPage";

function HomePage() {
  return (
    <main className="hero-shell">
      <section className="hero-stage">
        <header className="hero-topbar">
          <Link className="hero-nav-brand" to="/">
            <img alt="iTE" className="hero-nav-brand-image" src={iteImage} />
          </Link>
          <nav className="hero-nav">
            <Link to="/login">Sign in</Link>
            <Link to="/account/sessions">Account</Link>
          </nav>
        </header>

        <div className="hero-layout">
          <div className="hero-copy">
            <div className="hero-brand-block">
              <img alt="iTE" className="hero-brand-image" src={iteImage} />
              <p className="hero-brand-note">AI agent workspace.</p>
            </div>
            <div className="hero-body">
              <h1>The AI agent for real work.</h1>
              <p className="hero-summary">Plan, execute, and stay in control with one product that feels calm, sharp, and serious.</p>
              <div className="hero-actions">
                <Link className="button" to="/login">
                  Sign in
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-product" aria-hidden="true">
            <div className="product-window">
              <div className="product-chrome">
                <div className="product-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="product-path">workspace / agents / launch</div>
              </div>
              <div className="product-body">
                <aside className="product-sidebar">
                  <div className="product-logo">iTE</div>
                  <div className="sidebar-group">
                    <span className="sidebar-label">Workspace</span>
                    <div className="sidebar-item active">Launch plan</div>
                    <div className="sidebar-item">Research stream</div>
                    <div className="sidebar-item">Review loop</div>
                  </div>
                  <div className="sidebar-group">
                    <span className="sidebar-label">Agents</span>
                    <div className="agent-row">
                      <span className="agent-dot" />
                      <span>Primary</span>
                    </div>
                    <div className="agent-row">
                      <span className="agent-dot muted" />
                      <span>Explorer</span>
                    </div>
                  </div>
                </aside>

                <section className="product-main">
                  <div className="product-header">
                    <div>
                      <p className="product-eyebrow">Current thread</p>
                      <h2>Ship the next move.</h2>
                    </div>
                    <div className="product-pill">Live</div>
                  </div>

                  <div className="product-thread">
                    <article className="thread-card thread-card-primary">
                      <span className="thread-role">Agent</span>
                      <p>Drafting the production rollout for the new workspace surface.</p>
                    </article>
                    <article className="thread-card">
                      <span className="thread-role">Context</span>
                      <p>References, open tasks, and approvals stay attached to the same thread.</p>
                    </article>
                    <article className="thread-card">
                      <span className="thread-role">Output</span>
                      <p>Plans, edits, and reviews land in one place instead of scattering across tools.</p>
                    </article>
                  </div>
                </section>
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
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/cli" element={<CliAuthPage />} />
      <Route path="/account/sessions" element={<AccountSessionsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
