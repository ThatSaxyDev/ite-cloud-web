import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";

import { AmbientTriangles } from "@/components/AmbientTriangles";
import { AgentVisualization } from "@/components/AgentVisualization";
import { AccountLayout } from "@/components/AccountLayout";
import { GlobalInteractionEffects } from "@/components/GlobalInteractionEffects";
import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { StartupPreloader } from "@/components/StartupPreloader";
import { authClient } from "@/lib/auth-client";
import {
  hasKnownUser,
  markBrowserSeen,
  markKnownUser,
} from "@/lib/browser-state";
import { AccountSessionsPage } from "@/pages/AccountSessionsPage";
import { CliAuthPage } from "@/pages/CliAuthPage";
import { DocsPage } from "@/pages/DocsPage";
import { LoginPage } from "@/pages/LoginPage";
import { SettingsPage } from "@/pages/SettingsPage";

const PRELOADER_SEEN_KEY = "ite-web-preloader-seen";

function HomePage() {
  const [ctaLabel, setCtaLabel] = useState("Get started");
  const [ctaHref, setCtaHref] = useState("/login?mode=sign-up");

  useEffect(() => {
    let cancelled = false;

    markBrowserSeen();

    async function resolveCta() {
      const session = await authClient.getSession();
      if (cancelled) {
        return;
      }

      if (session.data?.session) {
        markKnownUser();
        setCtaLabel("Continue");
        setCtaHref("/account/settings");
        return;
      }

      if (hasKnownUser()) {
        setCtaLabel("Sign in");
        setCtaHref("/login?mode=sign-in");
        return;
      }

      setCtaLabel("Get started");
      setCtaHref("/login?mode=sign-up");
    }

    void resolveCta();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="hero-shell">
      <section className="hero-stage">
        <div className="hero-layout">
          <div className="hero-copy">
            <div
              className="hero-brand-block"
              data-magnetic
              data-magnetic-strength="0.14"
              data-magnetic-ease="0.1"
            >
              <GlitchImageLogo className="hero-brand-image" />
            </div>
            <div className="hero-body">
              <h1>The AI agent for real work.</h1>
              <p className="hero-summary">
                Plan, execute, and stay in control.
              </p>
              <div className="hero-command-card" aria-label="Install iTE">
                <span className="hero-command-label">Install</span>
                <code>pipx install ite-agent</code>
              </div>
              <div className="hero-actions">
                <Link className="button" data-magnetic data-ripple to={ctaHref}>
                  <span className="button-text" data-scramble>
                    {ctaLabel}
                  </span>
                  <span className="button-shine" />
                </Link>
                {ctaHref === "/login?mode=sign-up" ? (
                  <Link
                    className="interactive-link hero-sign-in-link"
                    data-magnetic
                    data-scramble
                    to="/login?mode=sign-in"
                  >
                    Sign in
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
          <AgentVisualization />
        </div>

        <footer className="hero-floating-footer">
          <p>
            © {new Date().getFullYear()} iTE. Built by{" "}
            <a
              className="interactive-link"
              data-scramble
              href="https://kiishi.space"
              rel="noreferrer"
              target="_blank"
            >
              Kiishi David
            </a>
            .
          </p>
        </footer>
      </section>
    </main>
  );
}

export function App() {
  const [showPreloader, setShowPreloader] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.sessionStorage.getItem(PRELOADER_SEEN_KEY) !== "1";
  });

  function handlePreloaderComplete() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(PRELOADER_SEEN_KEY, "1");
    }
    setShowPreloader(false);
  }

  return (
    <>
      {showPreloader ? (
        <StartupPreloader onComplete={handlePreloaderComplete} />
      ) : null}
      <GlobalInteractionEffects />
      <div className="app-ambient" aria-hidden="true">
        <AmbientTriangles className="triangle-field-global" />
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/cli" element={<CliAuthPage />} />
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Navigate to="/account/settings" replace />} />
          <Route
            path="billing"
            element={<Navigate to="/account/settings" replace />}
          />
          <Route path="sessions" element={<AccountSessionsPage />} />
          <Route
            path="activity"
            element={<Navigate to="/account/settings" replace />}
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
