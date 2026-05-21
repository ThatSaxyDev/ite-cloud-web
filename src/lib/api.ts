import { config } from "@/lib/config";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${config.apiUrl}${path}`, {
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {})
      },
      ...init,
      signal: init?.signal ?? controller.signal
    });

    const payload = await response.json();
    if (!response.ok) {
      throw payload;
    }
    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw {
        error: {
          message: "The request timed out. Please try again."
        }
      };
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export type Entitlements = {
  planKey: string;
  bundledInference: boolean;
  remoteCompanion: boolean;
  proAccess: boolean;
  updatedAt: string | null;
};

export const api = {
  pricingCatalog() {
    return apiRequest<{
      ok: true;
      plans: Array<{
        planKey: "ite_pro_monthly";
        displayName: string;
        provider: "bachs";
        billingConfigured: boolean;
        checkoutEnabled: boolean;
        checkoutUnavailableMessage?: string;
        trialOffer: {
          planKey: "ite_pro_trial";
          interval: "month";
          intervalCount: number;
          label: string;
        };
        accessPass: {
          interval: "month";
          intervalCount: number;
          label: string;
        };
        recurringPrice: {
          amount: number;
          currency: "USD";
          interval: "month";
          label: string;
        };
        usageLimits: {
          fiveHour: { capUsdCents: number; label: string };
          sevenDay: { capUsdCents: number; label: string };
          thirtyDay: { capUsdCents: number; label: string };
        };
        usageSummary: string;
        requestEstimates: Array<{
          model: string;
          label: string;
          requestsPerFiveHour: number | null;
          requestsPerWeek: number | null;
          requestsPerMonth: number | null;
        }>;
        includes: string[];
      }>;
    }>("/pricing/catalog");
  },
  inspectCliRequest(token: string) {
    const query = new URLSearchParams({ token });
    return apiRequest<{
      ok: true;
      token: string;
      clientId: string;
      deviceLabel?: string;
      scope?: string | null;
      status: string;
      expiresAt: string;
    }>(`/auth/cli/request?${query.toString()}`);
  },
  completeCli(token: string) {
    return apiRequest<{ ok: true; status: string }>("/auth/cli/complete", {
      method: "POST",
      body: JSON.stringify({ token })
    });
  },
  listSessions() {
    return apiRequest<{ ok: true; sessions: Array<{ id: string; label: string; createdAt: string; lastSeenAt: string; revokedAt: string | null }> }>("/sessions");
  },
  revokeSession(sessionId: string) {
    return apiRequest("/sessions/revoke", {
      method: "POST",
      body: JSON.stringify({ sessionId })
    });
  },
  createCheckout(
    planKey: "ite_pro_trial" | "ite_pro_monthly" = "ite_pro_trial",
    urls?: { successUrl?: string; returnUrl?: string },
  ) {
    return apiRequest<{ ok: true; checkoutId: string; checkoutUrl: string }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ planKey, ...(urls ?? {}) })
    });
  },
  billingMe() {
    return apiRequest<{
      ok: true;
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
    }>("/billing/me");
  },
  syncBilling() {
    return apiRequest<{
      ok: true;
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
    }>("/billing/sync", {
      method: "POST",
      body: JSON.stringify({})
    });
  },
  billingUsage() {
    return apiRequest<{
      ok: true;
      entitlements: Entitlements;
      usage: {
        fiveHour: { usedUsdCents: number; eventCount: number };
        sevenDay: { usedUsdCents: number; eventCount: number };
        thirtyDay: { usedUsdCents: number; eventCount: number };
      };
      quotas: {
        fiveHour: { usedUsdCents: number; capUsdCents: number; nextResetAt: string | null };
        sevenDay: { usedUsdCents: number; capUsdCents: number; nextResetAt: string | null };
        thirtyDay: { usedUsdCents: number; capUsdCents: number; nextResetAt: string | null };
      };
    }>("/usage/summary");
  },
  activity() {
    return apiRequest<{
      ok: true;
      actor: string;
      analytics: {
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
      events: Array<{
        id: string;
        actorType: string;
        eventType: string;
        source: string;
        metadata: Record<string, unknown>;
        createdAt: string;
      }>;
    }>("/activity");
  },
  me() {
    return apiRequest<{
      ok: true;
      actor: string;
      user: { id: string; email?: string; name?: string };
      entitlements?: Entitlements;
    }>("/auth/me");
  }
};
