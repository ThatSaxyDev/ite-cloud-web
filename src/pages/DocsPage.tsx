import { useState } from "react";
import { Link } from "react-router-dom";

type DocNavItem = {
  id: string;
  label: string;
  description: string;
};

const DOC_NAV: readonly DocNavItem[] = [
  {
    id: "overview",
    label: "Intro",
    description: "What iTE is and the shortest way to start."
  },
  {
    id: "install",
    label: "Install",
    description: "Public install commands and local options."
  },
  {
    id: "connect",
    label: "Connect",
    description: "Sign in and choose the model service you want to use."
  },
  {
    id: "first-run",
    label: "First run",
    description: "Open iTE, run setup, and send the first prompt."
  },
  {
    id: "usage",
    label: "Usage",
    description: "What good prompts and normal usage look like."
  },
  {
    id: "sessions",
    label: "Sessions",
    description: "Understand browser sign-in and linked sessions."
  },
  {
    id: "deploy",
    label: "Deploy",
    description: "Run the API and web app in production."
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    description: "Common issues and what to check first."
  }
] as const;

const PAGE_OUTLINE = [
  { id: "overview", label: "Overview" },
  { id: "install", label: "Install" },
  { id: "connect", label: "Connect" },
  { id: "first-run", label: "First run" },
  { id: "usage", label: "Usage" },
  { id: "sessions", label: "Sessions" },
  { id: "deploy", label: "Deploy" },
  { id: "troubleshooting", label: "Troubleshooting" }
] as const;

