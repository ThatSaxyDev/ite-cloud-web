import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "@/lib/api";

const QUICKSTART_COMMANDS = [
  {
    label: "Launch iTE",
    command: "ite",
    caption: "Open the app and complete browser sign-in."
  },
  {
    label: "Run setup",
    command: "/setup",
    caption: "Choose the model service, key, and model you want to use."
  }
] as const;

const NEXT_STEPS = [
  {
    eyebrow: "Step 1",
    title: "Sign in once",
    body: "Use the hosted browser flow to connect your terminal session."
  },
  {
    eyebrow: "Step 2",
    title: "Connect a model",
    body: "Point iTE at the model service you want to use for this session."
  },
  {
    eyebrow: "Step 3",
    title: "Run a real prompt",
    body: "As soon as setup works, you can use iTE normally."
  }
] as const;

export function SettingsPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [bundledEnabled, setBundledEnabled] = useState(false);
  const [bundledLoading, setBundledLoading] = useState(true);
  const [bundledSaving, setBundledSaving] = useState(false);
  const [bundledError, setBundledError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const payload = await api.billingMe();
        if (!active) {
          return;
        }
        setBundledEnabled(Boolean(payload.entitlements.bundledInference));
        setBundledError(null);
      } catch (error) {
        if (!active) {
          return;
        }
        const message =
          typeof error === "object"
          && error
          && "error" in error
          && typeof error.error === "object"
          && error.error
          && "message" in error.error
          && typeof error.error.message === "string"
            ? error.error.message
            : "Could not load bundled access right now.";
        setBundledError(message);
      } finally {
        if (active) {
          setBundledLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

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

  async function handleBundledToggle() {
    if (bundledSaving || bundledLoading) {
      return;
    }

    const nextEnabled = !bundledEnabled;
    setBundledSaving(true);
    setBundledError(null);

    try {
      const payload = await api.toggleBundledAccess(nextEnabled);
      setBundledEnabled(Boolean(payload.entitlements.bundledInference));
    } catch (error) {
      const message =
        typeof error === "object"
        && error
        && "error" in error
        && typeof error.error === "object"
        && error.error
        && "message" in error.error
        && typeof error.error.message === "string"
          ? error.error.message
          : "Could not update bundled access right now.";
      setBundledError(message);
    } finally {
      setBundledSaving(false);
    }
  }

  return (
    <section className="account-panel account-panel-onboarding">
      <header className="account-panel-header onboarding-header">
        <div>
          <p className="sessions-kicker">Getting started</p>
          <h2>Get iTE ready.</h2>
        </div>
      </header>

      <section className="onboarding-hero">
        <div className="onboarding-hero-copy">
          <span className="onboarding-chip">Start here</span>
          <p className="onboarding-summary">
            Sign in, run <code>/setup</code>, and connect the model service you want to use.
          </p>
        </div>

        <div className="onboarding-command-stack" aria-label="Quickstart commands">
          {QUICKSTART_COMMANDS.map((item) => (
            <article className="onboarding-command-card" key={item.command}>
              <div className="onboarding-command-topline">
                <span>{item.label}</span>
                <button
                  className="onboarding-copy-button"
                  onClick={() => void handleCopy(item.command)}
                  type="button"
                >
                  {copiedCommand === item.command ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="onboarding-command-line">
                <code>{item.command}</code>
              </div>
              <p className="muted">{item.caption}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="onboarding-steps" aria-label="How to use iTE">
        {NEXT_STEPS.map((item) => (
          <article className="detail-card onboarding-step-card" key={item.title}>
            <span className="onboarding-step-eyebrow">{item.eyebrow}</span>
            <strong>{item.title}</strong>
            <p className="muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="detail-card bundled-access-card">
        <div className="bundled-access-row">
          <div className="bundled-access-copy">
            <strong>Bundled access</strong>
            <p className="muted">
              Toggle hosted bundled model access for this account while the bundled path is still being staged.
            </p>
          </div>

          <div className="bundled-access-controls">
            <span className={`bundled-access-pill ${bundledEnabled ? "is-on" : "is-off"}`}>
              {bundledLoading ? "Checking" : bundledEnabled ? "Enabled" : "Disabled"}
            </span>
            <button
              className="bundled-access-button"
              onClick={() => void handleBundledToggle()}
              type="button"
              disabled={bundledLoading || bundledSaving}
            >
              {bundledSaving ? "Saving" : bundledEnabled ? "Turn off" : "Turn on"}
            </button>
          </div>
        </div>
        {bundledError ? <p className="bundled-access-error">{bundledError}</p> : null}
      </section>

      <section className="detail-card onboarding-links-card">
        <strong>Need a little more guidance?</strong>
        <div className="onboarding-link-row">
          <Link className="interactive-link" data-magnetic data-scramble to="/docs">
            Open docs
          </Link>
          <Link className="interactive-link" data-magnetic data-scramble to="/account/sessions">
            Manage sessions
          </Link>
        </div>
      </section>
    </section>
  );
}
