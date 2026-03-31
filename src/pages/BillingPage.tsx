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

  useEffect(() => {
    async function load() {
      try {
        const payload = await api.billingMe();
        setBilling({
          subscription: payload.subscription,
          entitlements: payload.entitlements
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

  const paid = Boolean(billing?.entitlements.proAccess);

  return (
    <section className="account-panel">
      <header className="account-panel-header">
        <div>
          <p className="sessions-kicker">Billing</p>
          <h2>{paid ? "iTE Pro" : "Free"}</h2>
        </div>
        <button className="button secondary" data-magnetic disabled={syncPending} onClick={() => void handleSync()} type="button">
          <span className="button-text" data-scramble>
            {syncPending ? "Refreshing..." : "Refresh billing"}
          </span>
          <span className="button-border" />
        </button>
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
      </div>
    </section>
  );
}
