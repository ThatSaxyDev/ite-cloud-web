import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { api, type Entitlements } from "@/lib/api";

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
  entitlements: Entitlements;
  trial: {
    startedAt: string | null;
    usedAt: string | null;
    available: boolean;
  };
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPlanName(planKey: string | null | undefined) {
  if (!planKey || planKey === "free") {
    return "Free";
  }

  if (planKey === "ite_pro_monthly") {
    return "iTE Pro";
  }
  if (planKey === "ite_pro_trial") {
    return "iTE Pro intro";
  }

  return planKey
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSubscriptionStatus(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "Active";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    default:
      return "Free";
  }
}

function formatSubscriptionPeriodLabel(status: string | null | undefined) {
  if (status === "active") {
    return "Access through";
  }
  return "Current period ends";
}

export function BillingPage() {
  const location = useLocation();
  const checkoutSuccess = new URLSearchParams(location.search).get("checkout") === "success";

  const [billing, setBilling] = useState<BillingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [syncPending, setSyncPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const billingPayload = await api.billingMe();
        if (cancelled) {
          return;
        }
        setBilling({
          subscription: billingPayload.subscription,
          entitlements: billingPayload.entitlements,
          trial: billingPayload.trial,
        });
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
      setError(null);
      const catalog = await api.pricingCatalog();
      const plan = catalog.plans.find(
        (item) => item.planKey === "ite_pro_monthly",
      );
      if (!plan?.billingConfigured || !plan.checkoutEnabled) {
        setError(
          plan?.checkoutUnavailableMessage ??
            (plan?.billingConfigured
              ? "Checkout is not open yet. Please check back soon."
              : "Billing is not configured yet. Please check back soon."),
        );
        setCheckoutPending(false);
        return;
      }
      const payload = await api.createCheckout(
        billing?.trial.available ? "ite_pro_trial" : "ite_pro_monthly",
      );
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
        trial: payload.trial,
      });
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

  const paid = Boolean(billing?.entitlements.proAccess);
  const subscriptionStatus = billing?.subscription?.status ?? null;
  const trialAvailable = Boolean(billing?.trial.available);
  const trialActive = billing?.entitlements.planKey === "ite_pro_trial";

  return (
    <section className="account-panel account-panel-wide">
      <header className="account-panel-header">
        <div>
          <p className="sessions-kicker">Billing</p>
          <h2>{paid ? "iTE Pro" : "Free"}</h2>
        </div>
        <div className="detail-card-actions">
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
              {paid
                ? trialActive
                  ? "iTE Pro intro is active"
                  : "iTE Pro is active"
                : checkoutSuccess
                  ? "Confirming your payment..."
                  : "Start iTE Pro when you are ready"}
            </strong>
            <p className="muted">
              {paid
                ? "Bundled models are live in iTE Cloud inside rolling usage windows. Local models and BYOK providers remain available alongside iTE Pro."
                : checkoutSuccess
                  ? "Your payment is being processed. This page will update automatically — please don't close it."
                  : trialAvailable
                    ? "Free includes local models and your own keys. Start the first-month intro to try managed bundled access."
                    : "Free includes local models and your own keys. iTE Pro adds managed bundled access in 30-day passes."}
            </p>
            {billing?.subscription?.currentPeriodEnd ? (
              <p className="plan-meta">
                {formatSubscriptionPeriodLabel(subscriptionStatus)}{" "}
                {formatTimestamp(billing.subscription.currentPeriodEnd)}
              </p>
            ) : null}
          </div>
          {!paid && !checkoutSuccess ? (
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
                  {checkoutPending
                    ? "Opening secure checkout..."
                    : trialAvailable
                      ? "Start Pro intro"
                      : "Subscribe to Pro"}
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
              <dd>{formatSubscriptionStatus(subscriptionStatus)}</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{formatPlanName(billing?.entitlements.planKey)}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>
                {trialActive
                  ? "First-month intro"
                  : paid
                    ? "$8/month"
                    : trialAvailable
                      ? "First-month intro ($3), then $8 for 30 days"
                      : "$8 for 30 days of Pro access"}
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
