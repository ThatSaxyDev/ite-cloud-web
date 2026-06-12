import { type CSSProperties, useEffect, useState } from "react";
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
import { getDevAuthUser } from "@/lib/dev-auth";
import {
  buildInstallReelSlots,
  buildStaticInstallReelSlots,
  detectDefaultInstallMethod,
  getInstallMethodLabel,
  INSTALL_COMMANDS,
  isWindowsOS,
  INSTALL_REEL_DURATION_MS,
  type InstallMethod,
  type InstallReelSlot,
} from "@/lib/install-command";
import { AccountSessionsPage } from "@/pages/AccountSessionsPage";
import { ActivityPage } from "@/pages/ActivityPage";
import { BillingPage } from "@/pages/BillingPage";
import { CliAuthPage } from "@/pages/CliAuthPage";
import { DocsPage } from "@/pages/DocsPage";
import { LoginPage } from "@/pages/LoginPage";
import { PricingPage } from "@/pages/PricingPage";
import { SettingsPage } from "@/pages/SettingsPage";

const PRELOADER_SEEN_KEY = "ite-web-preloader-seen";
function HomePage() {
  const [ctaLabel, setCtaLabel] = useState("Get started");
  const [ctaHref, setCtaHref] = useState("/login?mode=sign-up");
  const [installMethod, setInstallMethod] = useState<InstallMethod>(() =>
    detectDefaultInstallMethod()
  );
  const [installCopied, setInstallCopied] = useState(false);
  const [installTransition, setInstallTransition] = useState<{
    slots: InstallReelSlot[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    markBrowserSeen();

    async function resolveCta() {
      if (getDevAuthUser()) {
        markKnownUser();
        setCtaLabel("Continue");
        setCtaHref("/account/settings");
        return;
      }

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

  useEffect(() => {
    if (!installTransition) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setInstallTransition(null);
    }, INSTALL_REEL_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [installTransition]);

  const installCommand = INSTALL_COMMANDS[installMethod];

  function handleInstallMethodChange(nextMethod: InstallMethod) {
    if (nextMethod === installMethod) {
      return;
    }

    const nextCommand = INSTALL_COMMANDS[nextMethod];
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      setInstallTransition({
        slots: buildInstallReelSlots(installCommand, nextCommand),
      });
    } else {
      setInstallTransition(null);
    }

    setInstallMethod(nextMethod);
  }

  async function handleCopyInstallCommand() {
    try {
      await navigator.clipboard.writeText(installCommand);
      setInstallCopied(true);
      window.setTimeout(() => {
        setInstallCopied(false);
      }, 1400);
    } catch {
      setInstallCopied(false);
    }
  }

  const reelSlots =
    installTransition?.slots ?? buildStaticInstallReelSlots(installCommand);

  return (
    <main className="hero-shell">
      <section className="hero-stage">
        <div className="hero-centered">
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
                <div className="hero-mobile-agent-viz">
                  <AgentVisualization />
                </div>
                <div className="hero-command-card" aria-label="Install iTE">
                  <div className="hero-command-toolbar">
                    <div
                      className="hero-command-switch"
                      aria-label="Choose install method"
                      role="tablist"
                    >
                      <button
                        aria-selected={installMethod === "curl"}
                        className="hero-command-toggle"
                        data-active={installMethod === "curl"}
                        onClick={() => handleInstallMethodChange("curl")}
                        role="tab"
                        type="button"
                      >
                        {getInstallMethodLabel("curl")}
                      </button>
                      {isWindowsOS() && (
                        <button
                          aria-selected={installMethod === "windows"}
                          className="hero-command-toggle"
                          data-active={installMethod === "windows"}
                          onClick={() => handleInstallMethodChange("windows")}
                          role="tab"
                          type="button"
                        >
                          Windows
                        </button>
                      )}
                      <button
                        aria-selected={installMethod === "pipx"}
                        className="hero-command-toggle"
                        data-active={installMethod === "pipx"}
                        onClick={() => handleInstallMethodChange("pipx")}
                        role="tab"
                        type="button"
                      >
                        pipx
                      </button>
                      <button
                        aria-selected={installMethod === "uv"}
                        className="hero-command-toggle"
                        data-active={installMethod === "uv"}
                        onClick={() => handleInstallMethodChange("uv")}
                        role="tab"
                        type="button"
                      >
                        uv
                      </button>
                    </div>
                    <button
                      className="hero-command-copy"
                      onClick={() => void handleCopyInstallCommand()}
                      type="button"
                    >
                      {installCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="hero-command-line">
                    <code aria-live="polite" className="hero-command-code">
                      <span className="sr-only">{installCommand}</span>
                      <span
                        aria-hidden="true"
                        className="hero-command-reels"
                        data-animating={installTransition ? "true" : "false"}
                      >
                        {reelSlots.map((slot, index) => (
                          <span
                            className="hero-command-slot"
                            key={`${index}-${slot.chars.join("")}`}
                          >
                            <span
                              className="hero-command-slot-track"
                              data-animating={
                                installTransition ? "true" : "false"
                              }
                              style={
                                {
                                  "--slot-count": String(slot.chars.length),
                                  "--slot-start":
                                    installTransition &&
                                    slot.direction === "down"
                                      ? `calc(-100% * ${(slot.chars.length - 1) / slot.chars.length})`
                                      : "0%",
                                  "--slot-end":
                                    installTransition && slot.direction === "up"
                                      ? `calc(-100% * ${(slot.chars.length - 1) / slot.chars.length})`
                                      : "0%",
                                  animationDelay: `${slot.delay}ms`,
                                  animationDuration: `${slot.duration}ms`,
                                  transform:
                                    installTransition &&
                                    slot.direction === "down"
                                      ? `translateY(calc(-100% * ${(slot.chars.length - 1) / slot.chars.length}))`
                                      : "translateY(0)",
                                } as CSSProperties
                              }
                            >
                              {slot.chars.map((char, charIndex) => (
                                <span
                                  className="hero-command-slot-char"
                                  key={`${index}-${charIndex}-${char}`}
                                >
                                  {char}
                                </span>
                              ))}
                            </span>
                          </span>
                        ))}
                      </span>
                    </code>
                  </div>
                </div>
                <div className="hero-actions">
                  <Link
                    className="button"
                    data-magnetic
                    data-ripple
                    to={ctaHref}
                  >
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
            <div className="hero-desktop-agent-viz">
              <AgentVisualization />
            </div>
          </div>
        </div>

        <Link
          className="hero-pricing-link interactive-link"
          data-magnetic
          data-scramble
          to="/pricing"
        >
          Pricing
        </Link>

        <section className="hero-demo-section">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="hero-demo-video"
            src="/demo.mp4"
          />
        </section>

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
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/cli" element={<CliAuthPage />} />
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Navigate to="/account/settings" replace />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="sessions" element={<AccountSessionsPage />} />
          <Route path="usage" element={<ActivityPage />} />
          <Route
            path="activity"
            element={<Navigate to="/account/usage" replace />}
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
