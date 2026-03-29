import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import iteImage from "@/assets/ite-image.png";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";

type CliRequest = {
  clientId: string;
  token: string;
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
  const isComplete = status === "Signed in" && !error;

  useEffect(() => {
    async function load() {
      if (!token) {
        setStatus("Return to iTE");
        return;
      }

      const session = await authClient.getSession();
      if (!session.data?.session) {
        navigate(`/login?redirect=${encodeURIComponent(`/auth/cli?token=${token}`)}`);
        return;
      }
      setUser({
        email: session.data.user?.email,
        name: session.data.user?.name
      });

      try {
        const response = (await api.inspectCliRequest(token)) as CliRequest;
        setRequest(response);
        await api.completeCli(token);
        setStatus("Signed in");
      } catch (caught) {
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
          <Link className="overlay-header-brand" to="/">
            <img alt="iTE" className="overlay-header-brand-image" src={iteImage} />
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
              <button className="account-dropdown-action" onClick={() => void handleSignOut()} type="button">
                Sign out
              </button>
            </div>
          </details>
        </header>
      ) : null}

      <section className="auth-stage">
        <div className="auth-heading">
          <div className="auth-copy">
            <h1>{status}</h1>
          </div>
        </div>

        {isComplete ? (
          <p className="auth-dismiss-note">You may now close this window.</p>
        ) : (
          <section className="auth-surface">
            {request ? (
              <div className="approval-meta">
                <span>Account</span>
                <code>{request.clientId}</code>
              </div>
            ) : null}
            {error ? <p className="error">{error}</p> : null}
            <div className="auth-actions">
              <Link className="button secondary" to="/account/sessions">
                Account
              </Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
