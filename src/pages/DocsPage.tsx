import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GlitchImageLogo } from "@/components/GlitchImageLogo";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

type DocNavItem = {
  id: string;
  label: string;
  description: string;
};

const DOC_NAV: readonly DocNavItem[] = [
  {
    id: "intro",
    label: "Intro",
    description: "What iTE is and the shortest way to start.",
  },
  {
    id: "prerequisites",
    label: "Prerequisites",
    description: "What you need before installing iTE.",
  },
  {
    id: "install",
    label: "Install",
    description: "Public install commands and local options.",
  },
  {
    id: "configure",
    label: "Configure",
    description: "Set up your model provider.",
  },
  {
    id: "init",
    label: "Initialize",
    description: "Project setup with AGENTS.md.",
  },
  {
    id: "usage",
    label: "Usage",
    description: "Everyday workflows and commands.",
  },
  { id: "commands", label: "Commands", description: "Full command reference." },
  { id: "tools", label: "Tools", description: "Built-in tools reference." },
  {
    id: "agents",
    label: "AGENTS.md",
    description: "Project instructions for the AI.",
  },
  { id: "skills", label: "Skills", description: "Bundles of expertise." },
  {
    id: "subagents",
    label: "Subagents",
    description: "Specialist agents for parallel tasks.",
  },
  { id: "mcp", label: "MCP", description: "External tool servers." },
] as const;

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="docs-code-block">
      <div className="docs-code-header">
        <span className="docs-code-label">{label}</span>
        <button className="docs-copy-button" onClick={handleCopy} type="button">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SidebarContent({
  query,
  setQuery,
  filteredNav,
  closeMobileNav,
}: {
  query: string;
  setQuery: (q: string) => void;
  filteredNav: DocNavItem[];
  closeMobileNav: () => void;
}) {
  return (
    <>
      {/* Search in sidebar */}
      <div className="docs-sidebar-search">
        <label
          className="docs-search docs-search-sidebar"
          aria-label="Search docs sections"
        >
          <span className="docs-search-icon" aria-hidden="true">
            /
          </span>
          <input
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs"
            type="search"
            value={query}
          />
        </label>
      </div>

      <div className="docs-sidebar-group">
        <span className="docs-sidebar-label">Docs</span>
        <div className="docs-sidebar-links">
          {filteredNav.length > 0 ? (
            filteredNav.map((item) => (
              <a
                className="docs-sidebar-link"
                href={`#${item.id}`}
                key={item.id}
                onClick={closeMobileNav}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </a>
            ))
          ) : (
            <div className="docs-sidebar-empty">No results found</div>
          )}
        </div>
      </div>

      <div className="docs-sidebar-group docs-sidebar-group-compact">
        <span className="docs-sidebar-label">External</span>
        <div className="docs-sidebar-links">
          <a
            className="docs-sidebar-link"
            href="https://pypi.org/project/ite-agent/"
            rel="noreferrer"
            target="_blank"
          >
            <strong>PyPI</strong>
            <span>Package and installation details.</span>
          </a>
        </div>
      </div>
    </>
  );
}

