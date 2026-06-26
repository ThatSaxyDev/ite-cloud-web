import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { GlitchImageLogo } from "@/components/GlitchImageLogo";
import { useAuth } from "@/lib/auth-context";

type NavIconProps = {
  kind: "start" | "settings" | "docs" | "collapse" | "usage" | "billing" | "sessions";
};

function NavIcon({ kind }: NavIconProps) {
  switch (kind) {
    case "start":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="m4.5 11.5l7.5-6l7.5 6" />
          <path d="M7 10.5v8h10v-8" />
          <path d="M10 18.5v-5h4v5" />
        </svg>
      );
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
    case "usage":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="M5 18.5h14" />
          <path d="M7.5 15.5v-4" />
          <path d="M12 15.5v-8" />
          <path d="M16.5 15.5V10" />
        </svg>
      );
    case "billing":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="M4.5 7.5h15" />
          <path d="M6 5.5h12a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 18 18.5H6A1.5 1.5 0 0 1 4.5 17V7A1.5 1.5 0 0 1 6 5.5Z" />
          <path d="M15.5 13h2" />
        </svg>
      );
    case "sessions":
      return (
        <svg aria-hidden="true" className="account-nav-icon-svg" viewBox="0 0 24 24">
          <path d="M7 18.5h10" />
          <path d="M8 5.5h8a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 16 16.5H8A1.5 1.5 0 0 1 6.5 15V7A1.5 1.5 0 0 1 8 5.5Z" />
          <path d="M11 8.5h2" />
          <path d="M10 12h4" />
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
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function toggleCollapsed() {
    setSettingsExpanded(false);
    setCollapsed((current) => !current);
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileNavOpen]);

  const settingsSectionActive =
    location.pathname.startsWith("/account/usage") ||
    location.pathname.startsWith("/account/billing") ||
    location.pathname.startsWith("/account/sessions");

  const settingsOpen = !collapsed && (settingsExpanded || settingsSectionActive);

  const initial = (user?.name || user?.email || "I").slice(0, 1).toUpperCase();

  return (
    <main className="account-shell" data-mobile-nav-open={mobileNavOpen}>
      <aside className={`account-sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="account-sidebar-top">
          <div className="account-sidebar-head">
            <Link className="auth-brand account-brand" to="/" onClick={closeMobileNav}>
              <GlitchImageLogo className="overlay-header-brand-image" />
            </Link>
            <button
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              className="account-rail-toggle"
              onClick={toggleCollapsed}
              type="button"
            >
              <span className={`account-toggle-icon ${collapsed ? "is-collapsed" : ""}`}>
                <NavIcon kind="collapse" />
              </span>
            </button>
            <button
              aria-controls="account-mobile-nav"
              aria-expanded={mobileNavOpen}
              className="account-mobile-menu-button"
              onClick={() => setMobileNavOpen((current) => !current)}
              type="button"
            >
              {mobileNavOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        <button
          aria-label="Close account navigation"
          className="account-mobile-nav-scrim"
          onClick={closeMobileNav}
          type="button"
        />

        <div className="account-sidebar-panel" id="account-mobile-nav">
          <nav className="account-nav" aria-label="Account sections">
            <NavLink
              aria-label="Start here"
              className={({ isActive }) =>
                `account-nav-link ${isActive ? "is-active" : ""}`
              }
              to="/account/settings"
              onClick={closeMobileNav}
            >
              <span className="account-nav-icon">
                <NavIcon kind="start" />
              </span>
              <span className="account-nav-label">Start here</span>
            </NavLink>
            <div
              className={`account-nav-group ${settingsOpen ? "is-open" : ""}`}
              onMouseEnter={() => {
                if (!collapsed) {
                  setSettingsExpanded(true);
                }
              }}
              onMouseLeave={() => setSettingsExpanded(false)}
            >
              <button
                aria-expanded={settingsOpen}
                aria-label="Settings"
                className={`account-nav-link account-nav-link-button ${settingsSectionActive ? "is-active" : ""}`}
                onClick={() => setSettingsExpanded((current) => !current)}
                type="button"
              >
                <span className="account-nav-icon">
                  <NavIcon kind="settings" />
                </span>
                <span className="account-nav-label">Settings</span>
              </button>
              <div className="account-nav-submenu">
                <NavLink
                  className={({ isActive }) =>
                    `account-nav-sublink ${isActive ? "is-active" : ""}`
                  }
                  aria-label="Usage"
                  to="/account/usage"
                  onClick={closeMobileNav}
                >
                  <span className="account-nav-icon">
                    <NavIcon kind="usage" />
                  </span>
                  <span className="account-nav-label">Usage</span>
                </NavLink>
                <NavLink
                  className={({ isActive }) =>
                    `account-nav-sublink ${isActive ? "is-active" : ""}`
                  }
                  aria-label="Billing"
                  to="/account/billing"
                  onClick={closeMobileNav}
                >
                  <span className="account-nav-icon">
                    <NavIcon kind="billing" />
                  </span>
                  <span className="account-nav-label">Billing</span>
                </NavLink>
                <NavLink
                  className={({ isActive }) =>
                    `account-nav-sublink ${isActive ? "is-active" : ""}`
                  }
                  aria-label="Sessions"
                  to="/account/sessions"
                  onClick={closeMobileNav}
                >
                  <span className="account-nav-icon">
                    <NavIcon kind="sessions" />
                  </span>
                  <span className="account-nav-label">Sessions</span>
                </NavLink>
              </div>
            </div>
            <NavLink
              aria-label="Docs"
              className={({ isActive }) =>
                `account-nav-link ${isActive ? "is-active" : ""}`
              }
              to="/docs"
              onClick={closeMobileNav}
            >
              <span className="account-nav-icon">
                <NavIcon kind="docs" />
              </span>
              <span className="account-nav-label">Docs</span>
            </NavLink>
          </nav>

          <div className="account-sidebar-bottom">
            <div className="account-user-block">
              <span className="account-user-avatar">
                {user?.image ? (
                  <img
                    alt={user.name || user.email || "iTE user"}
                    className="account-user-avatar-image"
                    src={user.image}
                  />
                ) : (
                  initial
                )}
              </span>
              <div className="account-user-meta">
                <strong>{user?.name || "iTE User"}</strong>
                <span>{user?.email || "Signed in"}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section
        className="account-content"
        onClick={mobileNavOpen ? closeMobileNav : undefined}
      >
        <Outlet />
      </section>
    </main>
  );
}
