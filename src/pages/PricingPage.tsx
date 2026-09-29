import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { markKnownUser } from "@/lib/browser-state";
import { getDevAuthUser } from "@/lib/dev-auth";

type PricingPlan = Awaited<ReturnType<typeof api.pricingCatalog>>["plans"][number];

type AuthState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "free"; trialAvailable: boolean }
  | { kind: "pro"; status: string | null };

function formatRequestCount(value: number | null) {
  if (value === null) {
    return "Included";
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

export function PricingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [passPlan, setPassPlan] = useState<PricingPlan | null>(null);
  const [authState, setAuthState] = useState<AuthState>({ kind: "loading" });
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  const checkoutIntent = new URLSearchParams(location.search).get("checkout");
  const loginRedirect = useMemo(
    () => `/pricing?checkout=ite_pro_subscription_monthly`,
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const catalog = await api.pricingCatalog();
        if (!cancelled) {
          setPlan(catalog.plans.find((item) => item.planKey === "ite_pro_subscription_monthly") ?? null);
          setPassPlan(catalog.plans.find((item) => item.planKey === "ite_pro_pass_30d") ?? null);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load pricing. Please try again.");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveAuth() {
      if (getDevAuthUser()) {
        markKnownUser();
        setAuthState({ kind: "free", trialAvailable: true });
        return;
      }

      const session = await authClient.getSession();
      if (cancelled) {
        return;
      }

      if (!session.data?.session) {
        setAuthState({ kind: "signed-out" });
        return;
      }

      markKnownUser();

      try {
        const billing = await api.billingMe();
        if (cancelled) {
          return;
        }
        if (billing.entitlements.proAccess) {
          setAuthState({
            kind: "pro",
            status: billing.subscription?.status ?? null,
          });
          return;
        }
        setAuthState({ kind: "free", trialAvailable: billing.trial.available });
      } catch {
        if (!cancelled) {
          setAuthState({ kind: "free", trialAvailable: true });
        }
      }
    }

    void resolveAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  async function startCheckout(
    planKey: "ite_pro_subscription_monthly" | "ite_pro_pass_30d" = "ite_pro_subscription_monthly",
  ) {
    const catalogPlan = planKey === "ite_pro_subscription_monthly" ? plan : passPlan;
    if (!catalogPlan) {
      return;
    }

    if (!catalogPlan?.billingConfigured || !catalogPlan.checkoutEnabled) {
      setError(null);
      setCheckoutNotice(
        catalogPlan?.checkoutUnavailableMessage ??
          (catalogPlan?.billingConfigured
            ? "Checkout is not open yet. Please check back soon."
            : "Billing is not configured yet. Please check back soon."),
      );
      return;
    }

    if (authState.kind === "signed-out") {
      navigate(`/login?mode=sign-up&redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    if (authState.kind === "pro") {
      navigate("/account/billing");
      return;
    }

    try {
      setCheckoutPending(true);
      setError(null);
      setCheckoutNotice(null);
      const origin = window.location.origin;
      const rawRequestedPlan =
        checkoutIntent === "ite_pro_subscription_monthly" || checkoutIntent === "ite_pro_pass_30d"
          ? checkoutIntent
          : null;
      const chosenPlanKey = rawRequestedPlan ?? planKey;
      const payload = await api.createCheckout(chosenPlanKey, {
        successUrl: `${origin}/account/billing?checkout=success`,
        returnUrl: `${origin}/pricing`,
      });
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

  useEffect(() => {
    if (
      (checkoutIntent !== "ite_pro_subscription_monthly" && checkoutIntent !== "ite_pro_pass_30d") ||
      !plan ||
      authState.kind !== "free" ||
      checkoutPending
    ) {
      return;
    }

    void startCheckout();
  }, [authState.kind, checkoutIntent, checkoutPending, plan, passPlan]);

  const trialAvailable = authState.kind !== "pro" && (authState.kind !== "free" || authState.trialAvailable);
  const ctaLabel = authState.kind === "pro"
    ? "Manage subscription"
    : trialAvailable
      ? "Start 14-day trial"
      : "Subscribe to Pro";

  const cleanPlan = useMemo(() => {
    if (!plan) return null;
    return {
      ...plan,
      trialOffer: {
        ...plan.trialOffer,
        label: "14-day free trial",
      },
      includes: [
        "Cloud coding models included",
        "Local models always free",
        "Your API keys still work",
      ],
    };
  }, [plan]);

  return (
    <main className="pricing-page">
      <header className="overlay-header pricing-header">
        <Link className="overlay-header-brand" data-magnetic to="/">
          <GlitchImageLogo className="overlay-header-brand-image" />
        </Link>
        <nav className="pricing-header-nav" aria-label="Pricing navigation">
          <Link className="interactive-link" data-scramble to="/docs">
            Docs
          </Link>
          <Link className="interactive-link" data-scramble to="/login?mode=sign-in">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="pricing-stage">
        <div className="pricing-copy">
          <p className="sessions-kicker">Pricing</p>
          <h1>iTE Pro</h1>
          <p>
            Reliable access to cloud coding models. Subscribe for $8/month after a 14-day trial,
            or choose a ₦10,500 one-time 30-day pass. Local models and your own keys stay available.
          </p>
        </div>

        <article className="pricing-plan">
          <div className="pricing-plan-top">
            <div>
              <span className="pricing-plan-name">{cleanPlan?.displayName ?? "iTE Pro"}</span>
            </div>
            <div className="pricing-price">
              <span>$8</span>
              <em>per month after trial</em>
            </div>
          </div>

          <div className="pricing-rule" />

          <div className="pricing-includes">
            <strong>Included</strong>
            <ul>
              {(cleanPlan?.includes ?? [
                "Cloud coding models included",
                "Local models always free",
                "Your API keys still work",
              ]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="pricing-estimates">
            <div className="pricing-estimates-head">
              <strong>Estimated requests</strong>
              <p>{plan?.usageSummary ?? "Request counts vary by model."}</p>
            </div>
            <div className="pricing-estimate-table">
              <div className="pricing-estimate-row pricing-estimate-row-head">
                <span>Model</span>
                <span>5h</span>
                <span>Week</span>
                <span>Month</span>
              </div>
              {(plan?.requestEstimates ?? []).map((estimate) => (
                <div className="pricing-estimate-row" key={estimate.model}>
                  <span>{estimate.label}</span>
                  <strong>{formatRequestCount(estimate.requestsPerFiveHour)}</strong>
                  <strong>{formatRequestCount(estimate.requestsPerWeek)}</strong>
                  <strong>{formatRequestCount(estimate.requestsPerMonth)}</strong>
                </div>
              ))}
            </div>
          </div>

          {checkoutNotice ? <p className="pricing-notice">{checkoutNotice}</p> : null}
          {error ? <p className="error">{error}</p> : null}

          <div className="pricing-cta-wrapper">
            <button
              className="button pricing-cta"
              data-magnetic
              data-ripple
              disabled={checkoutPending || !plan}
              onClick={() => void startCheckout()}
              type="button"
            >
              <span className="button-text" data-scramble>
                {checkoutPending ? "Opening secure checkout..." : ctaLabel}
              </span>
              <span className="button-shine" />
            </button>
            {plan && (!plan.billingConfigured || !plan.checkoutEnabled) ? (
              <span className="coming-soon-tag">
                {plan.billingConfigured ? "Checkout paused" : "Billing unavailable"}
              </span>
            ) : null}
            <button
              className="button secondary pricing-cta"
              data-magnetic
              disabled={checkoutPending || !plan}
              onClick={() => void startCheckout("ite_pro_pass_30d")}
              type="button"
            >
              <span className="button-text" data-scramble>
                {checkoutPending ? "Opening secure checkout..." : "Get 30-day pass — ₦10,500"}
              </span>
              <span className="button-border" />
            </button>
          </div>

          {authState.kind === "signed-out" ? (
            <p className="pricing-note">
              You will sign in first, then checkout starts automatically. The monthly option needs a USD card;
              the one-time pass uses Bachs local payment methods where available.
            </p>
          ) : null}
          {authState.kind === "pro" ? (
            <p className="pricing-note">
              Your account already has iTE Pro{authState.status ? ` (${authState.status})` : ""}.
            </p>
          ) : null}
        </article>
      </section>
    </main>
  );
}
