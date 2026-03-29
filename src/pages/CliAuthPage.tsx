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
        setStatus("Start this flow from iTE.");
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
        setStatus("Signed in. Return to iTE.");
      } catch (caught) {
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Could not complete sign-in.")
            : "Could not complete sign-in."
        );
      }
    }

    void load();
  }, [navigate, token]);

  return (
    <main className="center-shell">
      <section className="center-stage wide">
        <div className="page-block">
          <span className="eyebrow">Continue</span>
          <h1>{status}</h1>
          <p className="muted">You can return to your terminal now.</p>
          {error ? <p className="error">{error}</p> : null}
          <div className="center-actions">
            <Link className="button secondary" to="/account/sessions">
              Manage devices
            </Link>
          </div>
        </div>
        {request ? <p className="muted">Request: {request.clientId}</p> : null}
      </section>
    </main>
  );
}
