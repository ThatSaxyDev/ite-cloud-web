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
    includedCreditsMonthly: number;
    updatedAt: string | null;
  };
};

type UsageState = {
  usage: {
    fiveHour: { usedCredits: number; eventCount: number };
    sevenDay: { usedCredits: number; eventCount: number };
    monthly: { usedCredits: number; eventCount: number };
  };
  quotas: {
    fiveHour: { usedCredits: number; capCredits: number; remainingCredits: number };
    sevenDay: { usedCredits: number; capCredits: number; remainingCredits: number };
    monthly: { usedCredits: number; capCredits: number; remainingCredits: number };
  };
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function BillingPage() {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [portalPending, setPortalPending] = useState(false);
  const [usage, setUsage] = useState<UsageState | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [billingPayload, usagePayload] = await Promise.all([api.billingMe(), api.billingUsage()]);
        setBilling({
          subscription: billingPayload.subscription,
          entitlements: billingPayload.entitlements
        });
        setUsage({
          usage: usagePayload.usage,
          quotas: usagePayload.quotas
        });
      } catch (caught) {
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not load billing.")
            : "Could not load billing."
        );
      }
    }

    void load();
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
              {syncPending ? "Refreshing..." : "Refresh billing"}
            </span>
            <span className="button-border" />
          </button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="detail-stack">
        <article className="detail-card detail-card-featured">
          <div className="detail-card-copy">
            <strong>{paid ? "Bundled access is enabled" : "Upgrade when you are ready"}</strong>
            <p className="muted">
              {paid
                ? `${billing?.entitlements.includedCreditsMonthly ?? 0} monthly credits included for bundled access.`
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
              <dd>{billing?.subscription?.status ?? "free"}</dd>
            </div>
            <div>
              <dt>Plan key</dt>
              <dd>{billing?.entitlements.planKey ?? "free"}</dd>
            </div>
            <div>
              <dt>Monthly credits</dt>
              <dd>{billing?.entitlements.includedCreditsMonthly ?? 0}</dd>
            </div>
          </dl>
        </article>

        <article className="detail-card">
          <strong>Usage</strong>
          <dl className="meta-list">
            <div>
              <dt>5 hour window</dt>
              <dd>
                {usage?.quotas.fiveHour.usedCredits ?? 0} / {usage?.quotas.fiveHour.capCredits ?? 0}
              </dd>
            </div>
            <div>
              <dt>7 day window</dt>
              <dd>
                {usage?.quotas.sevenDay.usedCredits ?? 0} / {usage?.quotas.sevenDay.capCredits ?? 0}
              </dd>
            </div>
            <div>
              <dt>Monthly included</dt>
              <dd>
                {usage?.quotas.monthly.usedCredits ?? 0} / {usage?.quotas.monthly.capCredits ?? 0}
              </dd>
            </div>
            <div>
              <dt>Bundled requests</dt>
              <dd>{usage?.usage.monthly.eventCount ?? 0}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
