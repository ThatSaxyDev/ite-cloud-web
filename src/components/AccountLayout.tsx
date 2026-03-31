import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { authClient } from "@/lib/auth-client";
import { markKnownUser } from "@/lib/browser-state";

type BrowserUser = {
  email?: string;
  name?: string;
};

export function AccountLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<BrowserUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = await authClient.getSession();
      if (!session.data?.session) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      if (cancelled) {
        return;
      }
      markKnownUser();
      setUser({
        email: session.data.user?.email,
        name: session.data.user?.name
      });
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, navigate]);

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login");
  }

  return (
    <main className="account-shell">
      <aside className="account-sidebar">
        <div className="account-sidebar-top">
          <Link className="auth-brand" data-magnetic to="/">
            <GlitchImageLogo className="overlay-header-brand-image" />
          </Link>
          <div className="account-sidebar-copy">
            <p className="sessions-kicker">Account</p>
            <h1>Manage your account</h1>
            <p className="muted">Billing, device access, and account settings.</p>
          </div>
        </div>

        <nav className="account-nav" aria-label="Account sections">
          <NavLink className={({ isActive }) => `account-nav-link ${isActive ? "is-active" : ""}`} to="/account/billing">
            Billing
          </NavLink>
          <NavLink className={({ isActive }) => `account-nav-link ${isActive ? "is-active" : ""}`} to="/account/sessions">
            Sessions
          </NavLink>
          <NavLink className={({ isActive }) => `account-nav-link ${isActive ? "is-active" : ""}`} to="/account/settings">
            Settings
          </NavLink>
        </nav>

        <div className="account-sidebar-bottom">
          <div className="account-user-meta">
            <strong>{user?.name || "iTE User"}</strong>
            <span>{user?.email || "Signed in"}</span>
          </div>
          <button className="button secondary" data-magnetic onClick={() => void handleSignOut()} type="button">
            <span className="button-text" data-scramble>
              Sign out
            </span>
            <span className="button-border" />
          </button>
        </div>
      </aside>

      <section className="account-content">
        <Outlet />
      </section>
    </main>
  );
}
