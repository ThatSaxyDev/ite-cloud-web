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
  inspectDevice(userCode: string) {
    const query = new URLSearchParams({ userCode });
    return apiRequest(`/auth/device/request?${query.toString()}`);
  },
  approveDevice(userCode: string) {
    return apiRequest("/auth/device/approve", {
      method: "POST",
      body: JSON.stringify({ userCode })
    });
  },
  denyDevice(userCode: string) {
    return apiRequest("/auth/device/deny", {
      method: "POST",
      body: JSON.stringify({ userCode })
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
  me() {
    return apiRequest<{ ok: true; actor: string; user: { id: string; email?: string; name?: string } }>("/auth/me");
  }
};
