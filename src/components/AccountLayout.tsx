import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { authClient } from "@/lib/auth-client";
import { markKnownUser } from "@/lib/browser-state";

type BrowserUser = {
  email?: string;
  name?: string;
  image?: string | null;
};

type NavIconProps = {
  kind: "billing" | "sessions" | "activity" | "settings" | "collapse";
};

function NavIcon({ kind }: NavIconProps) {
  switch (kind) {
    case "billing":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="M4 7.5h16M6 4.5h12a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5Z" />
          <path d="M8 13.5h4" />
        </svg>
      );
    case "sessions":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <rect x="5" y="5" width="10" height="10" rx="1.5" />
          <path d="M9 19h10M19 9v10" />
        </svg>
      );
    case "activity":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="M5 6.5h14" />
          <path d="M5 12h14" />
          <path d="M5 17.5h14" />
          <circle cx="8" cy="6.5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="16" cy="17.5" r="1" />
        </svg>
      );
    case "settings":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Z" />
          <path d="M19.4 15.1l.1-.1l1-1.7l-1.5-2.6l-2 .2a6.9 6.9 0 0 0-1.2-.7l-.7-1.9h-3l-.7 1.9c-.4.2-.8.4-1.2.7l-2-.2l-1.5 2.6l1 1.7l.1.1l-1.1 1.9l1.5 2.6l2.2-.2c.3.2.7.4 1 .6l.8 2h3l.8-2c.3-.2.7-.4 1-.6l2.2.2l1.5-2.6l-1.1-1.9Z" />
        </svg>
      );
    case "collapse":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="m15 6l-6 6l6 6" />
        </svg>
      );
  }
}

export function AccountLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<BrowserUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);

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
        name: session.data.user?.name,
        image: session.data.user?.image
      });
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, navigate]);

  function toggleCollapsed() {
    setCollapsed((current) => !current);
  }

  const initial = (user?.name || user?.email || "I").slice(0, 1).toUpperCase();

  return (
    <main className="account-shell">
      <aside className={`account-sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="account-sidebar-top">
          <div className="account-sidebar-head">
            <Link className="auth-brand account-brand" data-magnetic to="/">
              <GlitchImageLogo className="overlay-header-brand-image" />
            </Link>
            <button
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              className="account-rail-toggle"
              data-magnetic
              onClick={toggleCollapsed}
              type="button"
            >
              <span className={`account-toggle-icon ${collapsed ? "is-collapsed" : ""}`}>
                <NavIcon kind="collapse" />
              </span>
            </button>
          </div>
        </div>

        <nav className="account-nav" aria-label="Account sections">
          <NavLink className={({ isActive }) => `account-nav-link ${isActive ? "is-active" : ""}`} to="/account/billing">
            <span className="account-nav-icon"><NavIcon kind="billing" /></span>
            <span className="account-nav-label">Billing</span>
          </NavLink>
          <NavLink className={({ isActive }) => `account-nav-link ${isActive ? "is-active" : ""}`} to="/account/sessions">
            <span className="account-nav-icon"><NavIcon kind="sessions" /></span>
            <span className="account-nav-label">Sessions</span>
          </NavLink>
          <NavLink className={({ isActive }) => `account-nav-link ${isActive ? "is-active" : ""}`} to="/account/activity">
            <span className="account-nav-icon"><NavIcon kind="activity" /></span>
            <span className="account-nav-label">Activity</span>
          </NavLink>
          <NavLink className={({ isActive }) => `account-nav-link ${isActive ? "is-active" : ""}`} to="/account/settings">
            <span className="account-nav-icon"><NavIcon kind="settings" /></span>
            <span className="account-nav-label">Settings</span>
          </NavLink>
        </nav>

        <div className="account-sidebar-bottom">
          <div className="account-user-block">
            <span className="account-user-avatar">
              {user?.image ? <img alt={user.name || user.email || "iTE user"} className="account-user-avatar-image" src={user.image} /> : initial}
            </span>
            <div className="account-user-meta">
              <strong>{user?.name || "iTE User"}</strong>
              <span>{user?.email || "Signed in"}</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="account-content">
        <Outlet />
      </section>
    </main>
  );
}
