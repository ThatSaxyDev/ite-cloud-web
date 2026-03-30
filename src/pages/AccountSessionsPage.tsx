import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { markKnownUser } from "@/lib/browser-state";

type SessionItem = {
  id: string;
  label: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

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
      markKnownUser();
      try {
        const payload = await api.listSessions();
        setSessions(payload.sessions);
      } catch (caught) {
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not load activity.")
            : "Could not load activity."
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
    <main className="sessions-page">
      <section className="sessions-stage">
        <header className="sessions-header">
          <div>
            <Link className="auth-brand" data-magnetic to="/">
              <GlitchImageLogo className="overlay-header-brand-image" />
            </Link>
            <p className="sessions-kicker">Account</p>
          </div>
          <div className="row">
            <button className="button secondary" data-magnetic onClick={() => void handleBrowserLogout()} type="button">
              <span className="button-text" data-scramble>
                Sign out
              </span>
              <span className="button-border" />
            </button>
          </div>
        </header>

        {error ? <p className="error">{error}</p> : null}

        <section className="session-table" aria-label="Recent activity">
          {sessions.length < 1 ? (
            <p className="muted">No activity yet.</p>
          ) : (
            sessions.map((session) => (
              <article className="session-row" key={session.id}>
                <div className="session-main">
                  <strong>{session.label}</strong>
                  <div className="session-meta">
                    <span>{formatTimestamp(session.createdAt)}</span>
                    <span>{formatTimestamp(session.lastSeenAt)}</span>
                  </div>
                </div>
                <div className="session-side">
                  <span className={`session-state ${session.revokedAt ? "is-revoked" : ""}`}>
                    {session.revokedAt ? "Ended" : "Active"}
                  </span>
                  {!session.revokedAt ? (
                    <button className="button secondary" data-magnetic onClick={() => void handleRevoke(session.id)} type="button">
                      <span className="button-text" data-scramble>
                        End access
                      </span>
                      <span className="button-border" />
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
