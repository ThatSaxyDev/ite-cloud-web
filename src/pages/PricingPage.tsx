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
  | { kind: "free" }
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
  const [authState, setAuthState] = useState<AuthState>({ kind: "loading" });
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutIntent = new URLSearchParams(location.search).get("checkout");
  const loginRedirect = useMemo(
    () => `/pricing?checkout=ite_pro_monthly`,
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const catalog = await api.pricingCatalog();
        if (!cancelled) {
          setPlan(catalog.plans.find((item) => item.planKey === "ite_pro_monthly") ?? null);
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
        setAuthState({ kind: "free" });
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
        setAuthState({ kind: "free" });
      } catch {
        if (!cancelled) {
          setAuthState({ kind: "free" });
        }
      }
    }

    void resolveAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  async function startCheckout() {
    if (!plan) {
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
      const origin = window.location.origin;
      const payload = await api.createCheckout(plan.planKey, {
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
    if (checkoutIntent !== "ite_pro_monthly" || authState.kind !== "free" || checkoutPending) {
      return;
    }

    void startCheckout();
  }, [authState.kind, checkoutIntent, checkoutPending]);

  const ctaLabel = "Start free trial";

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
            First month free, then $8/month for reliable access to bundled
            coding models. Usage is fair-use based, and local models and BYOK
            providers stay yours.
          </p>
        </div>

        <article className="pricing-plan">
          <div className="pricing-plan-top">
            <div>
              <span className="pricing-plan-name">{plan?.displayName ?? "iTE Pro"}</span>
              <strong>{plan?.trial.label ?? "First month free"}</strong>
              <p>Then {plan?.recurringPrice.label ?? "$8/month"}. Cancel anytime.</p>
            </div>
            <div className="pricing-price">
              <span>$0</span>
              <em>month one</em>
            </div>
          </div>

          <div className="pricing-rule" />

          <div className="pricing-includes">
            <strong>Included</strong>
            <ul>
              {(plan?.includes ?? [
                "Bundled cloud models within 5-hour, weekly, and monthly fair-use windows",
                "Local models remain available",
                "Bring your own provider keys remain available",
                "Cancel anytime",
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

          {error ? <p className="error">{error}</p> : null}

          <div className="pricing-cta-wrapper">
            <button
              className="button pricing-cta"
              data-magnetic
              data-ripple
              disabled={true}
              onClick={() => void startCheckout()}
              type="button"
            >
              <span className="button-text" data-scramble>
                {ctaLabel}
              </span>
              <span className="button-shine" />
            </button>
            <span className="coming-soon-tag">Coming soon</span>
          </div>

          {authState.kind === "signed-out" ? (
            <p className="pricing-note">
              You will sign in first, then checkout starts automatically.
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
