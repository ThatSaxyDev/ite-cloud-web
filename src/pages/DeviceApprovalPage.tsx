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
        setStatus(`Authorize ${request.clientId} to access your iTE account?`);
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
        setStatus("Device approved. You can return to the terminal.");
      } else {
        await api.denyDevice(userCode);
        setStatus("Device denied.");
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
    <main className="shell stack">
      <section className="panel stack">
        <span className="eyebrow">Device approval</span>
        <h1>{status}</h1>
        <p className="muted">Code: {userCode || "missing"}</p>
        {error ? <p className="error">{error}</p> : null}
        {ready ? (
          <div className="row">
            <button className="button" onClick={() => void handleAction("approve")} type="button">
              Approve
            </button>
            <button className="button secondary" onClick={() => void handleAction("deny")} type="button">
              Deny
            </button>
          </div>
        ) : (
          <Link className="button secondary" to="/">
            Back home
          </Link>
        )}
      </section>
    </main>
  );
}
