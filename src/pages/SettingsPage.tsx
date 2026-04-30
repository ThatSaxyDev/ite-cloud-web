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

type EntitlementState = {
  planKey: string;
  bundledInference: boolean;
  proAccess: boolean;
  updatedAt: string | null;
};

export function SettingsPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<EntitlementState | null>(null);
  const [entitlementPending, setEntitlementPending] = useState(false);
  const [entitlementError, setEntitlementError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEntitlements() {
      try {
        const me = await api.me();
        if (!cancelled) {
          setEntitlements(me.entitlements ?? null);
          setEntitlementError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setEntitlements(null);
          setEntitlementError(
            typeof error === "object" && error && "error" in error
              ? String((error as { error?: { message?: string } }).error?.message || "Could not load bundled access.")
              : "Could not load bundled access."
          );
        }
      }
    }

    void loadEntitlements();

    return () => {
      cancelled = true;
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

  async function handleBundledToggle(nextEnabled: boolean) {
    try {
      setEntitlementPending(true);
      setEntitlementError(null);
      const payload = await api.toggleBundledAccess(nextEnabled);
      setEntitlements(payload.entitlements);
    } catch (error) {
      setEntitlementError(
        typeof error === "object" && error && "error" in error
          ? String((error as { error?: { message?: string } }).error?.message || "Could not update bundled access.")
          : "Could not update bundled access."
      );
    } finally {
      setEntitlementPending(false);
    }
  }

  const entitlementLoaded = entitlements !== null || entitlementError !== null;

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
            When you're ready, head back to your terminal and run <code>/setup</code>.
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
          <article className="onboarding-command-card onboarding-entitlement-card">
            <div className="onboarding-command-topline">
              <span>Bundled testing access</span>
              <span
                className="onboarding-entitlement-status"
                data-active={entitlements?.bundledInference ? "true" : "false"}
              >
                {!entitlementLoaded ? "Loading" : entitlements?.bundledInference ? "Bundled on" : "Bundled off"}
              </span>
            </div>
            <p className="muted">
              Toggle your hosted bundled entitlement here while validating cloud-mode flows.
            </p>
            <div className="onboarding-entitlement-actions">
              <button
                className="button secondary"
                disabled={!entitlementLoaded || entitlementPending || !entitlements?.bundledInference}
                onClick={() => void handleBundledToggle(false)}
                type="button"
              >
                <span className="button-text">
                  {entitlementPending && entitlements?.bundledInference ? "Updating..." : "Disable"}
                </span>
                <span className="button-border" />
              </button>
              <button
                className="button"
                data-ripple
                disabled={!entitlementLoaded || entitlementPending || Boolean(entitlements?.bundledInference)}
                onClick={() => void handleBundledToggle(true)}
                type="button"
              >
                <span className="button-text">
                  {entitlementPending && !entitlements?.bundledInference ? "Updating..." : "Enable"}
                </span>
                <span className="button-shine" />
              </button>
            </div>
            {entitlementError ? <p className="onboarding-entitlement-feedback error">{entitlementError}</p> : null}
            {!entitlementError && entitlements ? (
              <p className="onboarding-entitlement-feedback muted">
                Plan: {entitlements.planKey}. Updated {entitlements.updatedAt ? new Date(entitlements.updatedAt).toLocaleString() : "just now"}.
              </p>
            ) : null}
          </article>
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