export function DocsPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredNav = DOC_NAV.filter((item) => {
    if (!normalizedQuery) {
      return true;
    }

    return `${item.label} ${item.description}`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <main className="docs-shell">
      <section className="docs-stage">
        <header className="docs-header">
          <div className="docs-header-left">
            <Link className="docs-wordmark interactive-link" data-magnetic data-scramble to="/">
              iTE
            </Link>
            <nav className="docs-header-nav" aria-label="Docs navigation">
              <Link className="interactive-link" data-magnetic data-scramble to="/">
                Home
              </Link>
              <span className="docs-header-nav-current">Docs</span>
              <Link className="interactive-link" data-magnetic data-scramble to="/account/settings">
                App
              </Link>
            </nav>
          </div>

          <div className="docs-header-actions">
            <label className="docs-search" aria-label="Search docs sections">
              <span className="docs-search-icon" aria-hidden="true">/</span>
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search docs"
                type="search"
                value={query}
              />
              <span className="docs-search-shortcut">Ctrl K</span>
            </label>
          </div>
        </header>

        <div className="docs-layout">
          <aside className="docs-sidebar" aria-label="Documentation sections">
            <div className="docs-sidebar-group">
              <span className="docs-sidebar-label">Docs</span>
              <div className="docs-sidebar-links">
                {filteredNav.map((item) => (
                  <a className="docs-sidebar-link" href={`#${item.id}`} key={item.id}>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="docs-sidebar-group docs-sidebar-group-compact">
              <span className="docs-sidebar-label">External</span>
              <div className="docs-sidebar-links">
                <a
                  className="docs-sidebar-link"
                  href="https://github.com/ThatSaxyDev/ite"
                  rel="noreferrer"
                  target="_blank"
                >
                  <strong>GitHub</strong>
                  <span>Source code, releases, and repo issues.</span>
                </a>
                <a
                  className="docs-sidebar-link"
                  href="https://github.com/ThatSaxyDev/ite/blob/main/docs/PRODUCTION_DEPLOYMENT.md"
                  rel="noreferrer"
                  target="_blank"
                >
                  <strong>Production guide</strong>
                  <span>Render setup, auth config, and deployment details.</span>
                </a>
              </div>
            </div>
          </aside>

          <article className="docs-article">
            <section className="docs-hero-block" id="overview">
              <p className="sessions-kicker">Intro</p>
              <h1>Get started with iTE.</h1>
              <p className="docs-summary">
                iTE is an AI coding agent for the terminal. The app stays light. The docs carry
                the setup, commands, deployment details, and troubleshooting.
              </p>
              <div className="docs-inline-actions">
                <Link className="button" data-magnetic data-ripple to="/account/settings">
                  <span className="button-text">Open app</span>
                  <span className="button-shine" />
                </Link>
                <a
                  className="button secondary"
                  data-magnetic
                  href="https://github.com/ThatSaxyDev/ite"
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="button-text">View repo</span>
                </a>
              </div>
            </section>

            <section className="docs-section" id="install">
              <h2>Install</h2>
              <p>
                The fastest public install path is `pipx`, because it gives you the `ite` command
                globally without mixing it into another Python environment.
              </p>
              <div className="docs-code-block">
                <span className="docs-code-label">Terminal</span>
                <pre><code>pipx install ite-agent</code></pre>
              </div>
              <p>You can also install from source while developing locally.</p>
              <div className="docs-code-block">
                <span className="docs-code-label">Local development</span>
                <pre><code>{`git clone https://github.com/ThatSaxyDev/ite.git
cd ite
pip install -e .`}</code></pre>
              </div>
            </section>

            <section className="docs-section" id="connect">
              <h2>Connect</h2>
              <p>
                When cloud auth is enabled, iTE opens a hosted sign-in flow in the browser. After
                that, you choose the model service and credentials you want to use inside the app.
              </p>
              <ol className="docs-ordered-list">
                <li>Run `ite`.</li>
                <li>Finish browser sign-in.</li>
                <li>Return to the terminal and wait for the session to link.</li>
                <li>Run `/setup`.</li>
              </ol>
              <div className="docs-note">
                <strong>Model service support</strong>
                <p>
                  The current setup path expects an OpenAI-compatible endpoint, a valid key, and
                  the exact model name exposed by that service.
                </p>
              </div>
            </section>

            <section className="docs-section" id="first-run">
              <h2>First run</h2>
              <p>
                The first successful loop should be simple: open iTE, finish sign-in, run setup,
                and send one real prompt.
              </p>
              <div className="docs-code-block">
                <span className="docs-code-label">Command flow</span>
                <pre><code>{`ite
/setup`}</code></pre>
              </div>
              <div className="docs-checklist">
                <div className="docs-checklist-item">
                  <strong>Base URL</strong>
                  <span>Use the exact API endpoint the model service expects.</span>
                </div>
                <div className="docs-checklist-item">
                  <strong>API key</strong>
                  <span>Paste a valid key for the selected service.</span>
                </div>
                <div className="docs-checklist-item">
                  <strong>Model name</strong>
                  <span>Use the exact model identifier exposed by the service.</span>
                </div>
              </div>
            </section>

            <section className="docs-section" id="usage">
              <h2>Usage</h2>
              <p>
                Once setup is complete, use iTE normally. Ask questions about the codebase, request
                changes, or iterate on plans before implementation.
              </p>
              <div className="docs-example-grid">
                <article className="detail-card docs-example-card">
                  <span className="onboarding-step-eyebrow">Ask</span>
                  <p>Explain how authentication works in this repo.</p>
                </article>
                <article className="detail-card docs-example-card">
                  <span className="onboarding-step-eyebrow">Change</span>
                  <p>Add a loading state to the sessions page and verify the build.</p>
                </article>
                <article className="detail-card docs-example-card">
                  <span className="onboarding-step-eyebrow">Plan</span>
                  <p>Draft the rollout plan for shipping the API on Render tonight.</p>
                </article>
              </div>
            </section>

            <section className="docs-section" id="sessions">
              <h2>Sessions</h2>
              <p>
                Sessions help you verify where you are signed in and revoke stale terminal links if
                needed. They are available in the app, but they should stay secondary to setup and
                usage.
              </p>
              <p>
                Open the account area if you need to confirm a linked session, inspect recent
                activity on that session, or revoke access from a machine you no longer use.
              </p>
            </section>

            <section className="docs-section" id="deploy">
              <h2>Deploy</h2>
              <p>
                The current production path is Render for the API and web app, with SQLite stored
                on a persistent disk for the API service.
              </p>
              <div className="docs-code-block">
                <span className="docs-code-label">Required API environment</span>
                <pre><code>{`HOST=0.0.0.0
PORT=4000
WEB_ORIGIN=https://app.example.com
BETTER_AUTH_URL=https://api.example.com
BETTER_AUTH_SECRET=<strong secret>
SQLITE_PATH=/data/ite-cloud-api.sqlite`}</code></pre>
              </div>
              <p>
                The full deployment runbook remains available in the external production guide for
                the exact Render setup.
              </p>
            </section>

            <section className="docs-section" id="troubleshooting">
              <h2>Troubleshooting</h2>
              <div className="docs-faq-list">
                <article className="detail-card docs-faq-card">
                  <strong>Browser sign-in does not finish</strong>
                  <p className="muted">
                    Check that the browser opened the correct hosted app, then confirm the API
                    origin, web origin, and GitHub OAuth callback all match production.
                  </p>
                </article>
                <article className="detail-card docs-faq-card">
                  <strong>Requests fail after setup</strong>
                  <p className="muted">
                    Check the base URL, confirm the key is valid, and verify that the model name is
                    exactly correct for that service.
                  </p>
                </article>
                <article className="detail-card docs-faq-card">
                  <strong>Session disappears after restart</strong>
                  <p className="muted">
                    Confirm the cloud API is writing to persistent SQLite storage and that refresh
                    requests can still reach the same API origin.
                  </p>
                </article>
              </div>
            </section>
          </article>

          <aside className="docs-outline" aria-label="On this page">
            <span className="docs-sidebar-label">On this page</span>
            <div className="docs-outline-links">
              {PAGE_OUTLINE.map((item) => (
                <a className="docs-outline-link" href={`#${item.id}`} key={item.id}>
                  {item.label}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
