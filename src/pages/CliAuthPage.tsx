import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { api } from "@/lib/api";

type CliRequest = {
  clientId: string;
  token: string;
  status: string;
  expiresAt?: string;
  scope?: string | null;
};

export function CliAuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const isResume = params.get("resume") === "1";
  const [request, setRequest] = useState<CliRequest | null>(null);
  const [status, setStatus] = useState("Finishing sign-in");
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const isComplete = status === "Signed in" && !error;

  function getStatusBody() {
    if (isComplete) {
      return "You are signed in. Return to iTE in the terminal to continue.";
    }
    if (error) {
      return "We could not finish linking this terminal session. Try again below.";
    }
    if (status === "Finishing sign-in") {
      return "Linking your browser session to the terminal now.";
    }
    if (status === "Continue in browser") {
      return "Continue with GitHub, email sign-in, or account creation in the browser.";
    }
    if (status === "Approving terminal access") {
      return "Linking this browser session to your terminal now.";
    }
    return "We will resume here when sign-in is complete.";
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

      if (!isResume) {
        navigate(`/login?redirect=${encodeURIComponent(`/auth/cli?token=${token}&resume=1`)}`, { replace: true });
        return;
      }

      try {
        const response = await api.inspectCliRequest(token);
        setRequest(response);

        if (response.status === "approved") {
          setStatus("Signed in");
          return;
        }

        await approveRequest(token);
      } catch (caught) {
        const message =
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not sign you in.")
            : "Could not sign you in.";

        if (message.toLowerCase().includes("browser sign-in is required")) {
          navigate(`/login?redirect=${encodeURIComponent(`/auth/cli?token=${token}&resume=1`)}`, { replace: true });
          return;
        }

        setStatus("Finish sign-in");
        setError(
          message
        );
      }
    }

    void load();
  }, [isResume, navigate, token]);

  return (
    <main className="auth-page auth-page-wide">
      {isComplete ? (
        <header className="overlay-header">
          <Link className="overlay-header-brand" data-magnetic to="/">
            <GlitchImageLogo className="overlay-header-brand-image" />
          </Link>
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
            <p className="auth-dismiss-note">Return to the terminal. iTE should resume automatically.</p>
            <p className="auth-dismiss-note">If you want to keep exploring here, you can check the docs.</p>
            <div className="auth-actions">
              <Link className="button secondary" data-magnetic to="/docs">
                <span className="button-text" data-scramble>
                  Check docs
                </span>
                <span className="button-border" />
              </Link>
            </div>
          </section>
        ) : error ? (
          <section className="auth-surface">
            {request ? (
              <div className="approval-meta">
                <span>Terminal</span>
                <code>{request.clientId}</code>
              </div>
            ) : null}
            {error ? <p className="error">{error}</p> : null}
            <div className="auth-actions">
              {request ? (
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
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
