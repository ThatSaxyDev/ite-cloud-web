import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

type SessionItem = {
  id: string;
  label: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
};

export function AccountSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const session = await authClient.getSession();
      if (!session.data?.session) {
        navigate("/login?redirect=/account/sessions");
        return;
      }
      try {
        const payload = await api.listSessions();
        setSessions(payload.sessions);
      } catch (caught) {
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not load sessions.")
            : "Could not load sessions."
        );
      }
    }
    void load();
  }, [navigate]);

  async function handleRevoke(sessionId: string) {
    await api.revokeSession(sessionId);
    setSessions((items) =>
      items.map((item) => (item.id === sessionId ? { ...item, revokedAt: new Date().toISOString() } : item))
    );
  }

  async function handleBrowserLogout() {
    await authClient.signOut();
    navigate("/login");
  }

  return (
    <main className="shell stack">
      <section className="panel stack">
        <span className="eyebrow">Terminal sessions</span>
        <h1>Manage device access</h1>
        <p className="muted">These are terminal sessions issued by the API to the iTE runtime.</p>
        <div className="meta-chip-row">
          <span className="meta-chip">Terminal runtime</span>
          <span className="meta-chip">API-owned sessions</span>
        </div>
        <div className="row">
          <button className="button secondary" onClick={() => void handleBrowserLogout()} type="button">
            Sign out browser session
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="stack">
          {sessions.length < 1 ? (
            <p className="muted">No terminal sessions yet.</p>
          ) : (
            sessions.map((session) => (
              <article className="panel inner" key={session.id}>
                <div className="stack">
                  <strong>{session.label}</strong>
                  <span className="muted">Created: {new Date(session.createdAt).toLocaleString()}</span>
                  <span className="muted">Last seen: {new Date(session.lastSeenAt).toLocaleString()}</span>
                  <span className="muted">Revoked: {session.revokedAt ? "yes" : "no"}</span>
                  {!session.revokedAt ? (
                    <button className="button secondary" onClick={() => void handleRevoke(session.id)} type="button">
                      Revoke
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
        <Link className="button secondary" to="/">
          Back home
        </Link>
      </section>
    </main>
  );
}
