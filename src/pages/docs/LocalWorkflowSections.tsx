import { CodeBlock } from "./CodeBlock";

export const LOCAL_DOC_NAV = [
  {
    id: "settings",
    label: "Settings & models",
    description: "Model picker, thinking controls, and themes.",
  },
  {
    id: "account",
    label: "Account & usage",
    description: "Sign-in, bundled access, usage limits, and resets.",
  },
  {
    id: "goal",
    label: "Goal mode",
    description: "Durable objectives, milestones, proof, pause and resume.",
  },
  {
    id: "files",
    label: "Files & documents",
    description: "Attachments, images, PDFs, Office files, and OCR.",
  },
  {
    id: "context",
    label: "Sessions & context",
    description: "Resume conversations and manage compaction.",
  },
  {
    id: "review",
    label: "Review & Git",
    description: "Inspect changes, undo, branches, and publishing.",
  },
  {
    id: "voice",
    label: "Voice input",
    description: "Flow recording and transcription into your prompt.",
  },
  {
    id: "permissions",
    label: "Permissions & safety",
    description: "Approval policies and filesystem sandbox.",
  },
  {
    id: "automation",
    label: "Hooks & memory",
    description: "Configured automation and memory inspection.",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Optional Open Island notifications on macOS.",
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    description: "Installation, provider, context, and file errors.",
  },
];

type Rows = readonly (readonly [string, string])[];

