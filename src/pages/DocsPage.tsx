import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CodeBlock } from "./docs/CodeBlock";
import {
  LocalWorkflowSections,
  LOCAL_DOC_NAV,
  CommandReference,
} from "./docs/LocalWorkflowSections";
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
  ...LOCAL_DOC_NAV,
  {
    id: "commands",
    label: "Commands",
    description: "Slash commands and terminal CLI reference.",
  },
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
  const navigate = useNavigate();
  function goBack() {
    if (
      typeof window.history.state?.idx === "number" &&
      window.history.state.idx > 0
    ) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }
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
          <button className="docs-back-button" onClick={goBack} type="button">
            <span aria-hidden="true">←</span> Back
          </button>
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
          <button className="docs-back-button" onClick={goBack} type="button">
            <span aria-hidden="true">←</span> Back
          </button>
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
                  src="/demo.mp4"
                />
              </div>
            </section>

            {/* Prerequisites Section */}
            <section className="docs-section" id="prerequisites">
              <h2 data-scramble="true">Prerequisites</h2>
              <p>Before you install iTE, make sure you have:</p>
              <div className="docs-checklist">
                <div className="docs-checklist-item">
                  <strong>Choose an installation method</strong>
                  <span>
                    Shell installers include the runtime. Package installs
                    require Python 3.11+.
                  </span>
                </div>
                <div className="docs-checklist-item">
                  <strong>Terminal emulator</strong>
                  <span>
                    Any terminal works—Terminal.app, iTerm2, Windows Terminal,
                    etc.
                  </span>
                </div>
                <div className="docs-checklist-item">
                  <strong>Model access</strong>
                  <span>
                    Use bundled account access, your provider credentials, or a
                    local Ollama model.
                  </span>
                </div>
              </div>
              <div className="docs-note">
                <strong>Supported terminals</strong>
                <p>
                  <strong>macOS/Linux:</strong> Use a modern terminal; the Unix
                  installer needs curl, bash, and python3 or jq to read its
                  release manifest.
                  <br />
                  <strong>Windows:</strong> Windows Terminal, PowerShell, CMD
                </p>
              </div>
            </section>

            {/* Install Section */}
            <section className="docs-section" id="install">
              <h2 data-scramble="true">Install</h2>
              <p>
                The fastest way to install iTE is with a single command.{" "}
                <strong>macOS/Linux</strong> users can use <strong>curl</strong>
                ,<strong>Windows</strong> users can use{" "}
                <strong>PowerShell</strong>. If you prefer package managers,{" "}
                <strong>pipx</strong> and <strong>uv</strong> are also
                available.
              </p>

              <CodeBlock
                label="macOS / Linux"
                code="curl -fsSL https://ite.kiishi.space/install.sh | bash"
              />
              <CodeBlock
                label="Windows"
                code="irm https://ite.kiishi.space/install.ps1 | iex"
              />
              <CodeBlock label="pipx" code="pipx install ite-agent" />
              <CodeBlock label="uv" code="uv tool install ite-agent" />

              <p>Verify the installation:</p>
              <CodeBlock label="Terminal" code="ite --version" />

              <p>Upgrade to the latest version:</p>
              <CodeBlock label="Terminal" code="ite --upgrade" />
              <p>
                iTE detects your installation method. You can also use{" "}
                <code>pipx upgrade ite-agent</code> or{" "}
                <code>uv tool upgrade ite-agent</code> for package
                installations.
              </p>

              <div className="docs-note">
                <strong>Uninstall</strong>
                <p>
                  For package installs, use{" "}
                  <code>pipx uninstall ite-agent</code> or{" "}
                  <code>uv tool uninstall ite-agent</code>. For a shell
                  installer, remove its app and bin directories from the
                  installation root and its PATH entry. Default roots are{" "}
                  <code>~/.ite</code> on macOS/Linux and{" "}
                  <code>%LOCALAPPDATA%\iTE</code> on Windows. Preserve any files
                  you want to keep in that root.
                </p>
              </div>
            </section>

            {/* Configure Section */}
            <section className="docs-section" id="configure">
              <h2 data-scramble="true">Configure Your Provider</h2>
              <p>
                Use bundled models available to your iTE account, or connect an
                OpenAI-compatible provider. For your own provider, run{" "}
                <code>/setup</code> inside iTE and configure:
              </p>
              <div className="docs-ordered-list">
                <li>Base URL — Your provider endpoint</li>
                <li>API Key — Your provider key</li>
                <li>
                  Model — Select an available model or enter a custom model
                </li>
                <li>
                  Context window — Enter the available token limit if it cannot
                  be discovered
                </li>
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
                      <td>Browser sign-in or your OpenRouter key</td>
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

              <p>
                Start iTE with <code>ite</code> in your terminal, then run:
              </p>
              <CodeBlock label="Inside iTE" code="/setup" />

              <div className="docs-note docs-note-featured">
                <strong>iTE Cloud Bundled Access</strong>
                <p>
                  Bundled models are available according to your account
                  entitlements. Sign in with <code>/login</code>, then open{" "}
                  <code>/models</code> to see your available models. Ollama and
                  providers using your own API key are also supported. See{" "}
                  <a href="#account">Account &amp; usage</a> for limits and
                  account controls.
                </p>
              </div>
            </section>

            <section className="docs-section" id="provider-details">
              <h3>Sign in with OpenRouter</h3>
              <p>
                In <code>/setup</code>, choose OpenRouter and select{" "}
                <strong>Sign in with OpenRouter</strong>. Approve the connection
                in your browser. You can also paste your own OpenRouter key. Use
                the provider’s sign-out control to disconnect OpenRouter;{" "}
                <code>/logout</code> signs out of your iTE account.
              </p>
              <h3>Configuration files</h3>
              <p>
                Workspace overrides live in <code>.ite/config.toml</code>.
                Global configuration uses your operating system’s user
                configuration directory for iTE; do not assume it lives under
                the installer’s <code>~/.ite</code> directory. Model and
                provider flags passed to <code>ite</code> override the loaded
                settings. Approval preferences are saved globally.
              </p>
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
              <CodeBlock label="Inside iTE" code="/init" />

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
                  <CodeBlock label="Inside iTE" code="/init --force" />
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
                code={`/undo
/redo`}
              />

              <h3>Sessions</h3>
              <p>Conversations auto-save. List or resume previous sessions:</p>
              <CodeBlock label="Sessions" code="/sessions" />
            </section>

            <LocalWorkflowSections />
            <CommandReference />

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

              <h3>Files and documents</h3>
              <p>
                Ask iTE to use <code>read_pdf</code> for PDF extraction,{" "}
                <code>read_image</code> for image inspection and optional OCR,
                or <code>read_document</code> to convert Office, OpenDocument,
                RTF, EPUB, CSV, and PDF files to Markdown text. See{" "}
                <a href="#files">Files &amp; documents</a> for limits and
                examples.
              </p>

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
              <CodeBlock label="Inside iTE" code="/init" />

              <h3>Scope Hierarchy</h3>
              <p>
                <code>AGENTS.md</code> files support scope-based overrides:
              </p>
              <div className="docs-ordered-list">
                <li>The file covers its directory and all subdirectories</li>
                <li>Deeper files override parent files for their scope</li>
                <li>Multiple files can exist in one project</li>
              </div>

              <h3>Refresh instructions</h3>
              <p>
                Use <code>/remind</code> to re-inject project instructions into
                the conversation. This refreshes instructions; it does not
                schedule a reminder. iTE also recognizes{" "}
                <code>AGENTS.override.md</code> and fallback instruction files
                such as <code>CLAUDE.md</code> when applicable.
              </p>
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
                  <strong>Global:</strong> Installed in your user skill roots,
                  including <code>~/.agents/skills/</code> (trusted by default)
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
/skills trust              # Trust project skills
/skills untrust            # Remove trust and active project skills
/skills drop <name>        # Deactivate one skill
/skills clear              # Deactivate all skills
/skills add owner/repo     # Install from GitHub
/skills add <git-url> --global # Install in ~/.agents/skills
/skills add <path> --local # Install in .ite/skills`}
              />

              <div className="docs-note">
                <strong>Trust Model</strong>
                <ul>
                  <li>
                    Global skills are trusted by default. Review a skill before
                    installing or activating it.
                  </li>
                  <li>
                    Discovered project skills require <code>/skills trust</code>{" "}
                    before activation. Installing with <code>/skills add</code>{" "}
                    into the default project <code>.agents/skills</code>{" "}
                    directory also trusts that workspace.
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
                label="Example request"
                code="Ask the security auditor to review src/auth.ts, and have the code reviewer check the changes."
              />
              <p>
                iTE calls the subagent tools and collects their results. Use{" "}
                <code>/subagent list</code> to see available specialists. Tool
                names such as <code>spawn_subagent</code> are used by the agent,
                not typed as terminal commands.
              </p>

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

              <h3>URL servers and authentication</h3>
              <p>
                URL-based servers support SSE, Streamable HTTP, and WebSocket
                transports. Browser OAuth and client-credentials authentication
                are available for compatible URL servers. WebSocket transport
                does not support configured headers or authentication.
              </p>
              <CodeBlock
                label="Workspace config: browser OAuth"
                code={
                  '[mcp_servers.example]\nurl = "https://your-service.example/mcp"\ntransport = "streamable_http"\nauth = "oauth"'
                }
              />
              <p>
                Replace the example URL with your service’s MCP endpoint. For
                client credentials, use <code>auth = "client_credentials"</code>{" "}
                with the service’s token URL, client ID, secret, and optional
                scope. Keep credentials out of committed config.
              </p>
              <h3>Commands</h3>
              <CodeBlock
                label="MCP commands"
                code={`/mcp                      # Show MCP server status
/mcp start <server>       # Connect an MCP server
/mcp stop <server>        # Disconnect an MCP server
/mcp doctor <server>      # Diagnose connection/config issues
/mcp reset <server>       # Clear credentials and OAuth tokens
/mcp env list [server]    # Inspect configured variables
/mcp env where <server>   # Locate their storage
/mcp env import <server> <KEY> # Import a process variable
/mcp env unset <server> <KEY> # Remove a variable
/mcp add <server> --scope workspace # Copy an existing definition`}
              />

              <CodeBlock
                label="Terminal: add a server"
                code="ite mcp add example --url https://your-service.example/mcp --scope workspace"
              />
              <p>
                <code>ite mcp add</code> creates a persisted server definition
                from a URL or command. Inside iTE, <code>/mcp add</code> copies
                an existing definition between scopes. After a reset, use{" "}
                <code>/mcp start &lt;server&gt;</code> to authenticate again.
              </p>
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
