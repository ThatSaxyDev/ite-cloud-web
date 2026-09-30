import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { authClient } from "@/lib/auth-client";
import { markKnownUser } from "@/lib/browser-state";
import { getDevAuthUser } from "@/lib/dev-auth";

export type AccountUser = {
  email?: string;
  name?: string;
  image?: string | null;
};
const sections = [
  ["settings", "Home"],
  ["usage", "Usage"],
  ["billing", "Billing"],
  ["sessions", "Sessions"],
] as const;

export function AccountLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [authError, setAuthError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setAuthError(false);
    async function load() {
      try {
        const dev = getDevAuthUser();
        if (dev) {
          if (!cancelled) setUser(dev);
          return;
        }
        const session = await authClient.getSession();
        if (cancelled) return;
        if (session.error) {
          setAuthError(true);
          return;
        }
        if (!session.data?.session) {
          navigate(
            `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`,
            { replace: true },
          );
          return;
        }
        markKnownUser();
        setUser(session.data.user);
      } catch {
        if (!cancelled) setAuthError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [navigate, retry]);
  async function signOut() {
    setPending(true);
    setError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
      navigate("/login?signedOut=1", { replace: true });
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="account-workspace">
      <a className="skip-link" href="#account-main">
        Skip to account content
      </a>
      <header className="workspace-header">
        <Link to="/" aria-label="iTE landing page" className="workspace-brand">
          <GlitchImageLogo />
        </Link>
        <span className="workspace-wordmark">YOUR ACCOUNT</span>
        <Link to="/docs">Documentation ↗</Link>
      </header>
      <div className="workspace-layout">
        <aside className="workspace-rail">
          <nav aria-label="Account navigation">
            {sections.map(([path, title]) => (
              <NavLink
                key={path}
                to={`/account/${path}`}
                className={({ isActive }) => (isActive ? "is-active" : "")}
              >
                {title}
                <span aria-hidden="true">↗</span>
              </NavLink>
            ))}
          </nav>
          <div className="workspace-identity">
            <span className="workspace-avatar" aria-hidden="true">
              {(user?.name || user?.email || "i").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user?.name || "Your account"}</strong>
              <span>{user?.email || "Connecting…"}</span>
            </div>
          </div>
          <button
            className="workspace-signout"
            onClick={() => void signOut()}
            disabled={pending || !user}
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
          {error && (
            <p className="workspace-error" role="alert">
              {error}
            </p>
          )}
        </aside>
        <section className="workspace-main" id="account-main" tabIndex={-1}>
          {authError ? (
            <div className="workspace-empty">
              <h1>Connection interrupted.</h1>
              <p>
                We couldn’t verify your sign-in. Your account hasn’t been
                changed.
              </p>
              <button
                className="workspace-action"
                onClick={() => setRetry((v) => v + 1)}
              >
                Try again
              </button>
            </div>
          ) : user ? (
            <Outlet context={user} />
          ) : (
            <p role="status">Connecting to your account…</p>
          )}
        </section>
      </div>
    </main>
  );
}
