import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type CliRequest = {
  clientId: string;
  deviceLabel?: string;
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
  const { isAuthenticated, user, isLoading } = useAuth();

  const [request, setRequest] = useState<CliRequest | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "connecting" | "complete"
  >("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token) {
      setError("Missing terminal sign-in token.");
      return;
    }

    if (!isAuthenticated) {
      navigate(
        `/login?redirect=${encodeURIComponent(`/auth/cli?token=${token}&resume=1`)}`,
        { replace: true },
      );
      return;
    }

    async function inspect() {
      try {
        const response = await api.inspectCliRequest(token);
        setRequest(response);

        if (response.status === "approved") {
          setStatus("complete");
          return;
        }

        setStatus("ready");
      } catch (caught) {
        const message =
          typeof caught === "object" && caught && "error" in caught
            ? String(
                (
                  caught as {
                    error?: { message?: string };
                  }
                ).error?.message || "Could not prepare device connection.",
              )
            : "Could not prepare device connection.";

        if (message.toLowerCase().includes("browser sign-in is required")) {
          navigate(
            `/login?redirect=${encodeURIComponent(`/auth/cli?token=${token}&resume=1`)}`,
            { replace: true },
          );
          return;
        }

        setError(message);
      }
    }

    void inspect();
  }, [isLoading, isAuthenticated, isResume, navigate, token]);

  async function handleConnect() {
    if (!token) {
      return;
    }

    setStatus("connecting");
    setError(null);

    try {
      await api.completeCli(token);
      setStatus("complete");
    } catch (caught) {
      const message =
        typeof caught === "object" && caught && "error" in caught
          ? String(
              (
                caught as {
                  error?: { message?: string };
                }
              ).error?.message || "Could not connect this device.",
            )
          : "Could not connect this device.";

      if (message.toLowerCase().includes("browser sign-in is required")) {
        navigate(
          `/login?redirect=${encodeURIComponent(`/auth/cli?token=${token}&resume=1`)}`,
          { replace: true },
        );
        return;
      }

      setStatus("ready");
      setError(message);
    }
  }

  const deviceLabel =
    request?.deviceLabel || request?.clientId || "ite-cli";
  const accountLabel = user?.email || user?.name || "your account";

  if (isLoading) {
    return null;
  }

  return (
    <main className="auth-page auth-page-wide">
      <header className="overlay-header">
        <Link className="overlay-header-brand" data-magnetic to="/">
          <GlitchImageLogo className="overlay-header-brand-image" />
        </Link>
      </header>

      <section className="auth-stage auth-device-stage">
        <div className="auth-heading auth-device-heading">
          <div className="auth-copy auth-device-copy">
            {status === "complete" ? (
              <>
                <p className="auth-device-emoji" aria-hidden="true">
                  check
                </p>
                <h1>Device connected</h1>
                <p className="auth-flow-copy">
                  You may now return to the terminal. iTE should continue
                  automatically.
                </p>
              </>
            ) : (
              <>
                <p className="auth-device-emoji" aria-hidden="true">
                  link
                </p>
                <h1>
                  {status === "loading"
                    ? "Preparing device"
                    : "Connect device"}
                </h1>
                <p className="auth-flow-copy">
                  {status === "loading"
                    ? "Finishing browser sign-in and preparing this terminal session."
                    : `Connect ${deviceLabel} with ${accountLabel}. This device will be paired with your account.`}
                </p>
              </>
            )}
          </div>
        </div>

        <section className="auth-surface auth-device-surface">
          {request && status !== "complete" ? (
            <div className="approval-meta">
              <span>Device</span>
              <code>{deviceLabel}</code>
            </div>
          ) : null}
          {user && status !== "complete" ? (
            <div className="approval-meta">
              <span>Account</span>
              <code>{accountLabel}</code>
            </div>
          ) : null}
          {error ? <p className="error">{error}</p> : null}
          <div className="auth-actions">
            {status === "ready" ? (
              <button
                className="button"
                data-magnetic
                data-ripple
                onClick={() => void handleConnect()}
                type="button"
              >
                <span className="button-text" data-scramble>
                  Connect
                </span>
                <span className="button-shine" />
              </button>
            ) : null}
            {status === "connecting" ? (
              <button
                className="button"
                data-magnetic
                data-ripple
                disabled
                type="button"
              >
                <span className="button-text" data-scramble>
                  Connecting...
                </span>
                <span className="button-shine" />
              </button>
            ) : null}
            {status === "complete" ? (
              <Link className="button secondary" data-magnetic to="/docs">
                <span className="button-text" data-scramble>
                  Check docs
                </span>
                <span className="button-border" />
              </Link>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
