import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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
    timeStyle: "short",
  }).format(new Date(value));
}

export function AccountSessionsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const sessionPayload = await api.listSessions();
        setSessions(sessionPayload.sessions);
      } catch (caught) {
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String(
                (
                  caught as {
                    error?: { message?: string };
                  }
                ).error?.message || "Could not load sessions.",
              )
            : "Could not load sessions.",
        );
      }
    }
    void load();
  }, []);

  async function handleRevoke(sessionId: string) {
    await api.revokeSession(sessionId);
    setSessions((items) =>
      items.map((item) =>
        item.id === sessionId
          ? { ...item, revokedAt: new Date().toISOString() }
          : item,
      ),
    );
  }

  async function handleBrowserLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      setLoggingOut(false);
    }
    navigate("/", { replace: true });
  }

  return (
    <section className="account-panel">
      <header className="account-panel-header">
        <div>
          <p className="sessions-kicker">Sessions</p>
          <h2>Device access</h2>
        </div>
        <button
          className="button secondary"
          data-magnetic
          disabled={loggingOut}
          onClick={() => void handleBrowserLogout()}
          type="button"
        >
          <span className="button-text" data-scramble>
            {loggingOut ? "Signing out..." : "Sign out"}
          </span>
          <span className="button-border" />
        </button>
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
                <span
                  className={`session-state ${session.revokedAt ? "is-revoked" : ""}`}
                >
                  {session.revokedAt ? "Ended" : "Active"}
                </span>
                {!session.revokedAt ? (
                  <button
                    className="button secondary"
                    data-magnetic
                    onClick={() => void handleRevoke(session.id)}
                    type="button"
                  >
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
  );
}
