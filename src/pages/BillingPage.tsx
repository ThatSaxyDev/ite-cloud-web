import { useEffect, useState } from "react";

import { api } from "@/lib/api";

type BillingState = {
  subscription: {
    id: string;
    planKey: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
    endedAt: string | null;
  } | null;
  entitlements: {
    planKey: string;
    bundledInference: boolean;
    proAccess: boolean;
    updatedAt: string | null;
  };
};

type AnalyticsPayload = {
  totals: {
    todayUsdCents: number;
    sevenDayUsdCents: number;
    thirtyDayUsdCents: number;
    allTimeUsdCents: number;
    allTimeRequestCount: number;
    currentPeriodUsdCents: number;
    currentPeriodRequestCount: number;
  };
  daily: Array<{
    date: string;
    label: string;
    usdCents: number;
    requestCount: number;
  }>;
  byModel: Array<{
    modelKey: string;
    usdCents: number;
    requestCount: number;
    sharePercent: number;
  }>;
  currentPeriod: {
    start: string | null;
    end: string | null;
  };
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

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
      : { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" },
  ).format(new Date(value));

  return normalizeMeridiem(formatted);
}

function formatPercentRemaining(used: number, cap: number) {
  if (cap <= 0) {
    return "0% remaining";
  }
  return `${Math.max(0, Math.round(((cap - used) / cap) * 100))}% remaining`;
}

function progressWidth(used: number, cap: number) {
  if (cap <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (used / cap) * 100));
}

function formatPlanName(planKey: string | null | undefined) {
  if (!planKey || planKey === "free") {
    return "Free";
  }

  if (planKey === "ite_pro_monthly") {
    return "iTE Pro Monthly";
  }

  return planKey
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatNgn(cents: number) {
  const usd = cents / 100;
  const ngn = usd * 1397.98;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(ngn);
}

function formatPeriod(start: string | null, end: string | null) {
  if (!start || !end) {
    return "Current billing period";
  }

  const startText = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(start));
  const endText = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(end));
  return `${startText} to ${endText}`;
}

function modelLabel(modelKey: string) {
  switch (modelKey) {
    case "kimi-k2.5":
    case "moonshotai/kimi-k2.5":
      return "Kimi K2.5";
    case "kimi-k2.6":
    case "moonshotai/kimi-k2.6":
      return "Kimi K2.6";
    case "minimax-m2.5":
    case "minimax/minimax-m2.5":
      return "MiniMax M2.5";
    case "minimax-m2.5-free":
    case "minimax/minimax-m2.5:free":
      return "MiniMax M2.5 (free)";
    case "minimax-m2.7":
    case "minimax/minimax-m2.7":
      return "MiniMax M2.7";
    case "glm-5":
    case "z-ai/glm-5":
      return "GLM-5";
    case "glm-5.1":
    case "z-ai/glm-5.1":
      return "GLM-5.1";
    case "nemotron-3-nano-omni-30b-a3b-reasoning-free":
    case "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free":
      return "Nemotron 3 Nano Omni (free)";
    default:
      return modelKey;
  }
}

