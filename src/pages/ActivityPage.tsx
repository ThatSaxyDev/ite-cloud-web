import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "@/lib/api";

type UsageState = {
  usage: {
    fiveHour: { usedUsdCents: number; eventCount: number };
    sevenDay: { usedUsdCents: number; eventCount: number };
  };
  quotas: {
    fiveHour: { usedUsdCents: number; capUsdCents: number; nextResetAt: string | null };
    sevenDay: { usedUsdCents: number; capUsdCents: number; nextResetAt: string | null };
  };
  entitlements: {
    planKey: string;
    bundledInference: boolean;
    proAccess: boolean;
    updatedAt: string | null;
  };
};

function normalizeMeridiem(value: string) {
  return value.replace(/\s?(AM|PM)$/i, (match) => match.trim().toLowerCase());
}

function formatResetLabel(value: string | null, variant: "time" | "dateTime") {
  if (!value) {
    return "No recent usage";
  }

  const formatted = new Intl.DateTimeFormat(
    undefined,
    variant === "time"
      ? { hour: "numeric", minute: "2-digit" }
      : { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }
  ).format(new Date(value));

  return normalizeMeridiem(formatted);
}

function formatPercentRemaining(used: number, cap: number) {
  if (cap <= 0) {
    return "0% remaining";
  }
  const remainingPercent = Math.max(0, ((cap - used) / cap) * 100);

  if (used <= 0) {
    return "100% remaining";
  }

  if (remainingPercent >= 99.95) {
    return "99.9% remaining";
  }

  const rounded = Math.max(0, Math.round(remainingPercent * 10) / 10);
  return `${rounded.toFixed(1)}% remaining`;
}

function progressWidth(used: number, cap: number) {
  if (cap <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (used / cap) * 100));
}

export function ActivityPage() {
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await api.billingUsage();
        if (cancelled) {
          return;
        }
        setUsage({
          usage: payload.usage,
          quotas: payload.quotas,
          entitlements: payload.entitlements
        });
        setError(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not load usage windows.")
            : "Could not load usage windows."
        );
      }
    }

    function handleWindowFocus() {
      void load();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void load();
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load();
      }
    }, 20000);

    void load();

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <section className="account-panel">
      <header className="account-panel-header">
        <div>
          <p className="sessions-kicker">Usage</p>
          <h2>Usage</h2>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {usage ? (
        <div className="detail-stack">
          <article className="detail-card">
            <p className="muted">
              Bundled usage is measured across rolling 5-hour and 7-day windows.
            </p>
            <div className="usage-limit-list">
              <div className="usage-limit-row">
                <div className="usage-limit-copy">
                  <strong>5h</strong>
                  <span>
                    Resets {formatResetLabel(usage.quotas.fiveHour.nextResetAt, "time")}
                  </span>
                </div>
                <div className="usage-limit-stats">
                  <strong>{formatPercentRemaining(usage.quotas.fiveHour.usedUsdCents, usage.quotas.fiveHour.capUsdCents)}</strong>
                  <span>{usage.usage.fiveHour.eventCount} requests</span>
                </div>
                <div className="usage-progress" aria-hidden="true">
                  <span
                    className="usage-progress-fill"
                    style={{ width: `${progressWidth(usage.quotas.fiveHour.usedUsdCents, usage.quotas.fiveHour.capUsdCents)}%` }}
                  />
                </div>
              </div>

              <div className="usage-limit-row">
                <div className="usage-limit-copy">
                  <strong>Weekly</strong>
                  <span>
                    Resets {formatResetLabel(usage.quotas.sevenDay.nextResetAt, "dateTime")}
                  </span>
                </div>
                <div className="usage-limit-stats">
                  <strong>{formatPercentRemaining(usage.quotas.sevenDay.usedUsdCents, usage.quotas.sevenDay.capUsdCents)}</strong>
                  <span>{usage.usage.sevenDay.eventCount} requests</span>
                </div>
                <div className="usage-progress" aria-hidden="true">
                  <span
                    className="usage-progress-fill"
                    style={{ width: `${progressWidth(usage.quotas.sevenDay.usedUsdCents, usage.quotas.sevenDay.capUsdCents)}%` }}
                  />
                </div>
              </div>
            </div>
          </article>

          <article className="detail-card">
            <strong>Need more headroom?</strong>
            <p className="muted">
              Upgrade when you need higher bundled limits and managed cloud access.
            </p>
            <div className="detail-card-actions">
              <Link className="button secondary" data-magnetic to="/account/billing">
                <span className="button-text" data-scramble>Open billing</span>
                <span className="button-border" />
              </Link>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
