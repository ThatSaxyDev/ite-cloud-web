import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { AccountUser } from "@/components/AccountLayout";
import { api } from "@/lib/api";
import { useAccountResource } from "@/lib/use-account-resource";
import {
  detectDefaultInstallMethod,
  getInstallMethodLabel,
  INSTALL_COMMANDS,
  type InstallMethod,
} from "@/lib/install-command";

export function SettingsPage() {
  const user = useOutletContext<AccountUser>();
  const billing = useAccountResource(api.billingMe);
  const sessions = useAccountResource(api.listSessions);
  const [method, setMethod] = useState<InstallMethod>(
    detectDefaultInstallMethod,
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copy(command: string) {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(command);
      setCopied(command);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopyError(true);
    }
  }
  const active = sessions.data?.sessions.filter((s) => !s.revokedAt);
  return (
    <section className="workspace-page account-home">
      <header className="workspace-pagehead">
        <div>
          <p className="workspace-kicker">
            HOME / {user.name?.split(" ")[0] || "YOUR ACCOUNT"}
          </p>
          <h1>
            Back to the
            <br />
            <span>terminal.</span>
          </h1>
          <p>Your account lives here. The work happens in your codebase.</p>
        </div>
        <Link className="workspace-textlink" to="/docs">
          Need a hand? ↗
        </Link>
      </header>
      <div className="home-launch">
        <section className="home-install" aria-labelledby="install-title">
          <p className="workspace-kicker">MAKE THE CONNECTION</p>
          <h2 id="install-title">Put iTE in your terminal.</h2>
          <div className="workspace-methods" aria-label="Install method">
            {(["curl", "windows", "pipx", "uv"] as const).map((m) => (
              <button
                key={m}
                aria-pressed={method === m}
                onClick={() => {
                  setMethod(m);
                  setCopied(null);
                  setCopyError(false);
                }}
              >
                {getInstallMethodLabel(m)}
              </button>
            ))}
          </div>
          <div className="workspace-command">
            <span aria-hidden="true">$</span>
            <code>{INSTALL_COMMANDS[method]}</code>
            <button onClick={() => void copy(INSTALL_COMMANDS[method])}>
              {copied === INSTALL_COMMANDS[method] ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="home-run">
            <p>Then open a project and run</p>
            <div className="workspace-command">
              <span aria-hidden="true">$</span>
              <code>ite</code>
              <button onClick={() => void copy("ite")}>
                {copied === "ite" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <p className="workspace-muted">
            Follow the sign-in prompt to connect your terminal to this account.
          </p>
          <p className="workspace-muted" role="status">
            {copyError
              ? "Clipboard unavailable. Select the command and copy it manually."
              : copied
                ? "Command copied to clipboard."
                : ""}
          </p>
        </section>
        <aside className="home-access">
          <p className="workspace-kicker">YOUR ACCESS</p>
          <h2>
            {billing.data
              ? billing.data.entitlements.proAccess
                ? "iTE Pro"
                : "Free"
              : billing.error
                ? "Unavailable"
                : "Connecting…"}
          </h2>
          {billing.error ? (
            <>
              <p role="alert">{billing.error}</p>
              <button
                className="workspace-textlink"
                onClick={() => void billing.refresh()}
              >
                Retry connection ↗
              </button>
            </>
          ) : (
            <>
              <p>
                {billing.data
                  ? billing.data.entitlements.bundledInference
                    ? "Cloud inference is included with your account."
                    : "Use your own provider or a local model. Pro adds bundled cloud inference."
                  : "Checking your account access."}
              </p>
              <Link className="workspace-textlink" to="/account/billing">
                {billing.data?.entitlements.proAccess
                  ? "Manage your plan"
                  : "Explore Pro"}{" "}
                ↗
              </Link>
            </>
          )}
          <div className="home-access-links">
            <Link to="/account/usage">
              Check usage <span>↗</span>
            </Link>
            <Link to="/docs#configure">
              Configure a provider <span>↗</span>
            </Link>
          </div>
        </aside>
      </div>
      <section className="home-terminals">
        <div>
          <p className="workspace-kicker">TERMINAL CONNECTIONS</p>
          <h2>
            {active
              ? `${active.length} connected ${active.length === 1 ? "terminal" : "terminals"}`
              : sessions.error
                ? "Connection unavailable"
                : "Checking terminals…"}
          </h2>
          <p>
            {sessions.error ||
              (active?.length
                ? "Manage which devices can use this account."
                : "Your terminal will appear here after you sign in from iTE.")}
          </p>
          {sessions.error && (
            <button
              className="workspace-textlink"
              onClick={() => void sessions.refresh()}
            >
              Try again ↗
            </button>
          )}
        </div>
        <Link className="workspace-textlink" to="/account/sessions">
          Manage sessions ↗
        </Link>
      </section>
      <details className="home-demo">
        <summary>
          See iTE at work <span>↗</span>
        </summary>
        <video
          controls
          playsInline
          preload="none"
          poster="/ite-prev.png"
          src="/demo.mp4"
        />
      </details>
    </section>
  );
}
