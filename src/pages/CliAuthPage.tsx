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
  const [status, setStatus] = useState("Preparing your iTE login...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) {
        setStatus("Open this page from the iTE terminal login flow.");
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
        setStatus("You are signed in. Return to the iTE terminal to continue.");
      } catch (caught) {
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not complete terminal login.")
            : "Could not complete terminal login."
        );
      }
    }

    void load();
  }, [navigate, token]);

  return (
    <main className="shell stack">
      <section className="panel stack">
        <span className="eyebrow">Continue to iTE</span>
        <h1>{status}</h1>
        <p className="muted">
          This page completes the browser step for your terminal login. When the flow succeeds,
          the terminal should detect it automatically and continue.
        </p>
        {request ? (
          <div className="stack">
            <span className="muted">Client: {request.clientId}</span>
            <span className="muted">Linked login token is active until browser approval completes.</span>
          </div>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        <div className="row">
          <Link className="button secondary" to="/account/sessions">
            View sessions
          </Link>
        </div>
      </section>
    </main>
  );
}
