import { type CSSProperties, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  buildInstallReelSlots,
  buildStaticInstallReelSlots,
  detectDefaultInstallMethod,
  getInstallMethodLabel,
  INSTALL_COMMANDS,
  INSTALL_REEL_DURATION_MS,
  type InstallMethod,
  type InstallReelSlot,
} from "@/lib/install-command";

const NEXT_STEPS = [
  {
    eyebrow: "Step 1",
    title: "Open a project",
    body: "Run iTE from the repo you want it to understand. It starts with the files and context already in front of you.",
  },
  {
    eyebrow: "Step 2",
    title: "Pair the session",
    body: "Complete the browser sign-in once, then return to the terminal. Your CLI is connected to this account.",
  },
  {
    eyebrow: "Step 3",
    title: "Work with intent",
    body: "Ask for a plan, review the changes, and let iTE handle the edits and checks you approve.",
  },
] as const;

export function SettingsPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [installMethod, setInstallMethod] = useState<InstallMethod>(() =>
    detectDefaultInstallMethod()
  );
  const [installTransition, setInstallTransition] = useState<{
    slots: InstallReelSlot[];
  } | null>(null);

  const installCommand = INSTALL_COMMANDS[installMethod];

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

  async function handleCopy(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      window.setTimeout(() => {
        setCopiedCommand((current) => (current === command ? null : current));
      }, 1400);
    } catch {
      setCopiedCommand(null);
    }
  }

  const reelSlots =
    installTransition?.slots ?? buildStaticInstallReelSlots(installCommand);

  return (
    <section className="account-panel account-panel-onboarding">
      <header className="account-panel-header onboarding-header">
        <div>
          <p className="sessions-kicker">Getting started</p>
          <h2>Start in your terminal.</h2>
        </div>
      </header>

      <section className="onboarding-install-panel" aria-label="Install iTE">
        <div className="onboarding-install-panel-top">
          <div>
            <span className="onboarding-chip">Install iTE</span>
          </div>
          <div
            className="onboarding-install-switch"
            aria-label="Choose install method"
            role="tablist"
          >
            <button
              aria-selected={installMethod === "curl"}
              className="onboarding-install-toggle"
              data-active={installMethod === "curl"}
              onClick={() => handleInstallMethodChange("curl")}
              role="tab"
              type="button"
            >
              {getInstallMethodLabel("curl")}
            </button>
            <button
              aria-selected={installMethod === "windows"}
              className="onboarding-install-toggle"
              data-active={installMethod === "windows"}
              onClick={() => handleInstallMethodChange("windows")}
              role="tab"
              type="button"
            >
              Windows
            </button>
            <button
              aria-selected={installMethod === "pipx"}
              className="onboarding-install-toggle"
              data-active={installMethod === "pipx"}
              onClick={() => handleInstallMethodChange("pipx")}
              role="tab"
              type="button"
            >
              pipx
            </button>
            <button
              aria-selected={installMethod === "uv"}
              className="onboarding-install-toggle"
              data-active={installMethod === "uv"}
              onClick={() => handleInstallMethodChange("uv")}
              role="tab"
              type="button"
            >
              uv
            </button>
          </div>
        </div>
        <div className="onboarding-command-line onboarding-command-line-large">
          <code
            aria-live="polite"
            className="hero-command-code onboarding-command-code"
          >
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
                    data-animating={installTransition ? "true" : "false"}
                    style={
                      {
                        "--slot-count": String(slot.chars.length),
                        "--slot-start":
                          installTransition && slot.direction === "down"
                            ? `calc(-100% * ${(slot.chars.length - 1) / slot.chars.length})`
                            : "0%",
                        "--slot-end":
                          installTransition && slot.direction === "up"
                            ? `calc(-100% * ${(slot.chars.length - 1) / slot.chars.length})`
                            : "0%",
                        animationDelay: `${slot.delay}ms`,
                        animationDuration: `${slot.duration}ms`,
                        transform:
                          installTransition && slot.direction === "down"
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
          <button
            className="onboarding-copy-button"
            onClick={() => void handleCopy(installCommand)}
            type="button"
          >
            {copiedCommand === installCommand ? "Copied" : "Copy"}
          </button>
        </div>
      </section>

      <section className="onboarding-demo-panel" aria-label="iTE demo video">
        <video
          autoPlay
          className="onboarding-demo-video"
          loop
          muted
          playsInline
          src="/demo.mp4"
        />
      </section>

      <section className="onboarding-hero">
        <div className="onboarding-hero-copy">
          <span className="onboarding-chip">Terminal first</span>
          <p className="onboarding-summary">
            iTE runs where you already work — inside your project.
          </p>
        </div>

        <div className="onboarding-command-stack" aria-label="Launch command">
          <article className="onboarding-command-card">
            <div className="onboarding-command-topline">
              <span>Launch iTE</span>
            </div>
            <div className="onboarding-command-line">
              <code>ite</code>
              <button
                className="onboarding-copy-button"
                onClick={() => void handleCopy("ite")}
                type="button"
              >
                {copiedCommand === "ite" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="muted">
              Run this from any project. The browser sign-in pairs that terminal
              session with your account.
            </p>
          </article>

          <article className="onboarding-command-card">
            <div className="onboarding-command-topline">
              <span>Account ready</span>
            </div>
            <p className="onboarding-card-statement">
              Hosted access is available after sign-in. Bring your own provider
              only when your workflow needs it.
            </p>
          </article>
        </div>
      </section>

      <section className="onboarding-steps" aria-label="How to use iTE">
        {NEXT_STEPS.map((item) => (
          <article
            className="detail-card onboarding-step-card"
            key={item.title}
          >
            <span className="onboarding-step-eyebrow">{item.eyebrow}</span>
            <strong>{item.title}</strong>
            <p className="muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="detail-card onboarding-links-card">
        <strong>Ready for local models or a custom provider?</strong>
        <p className="muted">
          When you want to use Ollama, OpenRouter, or another compatible provider, the setup guide has configuration details for every supported backend.
        </p>
        <div className="onboarding-link-row">
          <Link
            className="interactive-link"
            data-magnetic
            data-scramble
            to="/docs#configure"
          >
            Open setup guide
          </Link>
        </div>
      </section>
    </section>
  );
}
