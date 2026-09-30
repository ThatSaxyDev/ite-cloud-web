import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { accountError, useAccountResource } from "@/lib/use-account-resource";

function timestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AccountSessionsPage() {
  const { data, error, loading, refresh, setData } = useAccountResource(
    api.listSessions,
  );
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  async function revoke(id: string) {
    setPending(id);
    setActionError(null);
    try {
      await api.revokeSession(id);
      setData((current) =>
        current
          ? {
              ...current,
              sessions: current.sessions.map((s) =>
                s.id === id ? { ...s, revokedAt: new Date().toISOString() } : s,
              ),
            }
          : current,
      );
      setConfirm(null);
    } catch (caught) {
      setActionError(accountError(caught));
    } finally {
      setPending(null);
    }
  }
  const active = data?.sessions.filter((s) => !s.revokedAt).length;
  return (
    <section className="workspace-page">
      <header className="workspace-pagehead">
        <div>
          <p className="workspace-kicker">SESSIONS / DEVICE ACCESS</p>
          <h1>
            Your terminals.
            <br />
            <span>Your call.</span>
          </h1>
          <p>See what’s connected. End access when you’re done.</p>
        </div>
        <button
          className="workspace-textlink"
          disabled={loading || pending !== null}
          onClick={() => void refresh()}
        >
          {loading ? "Checking…" : "Refresh ↻"}
        </button>
      </header>
      {error && (
        <p className="workspace-error" role="alert">
          {error}{" "}
          <button disabled={loading} onClick={() => void refresh()}>
            Try again
          </button>
        </p>
      )}
      {actionError && (
        <p className="workspace-error" role="alert">
          {actionError}
        </p>
      )}
      {!data && loading && <p role="status">Loading your terminal sessions…</p>}
      {data && (
        <>
          <div className="session-count">
            <strong>{active}</strong>
            <span>active {active === 1 ? "connection" : "connections"}</span>
          </div>
          {data.sessions.length === 0 ? (
            <div className="workspace-empty">
              <h2>Nothing connected. Yet.</h2>
              <p>
                Run <code>ite</code> in a project and follow the browser
                sign-in. Your terminal will appear here.
              </p>
              <Link className="workspace-textlink" to="/account/settings">
                Install iTE ↗
              </Link>
            </div>
          ) : (
            <div className="workspace-sessions">
              {data.sessions.map((s) => (
                <article className="workspace-session" key={s.id}>
                  <div className="workspace-session-info">
                    <span
                      className="workspace-session-status"
                      data-ended={Boolean(s.revokedAt)}
                    >
                      {s.revokedAt ? "Access ended" : "Connected"}
                    </span>
                    <h2>{s.label || "Unnamed terminal"}</h2>
                    <dl>
                      <div>
                        <dt>Connected</dt>
                        <dd>{timestamp(s.createdAt)}</dd>
                      </div>
                      <div>
                        <dt>Last seen</dt>
                        <dd>{timestamp(s.lastSeenAt)}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="workspace-session-action">
                    {!s.revokedAt &&
                      (confirm === s.id ? (
                        <>
                          <p>End this terminal’s access?</p>
                          <div>
                            <button
                              className="workspace-danger"
                              disabled={pending !== null}
                              onClick={() => void revoke(s.id)}
                            >
                              {pending === s.id ? "Ending…" : "Yes, end access"}
                            </button>
                            <button
                              className="workspace-textlink"
                              disabled={pending !== null}
                              onClick={() => setConfirm(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          className="workspace-textlink"
                          disabled={pending !== null}
                          onClick={() => {
                            setConfirm(s.id);
                            setActionError(null);
                          }}
                        >
                          End access ↗
                        </button>
                      ))}
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="workspace-muted">
            Ending a session removes that terminal’s account access. It does not
            delete files or sign you out of this browser.
          </p>
        </>
      )}
    </section>
  );
}
