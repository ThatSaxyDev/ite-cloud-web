import { useEffect, useState } from "react";

import { api } from "@/lib/api";

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

function formatUsd(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}

function formatNgn(cents: number) {
  const usd = cents / 100;
  const ngn = usd * 1397.98;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(ngn);
}

function formatPeriod(start: string | null, end: string | null) {
  if (!start || !end) {
    return "Current billing period";
  }

  const startText = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(start));
  const endText = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(end));
  return `${startText} to ${endText}`;
}

function modelLabel(modelKey: string) {
  switch (modelKey) {
    case "kimi-k2.5":
      return "Kimi K2.5";
    case "minimax-m2.7":
      return "MiniMax M2.7";
    case "glm-5":
      return "GLM-5";
    default:
      return modelKey;
  }
}

export function ActivityPage() {
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await api.activity();
        if (cancelled) {
          return;
        }
        setAnalytics(payload.analytics);
        setError(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not load usage.")
            : "Could not load usage."
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const maxDailyCents = Math.max(...(analytics?.daily.map((point) => point.usdCents) ?? [0]), 1);

  return (
    <section className="account-panel account-panel-wide">
      <header className="account-panel-header">
        <div>
          <p className="sessions-kicker">Usage</p>
          <h2>Spend and activity</h2>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {analytics ? (
        <div className="detail-stack">
          <div className="analytics-summary-grid">
            <article className="detail-card analytics-summary-card">
              <span className="analytics-summary-label">Today</span>
              <strong>{formatUsd(analytics.totals.todayUsdCents)}</strong>
              <span className="analytics-summary-meta">{formatNgn(analytics.totals.todayUsdCents)}</span>
            </article>
            <article className="detail-card analytics-summary-card">
              <span className="analytics-summary-label">7 days</span>
              <strong>{formatUsd(analytics.totals.sevenDayUsdCents)}</strong>
              <span className="analytics-summary-meta">{formatNgn(analytics.totals.sevenDayUsdCents)}</span>
            </article>
            <article className="detail-card analytics-summary-card">
              <span className="analytics-summary-label">Billing period</span>
              <strong>{formatUsd(analytics.totals.currentPeriodUsdCents)}</strong>
              <span className="analytics-summary-meta">{formatPeriod(analytics.currentPeriod.start, analytics.currentPeriod.end)}</span>
            </article>
            <article className="detail-card analytics-summary-card">
              <span className="analytics-summary-label">All time</span>
              <strong>{formatUsd(analytics.totals.allTimeUsdCents)}</strong>
              <span className="analytics-summary-meta">
                {formatNgn(analytics.totals.allTimeUsdCents)} · {analytics.totals.allTimeRequestCount} requests
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
                  <div className="usage-chart-value">{point.usdCents > 0 ? formatUsd(point.usdCents) : " "}</div>
                  <div className="usage-chart-bar-track">
                    <span
                      className="usage-chart-bar-fill"
                      style={{ height: `${Math.max(6, (point.usdCents / maxDailyCents) * 100)}%` }}
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
                      <span className="muted">{model.requestCount} requests</span>
                    </div>
                    <div className="analytics-model-stats">
                      <strong>{formatUsd(model.usdCents)}</strong>
                      <span className="muted">{formatNgn(model.usdCents)} · {model.sharePercent}%</span>
                    </div>
                    <div className="analytics-model-share">
                      <span className="analytics-model-share-fill" style={{ width: `${Math.max(4, model.sharePercent)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No bundled usage yet.</p>
            )}
          </article>
        </div>
      ) : null}
    </section>
  );
}