export function DocsPage() {
  const [query, setQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredNav = DOC_NAV.filter((item) => {
    if (!normalizedQuery) return true;
    return `${item.label} ${item.description}`
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setMobileNavOpen(false);

  // Auto-hide/show header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Always show header at top of page
      if (currentScrollY < 60) {
        setHeaderVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Hide when scrolling down, show when scrolling up
      if (scrollDelta > 10) {
        setHeaderVisible(false);
      } else if (scrollDelta < -10) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        drawerRef.current?.contains(target) ||
        headerRef.current?.contains(target)
      ) {
        return;
      }
      closeMobileNav();
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [mobileNavOpen]);

  return (
    <main className="docs-shell">
      {/* Persistent Mobile Header */}
      <header
        ref={headerRef}
        className="docs-mobile-header"
        data-visible={headerVisible}
      >
        <div className="docs-mobile-header-inner">
          <button
            aria-label="Open navigation"
            className="docs-mobile-menu-btn"
            onClick={toggleMobileNav}
            type="button"
          >
            <MenuIcon />
          </button>
          <Link className="docs-mobile-logo" to="/" onClick={closeMobileNav}>
            <GlitchImageLogo />
          </Link>
          <div className="docs-mobile-header-spacer" />
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div
          aria-hidden="true"
          className="docs-mobile-nav-overlay"
          onClick={closeMobileNav}
        />
      )}
      <aside
        ref={drawerRef}
        className="docs-mobile-drawer"
        data-open={mobileNavOpen}
        aria-label="Documentation sections"
      >
        <div className="docs-mobile-drawer-header">
          <Link className="docs-mobile-logo" to="/" onClick={closeMobileNav}>
            <GlitchImageLogo />
          </Link>
          <button
            aria-label="Close navigation"
            className="docs-mobile-menu-btn"
            onClick={closeMobileNav}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="docs-mobile-drawer-content">
          <SidebarContent
            query={query}
            setQuery={setQuery}
            filteredNav={filteredNav}
            closeMobileNav={closeMobileNav}
          />
        </div>
      </aside>

      <section
        className="docs-stage"
        onClick={mobileNavOpen ? closeMobileNav : undefined}
      >
        {/* Desktop Header */}
        <header className="docs-header">
          <div className="docs-header-left">
            <Link className="docs-logo" data-magnetic to="/">
              <GlitchImageLogo className="docs-logo-image" />
            </Link>
          </div>
        </header>

        <div className="docs-layout">
          <aside className="docs-sidebar" aria-label="Documentation sections">
            <SidebarContent
              query={query}
              setQuery={setQuery}
              filteredNav={filteredNav}
              closeMobileNav={closeMobileNav}
            />
          </aside>

          <article className="docs-article">
            {/* Intro Section */}
            <section className="docs-hero-block" id="intro">
              <p className="sessions-kicker">Intro</p>
              <h2 data-scramble="true">Get started with iTE.</h2>
              <p className="docs-summary">
                <strong>iTE</strong> is an AI coding agent for your terminal.
              </p>
              <div className="docs-image-container">
                <video
                  autoPlay
                  className="docs-image"
                  loop
                  muted
                  playsInline
                  src="/demoo.mp4"
                />
              </div>
            </section>

            {/* Prerequisites Section */}
            <section className="docs-section" id="prerequisites">
              <h2 data-scramble="true">Prerequisites</h2>
              <p>Before you install iTE, make sure you have:</p>
              <div className="docs-checklist">
                <div className="docs-checklist-item">
                  <strong>Python 3.11+</strong>
                  <span>Required runtime for iTE</span>
                </div>
                <div className="docs-checklist-item">
                  <strong>Terminal emulator</strong>
                  <span>
                    Any terminal works—Terminal.app, iTerm2, Windows Terminal,
                    etc.
                  </span>
                </div>
                <div className="docs-checklist-item">
                  <strong>API keys</strong>
                  <span>For LLM providers (unless using iTE Cloud)</span>
                </div>
              </div>
              <div className="docs-note">
                <strong>Supported terminals</strong>
                <p>
                  <strong>macOS:</strong> Terminal.app, Warp, iTerm2, Ghostty
                  <br />
                  <strong>Windows:</strong> Windows Terminal, PowerShell, CMD
                </p>
              </div>
            </section>

            {/* Install Section */}
            <section className="docs-section" id="install">
              <h2 data-scramble="true">Install</h2>
              <p>
                The fastest way to install iTE is through <strong>pipx</strong>.
                It keeps iTE isolated from your system Python and gives you the{" "}
                <code>ite</code> command globally.
              </p>

              <CodeBlock
                label="pipx (recommended)"
                code="pipx install ite-agent"
              />
              <CodeBlock label="uv" code="uv tool install ite-agent" />

              <p>Verify the installation:</p>
              <CodeBlock label="Terminal" code="ite --version" />

              <p>Upgrade to the latest version:</p>
              <CodeBlock label="Upgrade" code="pipx upgrade ite-agent" />

              <div className="docs-note">
                <strong>Uninstall</strong>
                <p>
                  If you need to remove iTE:{" "}
                  <code>pipx uninstall ite-agent</code>
                </p>
              </div>
            </section>

            {/* Configure Section */}
            <section className="docs-section" id="configure">
              <h2 data-scramble="true">Configure Your Provider</h2>
              <p>
                iTE requires an OpenAI-compatible model provider. Run{" "}
                <code>/setup</code> inside iTE to configure:
              </p>
              <div className="docs-ordered-list">
                <li>Base URL — Your provider endpoint</li>
                <li>API Key — Your provider key</li>
                <li>Model — The exact model name</li>
              </div>

              <h3>Supported Providers</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Base URL</th>
                      <th>API Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Ollama</strong> (Local)
                      </td>
                      <td>
                        <code>http://localhost:11434/v1</code>
                      </td>
                      <td>
                        <code>ollama</code> or your key
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>OpenRouter</strong>
                      </td>
                      <td>
                        <code>https://openrouter.ai/api/v1</code>
                      </td>
                      <td>Your OpenRouter key</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>OpenAI</strong>
                      </td>
                      <td>
                        <code>https://api.openai.com/v1</code>
                      </td>
                      <td>Your OpenAI key</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>Start iTE and run the setup command:</p>
              <CodeBlock
                label="Terminal"
                code={`ite
/setup`}
              />

              <div className="docs-note docs-note-featured">
                <strong>iTE Cloud Bundled Access</strong>
                <p>
                  Pro accounts can use bundled models through iTE Cloud today.
                  iTE manages the bundled provider path for you, while Ollama,
                  OpenRouter BYOK, and other compatible BYOK providers remain
                  available alongside bundled access.
                </p>
              </div>
            </section>

            {/* Initialize Section */}
            <section className="docs-section" id="init">
              <h2 data-scramble="true">Initialize Your Project</h2>
              <p>
                Projects can include an <code>AGENTS.md</code> file at the root
                to provide instructions to iTE on how to work with the codebase.
              </p>

              <h3>The /init Command</h3>
              <p>
                Use the <code>/init</code> command to analyze your project and
                create an <code>AGENTS.md</code> file:
              </p>
              <CodeBlock label="Terminal" code="/init" />

              <p>This detects:</p>
              <div className="docs-ordered-list">
                <li>Language/framework (Python, JavaScript, Rust, etc.)</li>
                <li>Test/build setup</li>
                <li>Key directory structure</li>
              </div>

              <div className="docs-faq-list">
                <article className="detail-card docs-faq-card">
                  <strong>Force overwrite</strong>
                  <p className="muted">
                    To regenerate and overwrite an existing{" "}
                    <code>AGENTS.md</code>:
                  </p>
                  <CodeBlock label="Terminal" code="/init --force" />
                </article>
              </div>

              <h3>AGENTS.md Scope</h3>
              <p>
                <code>AGENTS.md</code> files support scope hierarchy:
              </p>
              <div className="docs-ordered-list">
                <li>
                  The scope is the directory containing the file and all
                  subdirectories
                </li>
                <li>Deeper files override parent instructions</li>
                <li>
                  Multiple files can exist in a project, each governing its
                  subtree
                </li>
              </div>
            </section>

            {/* Usage Section */}
            <section className="docs-section" id="usage">
              <h2 data-scramble="true">Usage</h2>
              <p>
                Now that you&apos;ve configured a provider and optionally
                initialized your project, you&apos;re ready to use iTE.
              </p>

              <h3>Ask Questions</h3>
              <p>You can ask iTE to explain the codebase to you:</p>
              <div className="docs-example-grid">
                <article className="detail-card docs-example-card">
                  <span className="onboarding-step-eyebrow">Ask</span>
                  <p>
                    How is state management handled in
                    app/features/settings.dart
                  </p>
                </article>
              </div>
              <div className="docs-note">
                <strong>Tip:</strong> Use the <code>@</code> key to fuzzy search
                for files in the project.
              </div>

              <h3>Add Features</h3>
              <p>You can ask iTE to add new features. First, create a plan:</p>
              <div className="docs-ordered-list">
                <li>
                  <strong>Create a plan</strong> — Enable plan mode with{" "}
                  <code>/plan on</code>
                </li>
                <li>
                  <strong>Iterate on the plan</strong> — Give feedback or add
                  more details
                </li>
                <li>
                  <strong>Build the feature</strong> — Disable plan mode with{" "}
                  <code>/plan off</code> and execute
                </li>
              </div>

              <CodeBlock
                label="Plan mode"
                code={`/plan on

Add a user profile page with avatar upload and display name editing.

/plan off

Sounds good! Go ahead and make the changes.`}
              />

              <h3>Make Changes</h3>
              <p>For straightforward changes, ask iTE directly:</p>
              <div className="docs-example-grid">
                <article className="detail-card docs-example-card">
                  <span className="onboarding-step-eyebrow">Change</span>
                  <p>Add error handling to the login function in src/auth.ts</p>
                </article>
              </div>

              <h3>Undo Changes</h3>
              <p>If something goes wrong, you can undo:</p>
              <CodeBlock
                label="Undo / Redo"
                code={`/undo  # Reverts file changes from the last turn
/redo  # Reapply reverted changes`}
              />

              <h3>Sessions</h3>
              <p>Conversations auto-save. List or resume previous sessions:</p>
              <CodeBlock label="Sessions" code="/sessions" />
            </section>

            {/* Commands Section */}
            <section className="docs-section" id="commands">
              <h2 data-scramble="true">Commands</h2>
              <p>
                Type <code>/help</code> in iTE to see available commands.
              </p>

              <h3>Session Management</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Command</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>/new</code>
                      </td>
                      <td>Start a new conversation thread</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/sessions</code>
                      </td>
                      <td>List saved conversations and resume</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/rename &lt;name&gt;</code>
                      </td>
                      <td>Rename the current conversation</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/exit</code> or <code>/quit</code>
                      </td>
                      <td>Close iTE</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/close</code>
                      </td>
                      <td>Close the current thread</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Configuration</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Command</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>/setup</code>
                      </td>
                      <td>Configure model provider</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/config</code>
                      </td>
                      <td>View current configuration</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/model &lt;name&gt;</code>
                      </td>
                      <td>Change model</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/approval &lt;mode&gt;</code>
                      </td>
                      <td>
                        Set approval mode: on_request, on_failure, auto,
                        auto_edit, yolo
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>/logout</code>
                      </td>
                      <td>Log out of iTE Cloud</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Workflow</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Command</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>/plan</code>
                      </td>
                      <td>Show plan mode status</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/plan on</code>
                      </td>
                      <td>Enable plan mode</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/plan off</code>
                      </td>
                      <td>Disable plan mode</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/todos</code>
                      </td>
                      <td>Manage task lists</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/attach &lt;path&gt;</code>
                      </td>
                      <td>Queue files for next message</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/clear</code>
                      </td>
                      <td>Clear conversation history</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Version Control &amp; History</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Command</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>/branch</code>
                      </td>
                      <td>List or switch git branches</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/branch --create &lt;name&gt;</code>
                      </td>
                      <td>Create and switch to new branch</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/undo</code>
                      </td>
                      <td>Revert file changes from last turn</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/redo</code>
                      </td>
                      <td>Reapply reverted changes</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Project &amp; Skills</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Command</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>/init</code>
                      </td>
                      <td>Analyze project and create AGENTS.md</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/skills</code>
                      </td>
                      <td>List available skills</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/skills show &lt;name&gt;</code>
                      </td>
                      <td>Inspect a skill</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/skills use &lt;name&gt;</code>
                      </td>
                      <td>Activate a skill</td>
                    </tr>
                    <tr>
                      <td>
                        <code>/skills add &lt;path&gt;</code>
                      </td>
                      <td>Install a skill pack</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Approval Modes</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Mode</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>on_request</code>
                      </td>
                      <td>Ask before every mutating action</td>
                    </tr>
                    <tr>
                      <td>
                        <code>on_failure</code>
                      </td>
                      <td>Auto-approve, ask only on failure</td>
                    </tr>
                    <tr>
                      <td>
                        <code>auto</code>
                      </td>
                      <td>Auto-approve all safe operations</td>
                    </tr>
                    <tr>
                      <td>
                        <code>auto_edit</code>
                      </td>
                      <td>Auto-approve edits, confirm commands</td>
                    </tr>
                    <tr>
                      <td>
                        <code>yolo</code>
                      </td>
                      <td>Approve everything — no guardrails</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Tools Section */}
            <section className="docs-section" id="tools">
              <h2 data-scramble="true">Tools</h2>
              <p>
                iTE includes a comprehensive set of built-in tools for reading,
                writing, searching, executing, and managing your codebase.
              </p>

              <h3>Read Tools</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>read_file</code>
                      </td>
                      <td>Read file contents with offset and limit</td>
                    </tr>
                    <tr>
                      <td>
                        <code>read_json</code>
                      </td>
                      <td>Read and parse JSON files</td>
                    </tr>
                    <tr>
                      <td>
                        <code>read_toml</code>
                      </td>
                      <td>Read and parse TOML files</td>
                    </tr>
                    <tr>
                      <td>
                        <code>read_yaml</code>
                      </td>
                      <td>Read and parse YAML files</td>
                    </tr>
                    <tr>
                      <td>
                        <code>read_pdf</code>
                      </td>
                      <td>Extract text from PDF documents</td>
                    </tr>
                    <tr>
                      <td>
                        <code>read_image</code>
                      </td>
                      <td>Read image metadata and OCR text</td>
                    </tr>
                    <tr>
                      <td>
                        <code>list_dir</code>
                      </td>
                      <td>List directory contents</td>
                    </tr>
                    <tr>
                      <td>
                        <code>glob</code>
                      </td>
                      <td>Find files by pattern</td>
                    </tr>
                    <tr>
                      <td>
                        <code>grep</code>
                      </td>
                      <td>Search for patterns in file content</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Write Tools</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>write_file</code>
                      </td>
                      <td>Create or overwrite files</td>
                    </tr>
                    <tr>
                      <td>
                        <code>edit</code>
                      </td>
                      <td>Make surgical text replacements</td>
                    </tr>
                    <tr>
                      <td>
                        <code>apply_patch</code>
                      </td>
                      <td>Apply multi-file patch edits</td>
                    </tr>
                    <tr>
                      <td>
                        <code>edit_json</code>
                      </td>
                      <td>Edit JSON files using structured paths</td>
                    </tr>
                    <tr>
                      <td>
                        <code>edit_toml</code>
                      </td>
                      <td>Edit TOML files using structured paths</td>
                    </tr>
                    <tr>
                      <td>
                        <code>edit_yaml</code>
                      </td>
                      <td>Edit YAML files using structured paths</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Execute Tools</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>shell</code>
                      </td>
                      <td>Execute shell commands with timeout</td>
                    </tr>
                    <tr>
                      <td>
                        <code>shell_start</code>
                      </td>
                      <td>Start persistent shell sessions</td>
                    </tr>
                    <tr>
                      <td>
                        <code>shell_poll</code>
                      </td>
                      <td>Read output from running sessions</td>
                    </tr>
                    <tr>
                      <td>
                        <code>shell_send</code>
                      </td>
                      <td>Send input to running sessions</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Git Tools</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>git_status</code>
                      </td>
                      <td>Inspect repository state</td>
                    </tr>
                    <tr>
                      <td>
                        <code>git_diff</code>
                      </td>
                      <td>Show working tree diffs</td>
                    </tr>
                    <tr>
                      <td>
                        <code>git_log</code>
                      </td>
                      <td>View commit history</td>
                    </tr>
                    <tr>
                      <td>
                        <code>git_branch</code>
                      </td>
                      <td>List, create, or switch branches</td>
                    </tr>
                    <tr>
                      <td>
                        <code>git_commit</code>
                      </td>
                      <td>Create commits</td>
                    </tr>
                    <tr>
                      <td>
                        <code>git_push</code>
                      </td>
                      <td>Push to remote</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Subagent Tools</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>spawn_subagent</code>
                      </td>
                      <td>Start specialist subagents</td>
                    </tr>
                    <tr>
                      <td>
                        <code>spawn_subagents</code>
                      </td>
                      <td>Start multiple subagents in parallel</td>
                    </tr>
                    <tr>
                      <td>
                        <code>wait_subagent</code>
                      </td>
                      <td>Wait for subagent completion</td>
                    </tr>
                    <tr>
                      <td>
                        <code>list_subagents</code>
                      </td>
                      <td>List active subagents</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Verification Tools</h3>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>run_tests</code>
                      </td>
                      <td>Run project tests</td>
                    </tr>
                    <tr>
                      <td>
                        <code>run_linter</code>
                      </td>
                      <td>Run project linter</td>
                    </tr>
                    <tr>
                      <td>
                        <code>run_typecheck</code>
                      </td>
                      <td>Run type checker</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* AGENTS.md Section */}
            <section className="docs-section" id="agents">
              <h2 data-scramble="true">AGENTS.md</h2>
              <p>
                <code>AGENTS.md</code> files provide project-specific
                instructions to iTE, similar to how <code>README.md</code> works
                for humans.
              </p>

              <h3>Creating AGENTS.md</h3>
              <p>
                Use the <code>/init</code> command:
              </p>
              <CodeBlock label="Terminal" code="/init" />

              <h3>Scope Hierarchy</h3>
              <p>
                <code>AGENTS.md</code> files support scope-based overrides:
              </p>
              <div className="docs-ordered-list">
                <li>The file covers its directory and all subdirectories</li>
                <li>Deeper files override parent files for their scope</li>
                <li>Multiple files can exist in one project</li>
              </div>

              <h3>Example</h3>
              <CodeBlock
                label="AGENTS.md"
                code={`# My Project

## Architecture
- Python/FastAPI backend in src/api/
- React frontend in src/web/

## Development Guidelines
- Use pytest for tests
- Run \`make test\` before committing
- Prefer \`read_json\`/\`edit_json\` for structured files
- Follow PEP 8 for Python code

## Tool Preferences
- Use \`uv\` for package management
- Use \`ruff\` for linting`}
              />
            </section>

            {/* Skills Section */}
            <section className="docs-section" id="skills">
              <h2 data-scramble="true">Skills</h2>
              <p>
                Skills are instruction bundles that extend iTE&apos;s
                capabilities on specific tasks.
              </p>

              <h3>How Skills Work</h3>
              <p>
                Skills are interoperable <code>SKILL.md</code> bundles. They can
                be:
              </p>
              <div className="docs-ordered-list">
                <li>
                  <strong>Global:</strong> Installed in{" "}
                  <code>~/.config/ite/skills/</code> (always trusted)
                </li>
                <li>
                  <strong>Project:</strong> Installed in{" "}
                  <code>.agents/skills/</code> or <code>.ite/skills/</code>{" "}
                  (require trust)
                </li>
              </div>

              <h3>Compatibility</h3>
              <p>
                iTE discovers skills from common agent roots including{" "}
                <code>.agents/skills</code>, <code>.codex/skills</code>,{" "}
                <code>.cursor/skills</code>, <code>.claude/skills</code>,{" "}
                <code>.gemini/skills</code>, and <code>.opencode/skills</code>.
              </p>

              <h3>Commands</h3>
              <CodeBlock
                label="Skills commands"
                code={`/skills                    # List available skills
/skills show <name>        # Inspect a skill
/skills use <name>         # Activate a skill
/skills add <path>         # Install a skill pack
/skills trust              # Trust project skills`}
              />

              <div className="docs-note">
                <strong>Trust Model</strong>
                <ul>
                  <li>Global skills are trusted by default</li>
                  <li>
                    Project skills require explicit trust with{" "}
                    <code>/skills trust</code>
                  </li>
                </ul>
              </div>
            </section>

            {/* Subagents Section */}
            <section className="docs-section" id="subagents">
              <h2 data-scramble="true">Subagents</h2>
              <p>
                Subagents are specialized AI agents that handle specific tasks
                independently. They run in parallel and return structured
                results to the main agent.
              </p>

              <h3>Built-in Subagents</h3>
              <div className="docs-checklist">
                <div className="docs-checklist-item">
                  <strong>security_auditor</strong>
                  <span>Security vulnerability analysis</span>
                </div>
                <div className="docs-checklist-item">
                  <strong>code_reviewer</strong>
                  <span>Code quality review</span>
                </div>
                <div className="docs-checklist-item">
                  <strong>codebase_investigator</strong>
                  <span>Explore code structure and patterns</span>
                </div>
                <div className="docs-checklist-item">
                  <strong>tooling_guardian</strong>
                  <span>Validate tool configurations</span>
                </div>
                <div className="docs-checklist-item">
                  <strong>verification_reviewer</strong>
                  <span>Regression-focused change validation</span>
                </div>
                <div className="docs-checklist-item">
                  <strong>init_investigator</strong>
                  <span>Generate AGENTS.md for projects</span>
                </div>
              </div>

              <h3>Using Subagents</h3>
              <CodeBlock
                label="Spawn a subagent"
                code={`spawn_subagent subagent="security_auditor" goal="Audit the authentication module"`}
              />
              <CodeBlock
                label="Parallel execution"
                code={`spawn_subagents requests=[
  {subagent: "code_reviewer", goal: "Review PR changes"},
  {subagent: "security_auditor", goal: "Check for SQL injection risks"}
]`}
              />

              <h3>Creating Custom Subagents</h3>
              <p>
                Use <code>/subagent create</code> to define custom subagents
                interactively. They are saved to{" "}
                <code>.ite/subagents/&lt;name&gt;.toml</code>.
              </p>
            </section>

            {/* MCP Section */}
            <section className="docs-section" id="mcp">
              <h2 data-scramble="true">MCP Servers</h2>
              <p>
                iTE supports the Model Context Protocol (MCP) for extending
                capabilities with external tools.
              </p>

              <h3>What MCP Does</h3>
              <p>MCP servers provide specialized capabilities:</p>
              <div className="docs-ordered-list">
                <li>Database access</li>
                <li>API integrations</li>
                <li>Custom tools</li>
                <li>External services</li>
              </div>

              <h3>Configuration</h3>
              <p>
                Configure MCP servers in <code>.ite/config.toml</code>:
              </p>
              <CodeBlock
                label=".ite/config.toml"
                code={`[mcp_servers.sqlite]
command = "uvx"
args = ["mcp-server-sqlite", "--db-path", "data.db"]
auto_connect = true

[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/files"]`}
              />

              <h3>Commands</h3>
              <CodeBlock
                label="MCP commands"
                code={`/mcp                      # Show MCP server status
/mcp start <server>       # Connect an MCP server
/mcp stop <server>        # Disconnect an MCP server`}
              />

              <div className="docs-note">
                <strong>Security</strong>
                <p>
                  MCP servers run as separate processes. Review configurations
                  before connecting to new servers.
                </p>
              </div>
            </section>
          </article>
        </div>

        <footer className="docs-footer">
          <p>
            © {new Date().getFullYear()} iTE. Built by{" "}
            <a href="https://kiishi.space" rel="noreferrer" target="_blank">
              Kiishi David
            </a>
            .
          </p>
        </footer>
      </section>
    </main>
  );
}
