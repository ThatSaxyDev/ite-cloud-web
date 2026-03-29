import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export function DeviceApprovalPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const userCode = (params.get("user_code") || "").toUpperCase();
  const [status, setStatus] = useState("Loading device request...");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      if (!userCode) {
        setError("Missing user code.");
        return;
      }
      const session = await authClient.getSession();
      if (!session.data?.session) {
        navigate(`/login?redirect=${encodeURIComponent(`/device/approve?user_code=${userCode}`)}`);
        return;
      }
      try {
        const request = (await api.inspectDevice(userCode)) as {
          clientId: string;
        };
        setStatus(`Allow ${request.clientId}?`);
        setReady(true);
      } catch (caught) {
        setError(
          typeof caught === "object" && caught && "error" in caught
            ? String((caught as { error?: { message?: string } }).error?.message || "Request not found.")
            : "Request not found."
        );
      }
    }

    void load();
  }, [navigate, userCode]);

  async function handleAction(action: "approve" | "deny") {
    try {
      if (action === "approve") {
        await api.approveDevice(userCode);
        setStatus("Approved. Return to iTE.");
      } else {
        await api.denyDevice(userCode);
        setStatus("Request denied.");
      }
      setReady(false);
    } catch (caught) {
      setError(
        typeof caught === "object" && caught && "error" in caught
          ? String((caught as { error?: { message?: string } }).error?.message || "Action failed.")
          : "Action failed."
      );
    }
  }

  return (
    <main className="center-shell">
      <section className="center-stage">
        <div className="page-block">
          <span className="eyebrow">Approval</span>
          <h1>{status}</h1>
          <p className="muted">{userCode ? `Code ${userCode}` : "Missing code."}</p>
          {error ? <p className="error">{error}</p> : null}
          {ready ? (
            <div className="center-actions">
              <button className="button" onClick={() => void handleAction("approve")} type="button">
                Approve
              </button>
              <button className="button secondary" onClick={() => void handleAction("deny")} type="button">
                Deny
              </button>
            </div>
          ) : (
            <div className="center-actions">
              <Link className="button secondary" to="/">
                Back
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
