import { config } from "@/lib/config";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const payload = await response.json();
  if (!response.ok) {
    throw payload;
  }
  return payload as T;
}

export const api = {
  inspectCliRequest(token: string) {
    const query = new URLSearchParams({ token });
    return apiRequest<{
      ok: true;
      token: string;
      clientId: string;
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
  createCheckout(planKey: "ite_pro_monthly" = "ite_pro_monthly") {
    return apiRequest<{ ok: true; checkoutId: string; checkoutUrl: string }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ planKey })
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
      entitlements: {
        planKey: string;
        bundledInference: boolean;
        proAccess: boolean;
        includedCreditsMonthly: number;
        updatedAt: string | null;
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
      entitlements: {
        planKey: string;
        bundledInference: boolean;
        proAccess: boolean;
        includedCreditsMonthly: number;
        updatedAt: string | null;
      };
    }>("/billing/sync", {
      method: "POST",
      body: JSON.stringify({})
    });
  },
  billingUsage() {
    return apiRequest<{
      ok: true;
      entitlements: {
        planKey: string;
        bundledInference: boolean;
        proAccess: boolean;
        includedCreditsMonthly: number;
        updatedAt: string | null;
      };
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
    }>("/usage/summary");
  },
  createBillingPortal() {
    return apiRequest<{ ok: true; customerPortalUrl: string }>("/billing/portal", {
      method: "POST",
      body: JSON.stringify({})
    });
  },
  me() {
    return apiRequest<{
      ok: true;
      actor: string;
      user: { id: string; email?: string; name?: string };
      entitlements?: {
        planKey: string;
        bundledInference: boolean;
        proAccess: boolean;
        includedCreditsMonthly: number;
        updatedAt: string | null;
      };
    }>("/auth/me");
  }
};