export function BillingPage() {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [portalPending, setPortalPending] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [billingPayload, activityPayload] = await Promise.all([
          api.billingMe(),
          api.activity(),
        ]);
        if (cancelled) {
          return;
        }
        setBilling({
          subscription: billingPayload.subscription,
          entitlements: billingPayload.entitlements,
        });
        setAnalytics(activityPayload.analytics);
        setError(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String(
                (caught as { error?: { message?: string } }).error?.message ||
                  "Could not load billing.",
              )
            : "Could not load billing.",
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

  async function handleUpgrade() {
    try {
      setCheckoutPending(true);
      const payload = await api.createCheckout();
      window.location.assign(payload.checkoutUrl);
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "error" in caught
          ? String(
              (caught as { error?: { message?: string } }).error?.message ||
                "Could not start checkout.",
            )
          : "Could not start checkout.",
      );
      setCheckoutPending(false);
    }
  }

  async function handleSync() {
    try {
      setSyncPending(true);
      setError(null);
      const payload = await api.syncBilling();
      setBilling({
        subscription: payload.subscription,
        entitlements: payload.entitlements,
      });
      const activityPayload = await api.activity();
      setAnalytics(activityPayload.analytics);
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "error" in caught
          ? String(
              (caught as { error?: { message?: string } }).error?.message ||
                "Could not refresh billing.",
            )
          : "Could not refresh billing.",
      );
    } finally {
      setSyncPending(false);
    }
  }

  async function handleManageBilling() {
    try {
      setPortalPending(true);
      setError(null);
      const payload = await api.createBillingPortal();
      window.location.assign(payload.customerPortalUrl);
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "error" in caught
          ? String(
              (caught as { error?: { message?: string } }).error?.message ||
                "Could not open billing.",
            )
          : "Could not open billing.",
      );
      setPortalPending(false);
    }
  }

  const paid = Boolean(billing?.entitlements.proAccess);
  const maxDailyCents = Math.max(
    ...(analytics?.daily.map((point) => point.usdCents) ?? [0]),
    1,
  );

  return (
    <section className="account-panel account-panel-wide">
      <header className="account-panel-header">
        <div>
          <p className="sessions-kicker">Billing</p>
          <h2>{paid ? "iTE Pro" : "Free"}</h2>
        </div>
        <div className="detail-card-actions">
          {paid ? (
            <button
              className="button secondary"
              data-magnetic
              disabled={portalPending}
              onClick={() => void handleManageBilling()}
              type="button"
            >
              <span className="button-text" data-scramble>
                {portalPending ? "Opening..." : "Manage subscription"}
              </span>
              <span className="button-border" />
            </button>
          ) : null}
          <button
            className="button secondary"
            data-magnetic
            disabled={syncPending}
            onClick={() => void handleSync()}
            type="button"
          >
            <span className="button-text" data-scramble>
              {syncPending ? "Refreshing..." : "Refresh usage"}
            </span>
            <span className="button-border" />
          </button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="detail-stack">
        <article className="detail-card detail-card-featured">
          <div className="detail-card-copy">
            <strong>
              {paid ? "Pro is active" : "Upgrade when you are ready"}
            </strong>
            <p className="muted">
              {paid
                ? "Bundled models are live in iTE Cloud. You can keep using local or BYOK providers alongside bundled access, and usage is measured within rolling spend windows."
                : "Free includes local models and your own keys. Pro adds managed bundled access while keeping BYOK and local providers available."}
            </p>
            {billing?.subscription?.currentPeriodEnd ? (
              <p className="plan-meta">
                Renews {formatTimestamp(billing.subscription.currentPeriodEnd)}
              </p>
            ) : null}
          </div>
          {!paid ? (
            <div className="detail-card-actions">
              <button
                className="button"
                data-magnetic
                data-ripple
                disabled={checkoutPending}
                onClick={() => void handleUpgrade()}
                type="button"
              >
                <span className="button-text" data-scramble>
                  {checkoutPending ? "Opening checkout..." : "Upgrade to Pro"}
                </span>
                <span className="button-shine" />
              </button>
            </div>
          ) : null}
        </article>

        <article className="detail-card">
          <strong>Plan details</strong>
          <dl className="meta-list">
            <div>
              <dt>Status</dt>
              <dd>{billing?.subscription?.status ?? "Free"}</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{formatPlanName(billing?.entitlements.planKey)}</dd>
            </div>
          </dl>
        </article>

        {analytics ? (
          <>
            <div className="analytics-summary-grid">
              <article className="detail-card analytics-summary-card">
                <span className="analytics-summary-label">Today</span>
                <strong>{formatUsd(analytics.totals.todayUsdCents)}</strong>
                <span className="analytics-summary-meta">
                  {formatNgn(analytics.totals.todayUsdCents)}
                </span>
              </article>
              <article className="detail-card analytics-summary-card">
                <span className="analytics-summary-label">7 days</span>
                <strong>{formatUsd(analytics.totals.sevenDayUsdCents)}</strong>
                <span className="analytics-summary-meta">
                  {formatNgn(analytics.totals.sevenDayUsdCents)}
                </span>
              </article>
              <article className="detail-card analytics-summary-card">
                <span className="analytics-summary-label">Billing period</span>
                <strong>
                  {formatUsd(analytics.totals.currentPeriodUsdCents)}
                </strong>
                <span className="analytics-summary-meta">
                  {formatPeriod(
                    analytics.currentPeriod.start,
                    analytics.currentPeriod.end,
                  )}
                </span>
              </article>
              <article className="detail-card analytics-summary-card">
                <span className="analytics-summary-label">All time</span>
                <strong>{formatUsd(analytics.totals.allTimeUsdCents)}</strong>
                <span className="analytics-summary-meta">
                  {formatNgn(analytics.totals.allTimeUsdCents)} ·{" "}
                  {analytics.totals.allTimeRequestCount} requests
                </span>
              </article>
            </div>

            <article className="detail-card">
              <div className="analytics-panel-header">
                <strong>Last 14 days</strong>
                <span className="muted">Bundled spend by day</span>
              </div>
              <div className="usage-chart">
                {analytics.daily.map((point) => (
                  <div className="usage-chart-day" key={point.date}>
                    <div className="usage-chart-value">
                      {point.usdCents > 0 ? formatUsd(point.usdCents) : " "}
                    </div>
                    <div className="usage-chart-bar-track">
                      <span
                        className="usage-chart-bar-fill"
                        style={{
                          height: `${Math.max(6, (point.usdCents / maxDailyCents) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="usage-chart-label">{point.label}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="detail-card">
              <div className="analytics-panel-header">
                <strong>Model breakdown</strong>
                <span className="muted">Where bundled spend is going</span>
              </div>
              {analytics.byModel.length ? (
                <div className="analytics-model-list">
                  {analytics.byModel.map((model) => (
                    <div className="analytics-model-row" key={model.modelKey}>
                      <div className="analytics-model-copy">
                        <strong>{modelLabel(model.modelKey)}</strong>
                        <span className="muted">
                          {model.requestCount} requests
                        </span>
                      </div>
                      <div className="analytics-model-stats">
                        <strong>{formatUsd(model.usdCents)}</strong>
                        <span className="muted">
                          {formatNgn(model.usdCents)} · {model.sharePercent}%
                        </span>
                      </div>
                      <div className="analytics-model-share">
                        <span
                          className="analytics-model-share-fill"
                          style={{
                            width: `${Math.max(4, model.sharePercent)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No bundled usage yet.</p>
              )}
            </article>
          </>
        ) : null}
      </div>
    </section>
  );
}
