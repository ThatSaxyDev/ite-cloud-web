import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { markKnownUser } from "@/lib/browser-state";

type CliRequest = {
  clientId: string;
  token: string;
  status: string;
  expiresAt?: string;
  scope?: string | null;
};

type BrowserUser = {
  email?: string;
  name?: string;
};

export function CliAuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [request, setRequest] = useState<CliRequest | null>(null);
  const [status, setStatus] = useState("Preparing sign-in");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<BrowserUser | null>(null);
  const [approving, setApproving] = useState(false);
  const isComplete = status === "Signed in" && !error;

  function getStatusBody() {
    if (isComplete) {
      return "Your browser is linked. Return to iTE in the terminal to continue, or stay here to review your account and docs.";
    }
    if (error) {
      return "We could not finish linking this terminal session. Try again below or open your account to check your browser sign-in.";
    }
    if (status === "Checking browser session") {
      return "Checking whether you already have an active browser session.";
    }
    if (status === "Continue in browser") {
      return "Continue with GitHub, email sign-in, or account creation in the browser.";
    }
    if (status === "Checking terminal request") {
      return "Verifying the terminal request so we can finish sign-in cleanly.";
    }
    if (status === "Approving terminal access") {
      return "Linking this browser session to your terminal now.";
    }
    if (status === "Approve terminal access") {
      return "Your browser session is ready. Finish linking access for this terminal session.";
    }
    return "We will open your browser and resume here when sign-in is complete.";
  }

  async function approveRequest(currentToken: string) {
    setApproving(true);
    setError(null);
    setStatus("Approving terminal access");

    try {
      await api.completeCli(currentToken);
      setStatus("Signed in");
    } catch (caught) {
      setStatus("Approve terminal access");
      setError(
        typeof caught === "object" && caught && "error" in caught
          ? String((caught as { error?: { message?: string } }).error?.message || "Could not sign you in.")
          : "Could not sign you in."
      );
    } finally {
      setApproving(false);
    }
  }

  useEffect(() => {
    async function load() {
      if (!token) {
        setStatus("Return to iTE");
        return;
      }

      setStatus("Checking browser session");
      const session = await authClient.getSession();
      if (!session.data?.session) {
        setStatus("Continue in browser");
        navigate(`/login?redirect=${encodeURIComponent(`/auth/cli?token=${token}`)}`);
        return;
      }
      setUser({
        email: session.data.user?.email,
        name: session.data.user?.name
      });
      markKnownUser();

      try {
        setStatus("Checking terminal request");
        const response = await api.inspectCliRequest(token);
        setRequest(response);

        if (response.status === "approved") {
          setStatus("Signed in");
          return;
        }

        await approveRequest(token);
      } catch (caught) {
        setStatus("Approve terminal access");
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not sign you in.")
            : "Could not sign you in."
        );
      }
    }

    void load();
  }, [navigate, token]);

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login");
  }

  return (
    <main className="auth-page auth-page-wide">
      {isComplete && user ? (
        <header className="overlay-header">
          <Link className="overlay-header-brand" data-magnetic to="/">
            <GlitchImageLogo className="overlay-header-brand-image" />
          </Link>
          <details className="account-dropdown">
            <summary className="account-dropdown-trigger">
              <span className="account-avatar">{(user.name || user.email || "i").slice(0, 1).toUpperCase()}</span>
            </summary>
            <div className="account-dropdown-menu">
              <div className="account-dropdown-meta">
                <strong>{user.name || "iTE User"}</strong>
                <span>{user.email || "Signed in"}</span>
              </div>
              <button className="account-dropdown-action" data-magnetic data-ripple onClick={() => void handleSignOut()} type="button">
                <span className="button-text" data-scramble>
                  Sign out
                </span>
              </button>
            </div>
          </details>
        </header>
      ) : null}

      <section className="auth-stage">
        <div className="auth-heading">
          <div className="auth-copy">
            <h1>{status}</h1>
            <p className="auth-flow-copy">{getStatusBody()}</p>
          </div>
        </div>

        {isComplete ? (
          <section className="auth-surface auth-complete-surface">
            {user ? (
              <div className="approval-meta">
                <span>Signed in as</span>
                <code>{user.email || user.name || "iTE User"}</code>
              </div>
            ) : null}
            <p className="auth-dismiss-note">Return to the terminal. iTE should resume automatically.</p>
            <div className="auth-actions">
              <Link className="button" data-magnetic data-ripple to="/docs">
                <span className="button-text" data-scramble>
                  Check docs
                </span>
                <span className="button-shine" />
              </Link>
              <Link className="button secondary" data-magnetic to="/account/settings">
                <span className="button-text" data-scramble>
                  Open account
                </span>
                <span className="button-border" />
              </Link>
            </div>
          </section>
        ) : (
          <section className="auth-surface">
            {request ? (
              <div className="approval-meta">
                <span>Terminal</span>
                <code>{request.clientId}</code>
              </div>
            ) : null}
            {user ? (
              <div className="approval-meta">
                <span>Signed in as</span>
                <code>{user.email || user.name || "iTE User"}</code>
              </div>
            ) : null}
            {error ? <p className="error">{error}</p> : null}
            <div className="auth-actions">
              {request && error ? (
                <button
                  className="button"
                  data-magnetic
                  data-ripple
                  disabled={approving}
                  onClick={() => void approveRequest(token)}
                  type="button"
                >
                  <span
                    className="button-text"
                    data-scramble
                    data-scramble-value={approving ? "Approving..." : "Approve access"}
                  >
                    {approving ? "Approving..." : "Approve access"}
                  </span>
                  <span className="button-shine" />
                </button>
              ) : null}
              <Link className="button secondary" data-magnetic to="/account/settings">
                <span className="button-text" data-scramble>
                  Open account
                </span>
                <span className="button-border" />
              </Link>
              <Link className="button secondary" data-magnetic to="/docs">
                <span className="button-text" data-scramble>
                  Check docs
                </span>
                <span className="button-border" />
              </Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
