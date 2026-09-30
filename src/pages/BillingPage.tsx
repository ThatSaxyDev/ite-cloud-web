import { useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { accountError, useAccountResource } from "@/lib/use-account-resource";

type PlanKey = "ite_pro_subscription_monthly" | "ite_pro_pass_30d";
const planName = (key: string) =>
  key === "ite_pro_subscription_monthly"
    ? "Pro monthly"
    : key === "ite_pro_pass_30d"
      ? "Pro 30-day pass"
      : key === "free"
        ? "Free"
        : key.replaceAll("_", " ");
const date = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );

export function BillingPage() {
  const location = useLocation();
  const checkoutSuccess =
    new URLSearchParams(location.search).get("checkout") === "success";
  const billing = useAccountResource(api.billingMe);
  const catalog = useAccountResource(api.pricingCatalog);
  const [pending, setPending] = useState<PlanKey | "sync" | "portal" | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  async function checkout(key: PlanKey) {
    setPending(key);
    setActionError(null);
    try {
      // Re-check availability at the moment of purchase, not just at page load.
      const fresh = await api.pricingCatalog();
      const plan = fresh.plans.find((p) => p.planKey === key);
      if (!plan?.billingConfigured || !plan.checkoutEnabled)
        throw new Error(
          plan?.checkoutUnavailableMessage ||
            "Checkout is not available right now.",
        );
      const result = await api.createCheckout(key, {
        successUrl: `${window.location.origin}/account/billing?checkout=success`,
        returnUrl: `${window.location.origin}/account/billing`,
      });
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setActionError(accountError(error));
      setPending(null);
    }
  }
  async function sync() {
    setPending("sync");
    setActionError(null);
    try {
      billing.setData(await api.syncBilling());
    } catch (error) {
      setActionError(accountError(error));
    } finally {
      setPending(null);
    }
  }
  async function portal() {
    setPending("portal");
    setActionError(null);
    try {
      const result = await api.billingPortal();
      window.location.assign(result.portalUrl);
    } catch (error) {
      setActionError(accountError(error));
      setPending(null);
    }
  }
  const data = billing.data;
  const paid = data?.entitlements.proAccess;
  return (
    <section className="workspace-page">
      <header className="workspace-pagehead">
        <div>
          <p className="workspace-kicker">BILLING / YOUR ACCESS</p>
          <h1>
            {paid ? (
              <>
                More room.
                <br />
                <span>You’re Pro.</span>
              </>
            ) : (
              <>
                Your work.
                <br />
                <span>Your setup.</span>
              </>
            )}
          </h1>
          <p>Manage your plan.</p>
        </div>
        <button
          className="workspace-textlink"
          disabled={billing.loading || pending !== null}
          onClick={() => void billing.refresh()}
        >
          {billing.loading ? "Checking…" : "Refresh account ↻"}
        </button>
      </header>
      {billing.error && (
        <p className="workspace-error" role="alert">
          {billing.error}{" "}
          <button
            onClick={() => void billing.refresh()}
            disabled={billing.loading}
          >
            Try again
          </button>
        </p>
      )}
      {actionError && (
        <p className="workspace-error" role="alert">
          {actionError}
        </p>
      )}
      {!data && billing.loading && (
        <p role="status">Loading your billing details…</p>
      )}
      {checkoutSuccess && !paid && (
        <div className="workspace-notice" role="status">
          <strong>Waiting for payment confirmation.</strong>
          <p>
            We’ll check automatically. If you’ve completed checkout, you can
            also sync your billing.
          </p>
          <button
            className="workspace-action"
            disabled={pending !== null}
            onClick={() => void sync()}
          >
            {pending === "sync" ? "Syncing…" : "Sync billing ↻"}
          </button>
        </div>
      )}
      {data && (
        <>
          <section className="billing-current">
            <div>
              <p className="workspace-kicker">CURRENT ACCESS</p>
              <h2>{planName(data.entitlements.planKey)}</h2>
              <p>
                {paid
                  ? "Bundled cloud inference, alongside your own providers and local models."
                  : "Local models and your own providers. Add Pro for bundled cloud inference."}
              </p>
            </div>
            <dl>
              <div>
                <dt>Status</dt>
                <dd>
                  {data.subscription?.status.replaceAll("_", " ") || "Free"}
                </dd>
              </div>
              {data.subscription?.currentPeriodEnd && (
                <div>
                  <dt>
                    {data.subscription.cancelAtPeriodEnd
                      ? "Ends on"
                      : "Access through"}
                  </dt>
                  <dd>{date(data.subscription.currentPeriodEnd)}</dd>
                </div>
              )}
              <div>
                <dt>Cloud inference</dt>
                <dd>
                  {data.entitlements.bundledInference
                    ? "Included"
                    : "Not included"}
                </dd>
              </div>
            </dl>
            <div className="billing-current-actions">
              <button
                className="workspace-textlink"
                disabled={pending !== null}
                onClick={() => void sync()}
              >
                {pending === "sync" ? "Syncing…" : "Sync billing ↻"}
              </button>
              {paid &&
                data.subscription?.planKey ===
                  "ite_pro_subscription_monthly" && (
                  <button
                    className="workspace-action"
                    disabled={pending !== null}
                    onClick={() => void portal()}
                  >
                    {pending === "portal"
                      ? "Opening…"
                      : "Manage subscription ↗"}
                  </button>
                )}
            </div>
          </section>
          {paid ? (
            <p className="workspace-footnote">
              Already have iTE open? Run <code>/refresh</code> in your terminal
              to reload account access.
            </p>
          ) : (
            <section
              className="billing-options"
              aria-label="Available Pro plans"
            >
              <div className="billing-options-head">
                <p className="workspace-kicker">ADD CLOUD INFERENCE</p>
                <h2>Two ways in.</h2>
                <p>Your own providers and local models remain available.</p>
              </div>
              {catalog.error && (
                <p className="workspace-error" role="alert">
                  {catalog.error}{" "}
                  <button
                    onClick={() => void catalog.refresh()}
                    disabled={catalog.loading}
                  >
                    Reload plans
                  </button>
                </p>
              )}
              {!catalog.data && catalog.loading && (
                <p role="status">Loading current plans and prices…</p>
              )}
              {catalog.data?.plans.map((plan) => {
                const monthly = plan.planKey === "ite_pro_subscription_monthly";
                const price = plan.recurringPrice || plan.oneTimePrice;
                return (
                  <article className="billing-option" key={plan.planKey}>
                    <div>
                      <p className="workspace-kicker">
                        {monthly ? "RECURRING" : "ONE-TIME"}
                      </p>
                      <h3>{plan.displayName}</h3>
                      <p className="billing-price">
                        {price?.label || "Price unavailable"}
                      </p>
                      <p>
                        {monthly
                          ? "Subscription with a USD card."
                          : "Local payment methods. No automatic renewal."}
                      </p>
                      {monthly && data.trial.available && plan.trialOffer && (
                        <p className="billing-trial">{plan.trialOffer.label}</p>
                      )}
                      <p>{plan.usageSummary}</p>
                    </div>
                    <div>
                      <button
                        className={
                          monthly
                            ? "workspace-action"
                            : "workspace-action secondary"
                        }
                        disabled={
                          pending !== null ||
                          !plan.billingConfigured ||
                          !plan.checkoutEnabled ||
                          !price
                        }
                        onClick={() => void checkout(plan.planKey)}
                      >
                        {pending === plan.planKey
                          ? "Opening checkout…"
                          : monthly && data.trial.available && plan.trialOffer
                            ? `Start ${plan.trialOffer.days}-day trial ↗`
                            : monthly
                              ? "Subscribe to Pro ↗"
                              : "Buy 30-day access ↗"}
                      </button>
                      {(!plan.checkoutEnabled || !plan.billingConfigured) && (
                        <p className="workspace-muted">
                          {plan.checkoutUnavailableMessage ||
                            "Checkout is currently unavailable."}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}
    </section>
  );
}
