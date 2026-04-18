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
  kind: "settings" | "docs" | "collapse";
};

function NavIcon({ kind }: NavIconProps) {
  switch (kind) {
    case "settings":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Z" />
          <path d="M19.4 15.1l.1-.1l1-1.7l-1.5-2.6l-2 .2a6.9 6.9 0 0 0-1.2-.7l-.7-1.9h-3l-.7 1.9c-.4.2-.8.4-1.2.7l-2-.2l-1.5 2.6l1 1.7l.1.1l-1.1 1.9l1.5 2.6l2.2-.2c.3.2.7.4 1 .6l.8 2h3l.8-2c.3-.2.7-.4 1-.6l2.2.2l1.5-2.6l-1.1-1.9Z" />
        </svg>
      );
    case "docs":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="M6.5 5.5h9a2 2 0 0 1 2 2v11h-9a2 2 0 0 0-2 2z" />
          <path d="M6.5 5.5a2 2 0 0 0-2 2v11h9a2 2 0 0 1 2 2" />
          <path d="M8.5 9.5h6" />
          <path d="M8.5 12.5h6" />
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
          <NavLink className={({ isActive }) => `account-nav-link ${isActive ? "is-active" : ""}`} to="/account/settings">
            <span className="account-nav-icon"><NavIcon kind="settings" /></span>
            <span className="account-nav-label">Start here</span>
          </NavLink>
          <NavLink className={({ isActive }) => `account-nav-link ${isActive ? "is-active" : ""}`} to="/docs">
            <span className="account-nav-icon"><NavIcon kind="docs" /></span>
            <span className="account-nav-label">Docs</span>
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
