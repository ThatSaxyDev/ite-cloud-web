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

type UsageState = {
  usage: {
    fiveHour: { usedUsdCents: number; eventCount: number };
    sevenDay: { usedUsdCents: number; eventCount: number };
  };
  quotas: {
    fiveHour: { usedUsdCents: number; capUsdCents: number; nextResetAt: string | null };
    sevenDay: { usedUsdCents: number; capUsdCents: number; nextResetAt: string | null };
  };
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
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
      : { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }
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

export function BillingPage() {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [portalPending, setPortalPending] = useState(false);
  const [usage, setUsage] = useState<UsageState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [billingPayload, usagePayload] = await Promise.all([api.billingMe(), api.billingUsage()]);
        if (cancelled) {
          return;
        }
        setBilling({
          subscription: billingPayload.subscription,
          entitlements: billingPayload.entitlements
        });
        setUsage({
          usage: usagePayload.usage,
          quotas: usagePayload.quotas
        });
        setError(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not load billing.")
            : "Could not load billing."
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

    void load();

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
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
          ? String((caught as { error?: { message?: string } }).error?.message || "Could not start checkout.")
          : "Could not start checkout."
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
        entitlements: payload.entitlements
      });
      const usagePayload = await api.billingUsage();
      setUsage({
        usage: usagePayload.usage,
        quotas: usagePayload.quotas
      });
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "error" in caught
          ? String((caught as { error?: { message?: string } }).error?.message || "Could not refresh billing.")
          : "Could not refresh billing."
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
          ? String((caught as { error?: { message?: string } }).error?.message || "Could not open billing.")
          : "Could not open billing."
      );
      setPortalPending(false);
    }
  }

  const paid = Boolean(billing?.entitlements.proAccess);

  return (
    <section className="account-panel">
      <header className="account-panel-header">
        <div>
          <p className="sessions-kicker">Billing</p>
          <h2>{paid ? "iTE Pro" : "Free"}</h2>
        </div>
        <div className="detail-card-actions">
          {paid ? (
            <button className="button secondary" data-magnetic disabled={portalPending} onClick={() => void handleManageBilling()} type="button">
              <span className="button-text" data-scramble>
                {portalPending ? "Opening..." : "Manage subscription"}
              </span>
              <span className="button-border" />
            </button>
          ) : null}
          <button className="button secondary" data-magnetic disabled={syncPending} onClick={() => void handleSync()} type="button">
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
            <strong>{paid ? "Pro is active" : "Upgrade when you are ready"}</strong>
            <p className="muted">
              {paid
                ? "Bundled models are available in iTE. Usage is measured by bundled model cost within rolling usage windows."
                : "Free includes local models and your own keys. Pro unlocks bundled access and higher limits."}
            </p>
            {billing?.subscription?.currentPeriodEnd ? (
              <p className="plan-meta">Renews {formatTimestamp(billing.subscription.currentPeriodEnd)}</p>
            ) : null}
          </div>
          {!paid ? (
            <div className="detail-card-actions">
              <button className="button" data-magnetic data-ripple disabled={checkoutPending} onClick={() => void handleUpgrade()} type="button">
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

        <article className="detail-card">
          <strong>Usage</strong>
          <div className="usage-limit-list">
            <div className="usage-limit-row">
              <div className="usage-limit-copy">
                <strong>5h</strong>
                <span>
                  Resets {formatResetLabel(usage?.quotas.fiveHour.nextResetAt ?? null, "time")}
                </span>
              </div>
              <div className="usage-limit-stats">
                <strong>{formatPercentRemaining(usage?.quotas.fiveHour.usedUsdCents ?? 0, usage?.quotas.fiveHour.capUsdCents ?? 0)}</strong>
              </div>
              <div className="usage-progress" aria-hidden="true">
                <span
                  className="usage-progress-fill"
                  style={{ width: `${progressWidth(usage?.quotas.fiveHour.usedUsdCents ?? 0, usage?.quotas.fiveHour.capUsdCents ?? 0)}%` }}
                />
              </div>
            </div>

            <div className="usage-limit-row">
              <div className="usage-limit-copy">
                <strong>Weekly</strong>
                <span>
                  Resets {formatResetLabel(usage?.quotas.sevenDay.nextResetAt ?? null, "dateTime")}
                </span>
              </div>
              <div className="usage-limit-stats">
                <strong>{formatPercentRemaining(usage?.quotas.sevenDay.usedUsdCents ?? 0, usage?.quotas.sevenDay.capUsdCents ?? 0)}</strong>
              </div>
              <div className="usage-progress" aria-hidden="true">
                <span
                  className="usage-progress-fill"
                  style={{ width: `${progressWidth(usage?.quotas.sevenDay.usedUsdCents ?? 0, usage?.quotas.sevenDay.capUsdCents ?? 0)}%` }}
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
