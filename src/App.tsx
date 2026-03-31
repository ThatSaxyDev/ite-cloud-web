import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";

import { AmbientTriangles } from "@/components/AmbientTriangles";
import { AccountLayout } from "@/components/AccountLayout";
import { GlobalInteractionEffects } from "@/components/GlobalInteractionEffects";
import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { StartupPreloader } from "@/components/StartupPreloader";
import { authClient } from "@/lib/auth-client";
import { hasKnownUser, markBrowserSeen, markKnownUser } from "@/lib/browser-state";
import { AccountSessionsPage } from "@/pages/AccountSessionsPage";
import { ActivityPage } from "@/pages/ActivityPage";
import { BillingPage } from "@/pages/BillingPage";
import { CliAuthPage } from "@/pages/CliAuthPage";
import { LoginPage } from "@/pages/LoginPage";
import { SettingsPage } from "@/pages/SettingsPage";

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
        setCtaHref("/account/billing");
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
        <header className="hero-topbar">
          <nav className="hero-nav">
            <Link className="interactive-link" data-magnetic data-scramble to="/login">
              Sign in
            </Link>
            <Link className="interactive-link" data-magnetic data-scramble to="/account/billing">
              Account
            </Link>
          </nav>
        </header>

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
              <div className="hero-actions">
                <Link className="button" data-magnetic data-ripple to={ctaHref}>
                  <span className="button-text" data-scramble>
                    {ctaLabel}
                  </span>
                  <span className="button-shine" />
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
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <>
      {showPreloader ? <StartupPreloader onComplete={() => setShowPreloader(false)} /> : null}
      <GlobalInteractionEffects />
      <div className="app-ambient" aria-hidden="true">
        <AmbientTriangles className="triangle-field-global" />
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/cli" element={<CliAuthPage />} />
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Navigate to="/account/billing" replace />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="sessions" element={<AccountSessionsPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