function ReferenceTable({
  rows,
  heading = "Command",
}: {
  rows: Rows;
  heading?: string;
}) {
  return (
    <div className="docs-table-wrapper">
      <table className="docs-table">
        <thead>
          <tr>
            <th scope="col">{heading}</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, description]) => (
            <tr key={name}>
              <td>
                <code>{name}</code>
              </td>
              <td>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LocalWorkflowSections() {
  return (
    <>
      <section className="docs-section" id="settings">
        <h2 data-scramble="true">Settings &amp; models</h2>
        <p>
          Open <code>/settings</code> to inspect your account and provider
          settings. Use <code>/setup</code> to connect a provider, and{" "}
          <code>/models</code> to choose a model for the current session. The
          picker shows models available through your provider or account.
        </p>
        <CodeBlock
          label="Inside iTE"
          code={"/settings\n/models\n/config\n/theme"}
        />
        <p>
          Use the model’s thinking control when available to adjust reasoning.
          Options depend on the selected model. <code>/theme</code> opens the
          theme picker; <code>/config</code> shows the loaded configuration.
        </p>
        <h3>Terminal basics</h3>
        <ReferenceTable
          heading="Shortcut"
          rows={[
            ["Ctrl+Enter", "Send the prompt."],
            [
              "Ctrl+C",
              "Interrupt or open the quit flow, depending on the current state.",
            ],
            ["Ctrl+L", "Clear the input."],
            ["Ctrl+S", "Start or stop Flow recording."],
            ["F1", "Show help."],
          ]}
        />
        <p>
          Use the thread switcher for conversations and the side panels to
          inspect work. Expand tool output when you need the details behind a
          result.
        </p>
        <h3>Plans and side questions</h3>
        <p>
          <code>/plan on</code> lets you work through a proposal before
          implementation. Use <code>/plan off</code> when ready to make changes.{" "}
          <code>/workboard</code> shows the plan and visible todos together. Use{" "}
          <code>/aside</code> to ask a question in the side panel while keeping
          the main conversation in view.
        </p>
      </section>
      <section className="docs-section" id="account">
        <h2 data-scramble="true">Account &amp; usage</h2>
        <p>
          Sign in to iTE to use the bundled models your account can access. This
          is separate from signing in to OpenRouter or entering another
          provider’s API key.
        </p>
        <CodeBlock
          label="Inside iTE"
          code={"/login\n/status\n/refresh\n/usage\n/activity"}
        />
        <p>
          <code>/status</code> shows your account connection.{" "}
          <code>/refresh</code> reloads plan status, model availability, and
          entitlements. Open <code>/settings</code> to see the 5-hour and 7-day
          usage windows and their reset information; select the usage card for
          more details.
        </p>
        <p>
          Bundled access depends on account entitlements and available capacity.
          If you reach a limit, check its reset information before continuing. A
          goal may enter a budget-limited state; inspect it and resume when
          access is available.
        </p>
        <p>
          Use <code>/logout</code> to sign out of iTE. You will need to sign in
          again to use account-dependent features. If a refresh fails, cached
          information may remain visible; check the connection rather than
          treating it as a successful refresh.
        </p>
      </section>
      <section className="docs-section" id="goal">
        <h2 data-scramble="true">Goal mode</h2>
        <p>
          Give iTE a durable objective when a task needs sustained work across
          multiple turns. Goal mode records milestones, verification evidence,
          and progress with the conversation, and can continue while the goal is
          active.
        </p>
        <CodeBlock
          label="Start a goal"
          code="/goal Add password reset with email delivery and passing tests"
        />
        <ReferenceTable
          rows={[
            ["/goal", "Inspect the current goal, milestones, and proof."],
            ["/goal pause", "Pause work while retaining progress."],
            ["/goal resume", "Resume the saved objective."],
            [
              "/goal edit <objective>",
              "Update the objective and leave it paused.",
            ],
            [
              "/goal clear",
              "Clear the current goal while retaining its history.",
            ],
          ]}
        />
        <p>
          A goal can be active, paused, blocked, budget limited, or completed. A
          blocker means iTE needs information or another condition to change.
          Verification evidence helps you assess completion. Resume the saved
          session to inspect its goal state.
        </p>
        <div className="docs-note">
          <strong>Stopping and changing direction</strong>
          <p>
            The composer’s Stop action pauses an active goal. Editing also
            leaves it paused: use <code>/goal resume</code> when ready. Clear
            the current goal before starting a different one.
          </p>
        </div>
        <p>
          Use Plan mode to agree on an approach, a normal prompt for a small
          request, and Goal mode for an objective that needs continued
          execution. A plan or todo list alone does not create a goal.
        </p>
      </section>
      <section className="docs-section" id="files">
        <h2 data-scramble="true">Files &amp; documents</h2>
        <p>
          Run <code>/attach</code> to open the file picker, or drop a file path
          into the composer. You can also queue paths explicitly. Queued
          attachments accompany the next message.
        </p>
        <CodeBlock
          label="Inside iTE"
          code={
            "/attach ./specification.pdf\n/attach --list\n/attach --remove 1\n/attach --clear"
          }
        />
        <p>
          The attachment queue accepts up to <strong>3 files</strong>, with a
          maximum of <strong>35 MiB per file</strong>. Check the queue before
          sending. Files outside the workspace are staged for the conversation.
        </p>
        <CodeBlock
          label="Example request"
          code="Read specification.pdf, summarize its requirements, and compare them with the current implementation."
        />
        <h3>Images and scanned text</h3>
        <p>
          Image interpretation depends on the selected model’s vision support.
          With a text-only model, image input cannot provide the same visual
          understanding. OCR through <code>read_image</code> requires the
          Tesseract executable in addition to the Python integration; install it
          if iTE reports that OCR is unavailable.
        </p>
        <h3>PDFs and Office files</h3>
        <p>
          iTE can extract PDF content with <code>read_pdf</code> and convert
          Word, Excel, PowerPoint, OpenDocument, RTF, EPUB, CSV, and PDF files
          to Markdown with <code>read_document</code>. Give iTE the path and ask
          for the information you need. These tools extract content; they do not
          provide a visual document editor. Scanned PDFs may require OCR, and
          converted text may omit layout details.
        </p>
        <p>
          If document conversion is unavailable, follow the reported dependency
          hint for your installation. The conversion tool uses{" "}
          <code>firecrawl-anydoc</code>; PDF extraction uses the installed PDF
          libraries.
        </p>
      </section>
      <section className="docs-section" id="context">
        <h2 data-scramble="true">Sessions &amp; context</h2>
        <p>
          Conversations save automatically. <code>/sessions</code> opens the
          resume picker for the workspace; use <code>/sessions --all</code> to
          browse across workspaces, or <code>/sessions &lt;id&gt;</code> to open
          a known session.
        </p>
        <CodeBlock
          label="Terminal: resume the latest workspace session"
          code="ite --resume-last"
        />
        <p>
          <code>/new</code> starts a thread, <code>/rename &lt;name&gt;</code>{" "}
          gives it a title, and <code>/close</code> closes the current thread.{" "}
          <code>/clear</code> clears conversation history. To preserve the
          current conversation and start fresh, use <code>/new</code>.
        </p>
        <h3>Context windows</h3>
        <p>
          The context meter estimates how much of the model’s available context
          is in use. iTE discovers limits from supported providers. For custom
          models or failed discovery, enter the available token limit in setup.
          For Ollama, use the allocation actually configured on the server.
          Entering a value in iTE does not change the server configuration.
        </p>
        <h3>Compaction</h3>
        <p>
          For long conversations, iTE can compact context into a continuation
          summary. This reduces what is sent to the model while carrying forward
          relevant work. A summary is not a verbatim replacement for every
          earlier detail; keep important requirements in project instructions or
          restate them when needed.
        </p>
        <CodeBlock
          label="Inside iTE"
          code={"/compact status\n/compact\n/stats"}
        />
        <p>
          <code>/compact status</code> reports the current estimate, limit,
          trigger, and eligibility. <code>/compact</code> requests compaction
          now; <code>/stats</code> shows session statistics. Compaction
          preserves a working continuation rather than clearing the
          conversation.
        </p>
      </section>
      <section className="docs-section" id="review">
        <h2 data-scramble="true">Review &amp; Git</h2>
        <p>
          Inspect changes before committing or publishing. <code>/changes</code>{" "}
          opens change review, and <code>/history</code> lists recorded change
          sets for the session.
        </p>
        <CodeBlock
          label="Inside iTE"
          code={"/changes\n/history\n/undo\n/redo"}
        />
        <p>
          Undo restores the most recent recorded file change set; redo reapplies
          it. These commands do not roll back every shell command, deployment,
          or action in another service.
        </p>
        <CodeBlock
          label="Branch workflow"
          code={"/branch\n/branch --create feature/password-reset"}
        />
        <p>
          Once your intended changes are committed, <code>/publish</code> pushes
          the current branch. It can also configure a Git remote before pushing.
          Check the destination and branch before running it.
        </p>
        <CodeBlock label="Publish to a configured Git remote" code="/publish" />
        <p>
          To set the destination, use{" "}
          <code>/publish &lt;repository-url&gt;</code> for <code>origin</code>,
          or <code>/publish &lt;remote-name&gt; &lt;repository-url&gt;</code>.
        </p>
      </section>
      <section className="docs-section" id="voice">
        <h2 data-scramble="true">Voice input</h2>
        <p>
          Flow transcribes speech into the focused text field. Press{" "}
          <strong>Ctrl+S</strong> to begin recording and again to stop. Review
          the inserted text before sending the prompt.
        </p>
        <CodeBlock
          label="Inside iTE"
          code={"/flow status\n/flow setup\n/flow on\n/flow off"}
        />
        <p>
          Allow microphone access when your operating system requests it. If iTE
          asks for a transcription provider, sign in to iTE Cloud or use{" "}
          <code>/flow setup</code> to enter a Groq key through the setup prompt.
          Avoid putting a key directly in a slash command.
        </p>
      </section>
      <section className="docs-section" id="permissions">
        <h2 data-scramble="true">Permissions &amp; safety</h2>
        <p>
          Approval preferences control which actions need confirmation. Use{" "}
          <code>/approval</code> to inspect or choose a policy, or{" "}
          <code>/approval &lt;mode&gt;</code> to change it. The preference is
          saved globally.
        </p>
        <ReferenceTable
          heading="Policy"
          rows={[
            [
              "on_request",
              "Confirm mutating actions, with exceptions for safe commands, low-risk state updates, and designated workspace edits.",
            ],
            [
              "on_failure",
              "Automatically approve ordinary actions; dangerous commands and designated sensitive operations still have separate checks.",
            ],
            [
              "auto",
              "Automatically approve ordinary actions, with dangerous-command rejection and confirmation for designated sensitive operations.",
            ],
            [
              "auto_edit",
              "Approve workspace edits and safe commands; ask for other commands and edits outside the workspace.",
            ],
            [
              "never",
              "Reject mutating actions and commands outside the safe command set.",
            ],
            [
              "yolo",
              "Approve actions without the approval manager’s guardrails.",
            ],
          ]}
        />
        <p>
          Use <code>/approval help</code> for the in-app policy reference.
          Approval controls and filesystem restrictions serve different
          purposes: approving an action does not grant unrestricted filesystem
          access.
        </p>
        <h3>Filesystem sandbox</h3>
        <p>
          When enabled, the filesystem sandbox restricts covered file operations
          to the workspace and allowed paths. Inspect its current state before
          adding access to another directory.
        </p>
        <CodeBlock
          label="Inside iTE"
          code={
            "/sandbox\n/sandbox on\n/sandbox allow /path/to/shared-files\n/sandbox list\n/sandbox remove /path/to/shared-files\n/sandbox clear"
          }
        />
        <p>
          <code>/sandbox clear</code> removes extra allowed paths.{" "}
          <code>/sandbox off</code> disables filesystem restrictions. This is
          not a general operating-system sandbox for arbitrary shell commands.
        </p>
      </section>
      <section className="docs-section" id="automation">
        <h2 data-scramble="true">Hooks &amp; memory</h2>
        <h3>Configured hooks</h3>
        <p>
          Hooks run configured commands around agent or tool activity. They are
          disabled by default. Add them to <code>.ite/config.toml</code>, then
          use <code>/hooks on</code> to enable them. <code>/hooks</code> opens
          the panel showing configuration and recent runs;{" "}
          <code>/hooks off</code> disables them for the workspace.
        </p>
        <CodeBlock
          label=".ite/config.toml: Python project example"
          code={
            'hooks_enabled = false\n\n[[hooks]]\nname = "Check formatting"\ntrigger = "after_agent"\ncommand = "ruff format --check ."\ntimeout_sec = 30\nblocking = false\nenabled = true'
          }
        />
        <p>
          Use a command installed in your project. Supported triggers are{" "}
          <code>before_agent</code>, <code>after_agent</code>,{" "}
          <code>before_tool</code>, <code>after_tool</code>, and{" "}
          <code>on_error</code>. Review commands before enabling hooks; tool
          triggers can run frequently.
        </p>
        <h3>Inspect memory</h3>
        <p>
          <code>/memory</code> shows active controls and stored memory.{" "}
          <code>/memory prompt &lt;query&gt;</code> helps inspect what memory
          would be included for a query. Keep stable project conventions in{" "}
          <a href="#agents">AGENTS.md</a>, and use <code>/remind</code> to
          refresh those instructions in the conversation.
        </p>
      </section>
      <section className="docs-section" id="integrations">
        <h2 data-scramble="true">Optional integrations</h2>
        <h3>Open Island on macOS</h3>
        <p>
          With the Open Island companion available, iTE can display activity
          notifications and surface approval requests and questions. This
          integration is available on macOS.
        </p>
        <CodeBlock label="Inside iTE" code={"/oi\n/oi on\n/oi off"} />
        <p>
          <code>/oi</code> reports whether notifications are enabled and
          connected. If the companion is unavailable, continue using the
          terminal’s activity and approval controls.
        </p>
      </section>
      <section className="docs-section" id="troubleshooting">
        <h2 data-scramble="true">Troubleshooting</h2>
        <ReferenceTable
          heading="Symptom"
          rows={[
            [
              "ite is not found",
              "Restart your terminal after installation and check the installer’s PATH instructions.",
            ],
            [
              "A bundled model is missing",
              "Check /status, then /refresh and /models. Availability depends on account entitlements.",
            ],
            [
              "Provider connection fails",
              "Open /setup and verify the endpoint, key or sign-in, and selected model. For Ollama, ensure the server is running.",
            ],
            [
              "Context discovery fails",
              "Enter the model’s available context limit in setup. For Ollama, match the server allocation.",
            ],
            [
              "A file cannot be attached",
              "Check that the file exists, its size is at most 35 MiB, and fewer than 3 files are queued.",
            ],
            [
              "OCR or conversion is unavailable",
              "Follow the reported dependency hint. OCR needs Tesseract; document conversion needs firecrawl-anydoc.",
            ],
            [
              "Voice does not record",
              "Check /flow status, microphone permission, and the transcription-provider setup.",
            ],
            [
              "MCP will not connect",
              "Run /mcp doctor <server>. Verify its command or URL, variables, and authentication. Reset clears credentials, so reconnect afterward.",
            ],
          ]}
        />
      </section>
    </>
  );
}

const COMMAND_GROUPS: readonly { title: string; rows: Rows }[] = [
  {
    title: "Sessions",
    rows: [
      ["/new, /close", "Start or close a thread."],
      [
        "/sessions [<id>|--all|--list]",
        "Browse or resume saved conversations.",
      ],
      ["/rename <name>", "Rename the current conversation."],
      ["/clear", "Clear conversation history."],
      ["/compact [status]", "Compact context or inspect its status."],
      ["/exit, /quit", "Open the quit flow."],
    ],
  },
  {
    title: "Settings and account",
    rows: [
      [
        "/setup, /settings, /config",
        "Configure a provider, open settings, or inspect configuration.",
      ],
      ["/models, /theme", "Open the session model or theme picker."],
      ["/approval [<mode>|help]", "Inspect or change approval preferences."],
      [
        "/login, /logout, /status",
        "Manage iTE account sign-in and inspect the connection.",
      ],
      ["/refresh", "Refresh plan status, bundled models, and entitlements."],
      [
        "/usage, /activity, /stats",
        "Inspect account usage, recent activity, or session statistics.",
      ],
    ],
  },
  {
    title: "Workflow",
    rows: [
      [
        "/goal [<objective>|pause|resume|edit <objective>|clear]",
        "Manage the durable objective for this thread.",
      ],
      ["/plan [on|off]", "Inspect or change Plan mode."],
      ["/todos, /workboard", "Manage todos or view them with the plan."],
      ["/aside", "Ask a question in the side panel."],
      ["/retry", "Retry the last turn."],
      [
        "/attach [<path>|--list|--remove <index>|--clear]",
        "Pick files or manage the next message’s attachments.",
      ],
      ["/flow [status|setup|on|off]", "Configure voice transcription."],
    ],
  },
  {
    title: "Changes and Git",
    rows: [
      [
        "/changes, /history",
        "Open change review or inspect recorded change sets.",
      ],
      ["/undo, /redo", "Revert or reapply recorded file changes."],
      [
        "/branch [<name>|--create <name>]",
        "Inspect, switch, or create a Git branch.",
      ],
      [
        "/publish [<repository-url>|<remote-name> <repository-url>]",
        "Configure a Git destination if needed and push the current branch.",
      ],
    ],
  },
  {
    title: "Project customization",
    rows: [
      [
        "/init [--force]",
        "Generate AGENTS.md; --force overwrites the existing file.",
      ],
      ["/remind", "Re-inject project instructions."],
      [
        "/skills [help|show <name>|use <name>|drop <name>|clear]",
        "Discover, inspect, activate, or deactivate skills.",
      ],
      [
        "/skills add <path|owner/repo|git-url> [--global|--local]",
        "Install a skill bundle.",
      ],
      ["/skills trust, /skills untrust", "Manage workspace skill trust."],
      [
        "/subagent list, /subagent create, /subagent delete <name>",
        "List specialists, create one, or delete the named specialist.",
      ],
      [
        "/sandbox [on|off|allow <path>|remove <path>|clear|list]",
        "Manage filesystem restrictions.",
      ],
      [
        "/hooks [on|off]",
        "Inspect hooks or change their workspace enablement.",
      ],
      ["/memory [prompt <query>]", "Inspect memory and prompt inclusion."],
      ["/oi [on|off]", "Inspect or toggle Open Island notifications."],
    ],
  },
  {
    title: "MCP",
    rows: [
      ["/mcp", "Inspect configured servers."],
      [
        "/mcp start|stop|reset <server>",
        "Connect, disconnect, or clear credentials and tokens.",
      ],
      ["/mcp doctor <server>", "Diagnose configuration and connection issues."],
      ["/mcp env list [server]", "Inspect configured variables."],
      ["/mcp env where <server>", "Locate variable storage."],
      [
        "/mcp env set <server> <KEY> <VALUE>",
        "Set a variable; prefer import for secrets already in your environment.",
      ],
      [
        "/mcp env import <server> <KEY> [PROCESS_ENV_NAME]",
        "Import a process environment variable.",
      ],
      ["/mcp env unset <server> <KEY>", "Remove a variable."],
      [
        "/mcp add <server> [--scope global|workspace]",
        "Copy an existing server definition to another scope.",
      ],
    ],
  },
];

export function CommandReference() {
  return (
    <section className="docs-section" id="commands">
      <h2 data-scramble="true">Command reference</h2>
      <p>
        Slash commands run inside iTE. Type <code>/help</code> for available
        commands. In the reference below, square brackets mean optional
        arguments and a vertical bar separates alternatives; do not type those
        symbols.
      </p>
      {COMMAND_GROUPS.map(({ title, rows }) => (
        <div key={title}>
          <h3>{title}</h3>
          <ReferenceTable rows={rows} />
        </div>
      ))}
      <h3>Terminal commands</h3>
      <p>
        Run these in your shell, outside the iTE prompt. Use{" "}
        <code>ite --help</code> for current flags.
      </p>
      <ReferenceTable
        rows={[
          ["ite", "Start the terminal app in the current directory."],
          ["ite --cwd <directory>", "Start in a selected workspace."],
          ["ite --resume-last", "Resume the most recent workspace session."],
          ["ite --upgrade", "Upgrade using the detected installation method."],
          ["ite --version", "Print the installed version."],
          [
            "ite --model <name> --base-url <url>",
            "Override the loaded model and provider endpoint.",
          ],
          [
            "ite mcp add <server> --url <url> --scope workspace",
            "Persist a URL-based MCP definition.",
          ],
          [
            "ite mcp add <server> --command <executable> --arg <argument>",
            "Persist a stdio MCP definition; repeat --arg as needed.",
          ],
        ]}
      />
    </section>
  );
}
