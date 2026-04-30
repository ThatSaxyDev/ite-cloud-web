import { useState } from "react";
import { Link } from "react-router-dom";

const QUICKSTART_COMMANDS = [
  {
    label: "Launch iTE",
    command: "ite",
    caption: "Open the app and complete browser sign-in."
  },
  {
    label: "Run setup",
    command: "/setup",
    caption: "Optional for local or BYOK access: connect Ollama, OpenRouter, or another compatible provider."
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
    title: "Choose bundled or BYOK",
    body: "Pro accounts can use bundled models after sign-in. You can also run /setup for Ollama, OpenRouter, or another OpenAI-compatible provider."
  },
  {
    eyebrow: "Step 3",
    title: "Start working",
    body: "Pick the model path that fits the task, then use iTE normally."
  }
] as const;

export function SettingsPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

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
            Sign in to use bundled access, or run <code>/setup</code> if you want local or BYOK models.
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
