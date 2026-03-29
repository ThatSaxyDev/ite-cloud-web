import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";

type CliRequest = {
  clientId: string;
  token: string;
};

export function CliAuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [request, setRequest] = useState<CliRequest | null>(null);
  const [status, setStatus] = useState("Preparing sign-in");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) {
        setStatus("Continue from iTE");
        return;
      }

      const session = await authClient.getSession();
      if (!session.data?.session) {
        navigate(`/login?redirect=${encodeURIComponent(`/auth/cli?token=${token}`)}`);
        return;
      }

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

  return (
    <main className="auth-page">
      <section className="auth-stage">
        <div className="auth-heading">
          <Link className="auth-brand" to="/">
            iTE
          </Link>
          <div className="auth-copy">
            <p>Continue</p>
            <h1>{status}</h1>
          </div>
        </div>

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
      </section>
    </main>
  );
}
