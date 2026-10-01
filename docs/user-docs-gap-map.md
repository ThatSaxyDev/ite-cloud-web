# iTE web documentation gap map

Reviewed 1 October 2026 against iTE 0.2.28 (`1bb7d97`) and the current web `DocsPage.tsx`.

Scope: features people use in the local terminal app. Remote access, mobile control, hosted runtimes, and Telegram are excluded.

Implementation status: the local-workflow sections and reference are now implemented in `src/pages/docs/LocalWorkflowSections.tsx`, with setup and customization updates in `DocsPage.tsx`. Production build, section-anchor checks, and desktop/mobile navigation checks passed. Interactive iTE workflows remain source-verified rather than end-to-end tested.

This is an editorial map for updating the docs, not a claim that every item is newly introduced. Recent features and older undocumented workflows both matter to users. Implementation and command handlers are the evidence; design plans alone are not evidence of availability.

## What needs documenting

Priority 1 means essential to the current getting-started experience or a major new workflow. Priority 2 means useful everyday functionality. Priority 3 means optional or advanced usage.

| Priority | Topic | Current web coverage | What users need to know | Destination |
| --- | --- | --- | --- | --- |
| 1 | Goal mode | Missing | Start a durable objective with `/goal <objective>`; see milestones and verification evidence; pause, resume, edit, and clear it. Explain automatic continuation, saved goal state, blockers, completion, and usage limits. Editing leaves the goal paused; the composer Stop action pauses an active goal. Show when to use Goal mode versus Plan mode or a normal request. | New **Goal mode** section; cross-link from Usage and Commands |
| 1 | Settings and model selection | `/model <name>` is outdated; settings absent | `/settings` opens account/provider settings; `/models` opens the session model picker. Explain available models, provider setup, model-specific thinking controls, themes, and where to change approval preferences. Use picker screenshots rather than fixed model-name lists. | Rewrite Configure; new **Settings & models** section |
| 1 | Cloud account and bundled access | A short Pro bundled-access note | Show `/login`, `/status`, `/logout`, and `/refresh`; distinguish iTE account sign-in from provider sign-in. Explain bundled access versus bringing a provider key, account entitlements, 5-hour and 7-day usage windows, reset information, and recovery after a limit or failed refresh. Describe access as determined by the account rather than promising every model to every plan. | New **Account & usage** section; link from Configure |
| 1 | OpenRouter browser sign-in | Manual API key only | In `/setup`, select OpenRouter and use its sign-in button; explain browser approval, manual-key fallback, connected status, and OpenRouter sign-out. Distinguish this from `/logout`, which signs out of iTE. Verify credential-storage wording from the loader rather than copying old Markdown docs. | Configure → OpenRouter |
| 1 | Context windows and compaction | No usable guide | Explain the context meter, automatically discovered context limits, custom-provider/manual limits, and Ollama's effective server allocation. Show `/compact` and `/compact status`; explain continuation summaries and that compaction is not clearing the conversation. A manually entered limit does not reconfigure the model server. | New **Context & long conversations** section; link from Sessions |
| 1 | Attachments, PDFs, images, and documents | `/attach <path>` only; tool coverage incomplete | Show file-picker and dropped-path workflows, queued files, `/attach --list`, `--remove <index>`, and `--clear`. Current staging limits are 3 attachments and 35 MiB per file. Explain image-model compatibility and OCR dependencies. Demonstrate asking iTE to read PDFs and convert Office/OpenDocument/RTF/EPUB files to text. Distinguish file attachment from the agent's `read_document` tool; do not imply a native visual editor or full spreadsheet/PDF authoring. | New **Files & documents** section; update Tools |
| 2 | Current terminal workspace | Basic prompt examples only | Introduce the composer, thread switcher, side panels, model/context controls, and expanded tool output. Document Ctrl+Enter to send, Ctrl+C to interrupt, Ctrl+L to clear input, and F1 for help, plus the Goal-mode effect of Stop. Verify any additional composer key behavior before describing it. | Usage → Terminal basics |
| 2 | Session recovery | `/sessions` mentioned | Show the in-app resume picker, `/sessions <id>`, `/sessions --all`, and `ite --resume-last`. Explain workspace scoping, auto-save, rename, new/close thread, and what closing a thread versus clearing history means. Include how saved goals reappear with their session. | Usage → Sessions |
| 2 | Change review and publishing | Undo/redo and branch snippets | Add `/changes`, `/history`, and `/publish`; show reviewing a diff before accepting/publishing work. Explain that undo/redo applies to recorded file change sets, not arbitrary shell effects or actions in external systems. Verify publish arguments and remote configuration prompts from its handler when writing examples. | New **Review & Git** section |
| 2 | Plan, workboard, and aside | Plan basics and todos only | Show `/workboard` for plan/todos, `/aside` for a side conversation, plan questions and the transition into implementation. Connect these to Goal mode without implying that a todo list is a durable goal. | Usage → Planning & side questions |
| 2 | Voice / Flow | Missing | Show `/flow status`, `/flow setup`, `/flow on`, `/flow off`, and Ctrl+S to start/stop recording. Explain microphone permission, transcription into the focused text field, and availability through cloud auth or a Groq key. Direct users to the setup prompt rather than pasting a key into a slash command. | New **Voice input** section |
| 2 | Approvals and sandbox | Approval names only; sandbox absent | Describe all six approval policies, including `never`, using `/approval help` as the reference. Explain `/sandbox` status and on/off/allow/remove/clear/list controls, permitted paths, and how filesystem restrictions differ from approval prompts. Approval choice is a persisted global preference. | New **Permissions & safety** section |
| 2 | Skills lifecycle | Basic install/use/trust | Add GitHub/repository installation and `--global`/`--local`, untrust, clear, and drop. Explain activation, discovery precedence, workspace trust, and what untrust does to active project skills. Avoid hard-coding one Linux global path as universal. | Extend Skills |
| 2 | MCP setup and troubleshooting | stdio TOML and start/stop only | Document `ite mcp add`, URL-based servers, supported transports, browser OAuth and client-credentials authentication, env/secret management, copying scope, and `/mcp doctor`. Provide one local and one authenticated URL example; keep secrets out of committed config examples. | Extend MCP |
| 3 | Hooks | Missing | Explain configured automation, hooks being disabled by default, `/hooks` to inspect the panel, `/hooks on` and `/hooks off`, and a practical formatting/check example. Document events and configuration from the hook implementation. | New **Hooks** section under advanced usage |
| 3 | Memory and instruction refresh | AGENTS.md basics only | Explain `/memory` inspection and `/memory prompt <query>`, scoped instructions, `AGENTS.override.md`, fallback instruction files, and `/remind` to re-inject instructions. Clarify that `/remind` is an instruction refresh, not a scheduled reminder. | Extend AGENTS.md; advanced **Memory** subsection |
| 3 | Open Island | Missing | Optional macOS integration for local activity notifications and approval/question responses. Show `/oi`, `/oi on`, `/oi off`, prerequisites, and what users see when the companion is unavailable. | Optional **Integrations** subsection |

## Correct existing copy first

1. Replace `/model <name>` with `/models`. The current registered command opens a picker; it is not a model-name assignment command.
2. Separate installer prerequisites by method. The shell/PowerShell installers download a standalone runtime; Python 3.11+ belongs to Python package installation. The Unix installer still needs `python3` or `jq` for release-manifest parsing, so avoid promising zero system prerequisites.
3. Add `ite --upgrade`, which detects the installation method, and document matching uninstall methods. The current page gives `pipx` upgrade/uninstall guidance to all installer users.
4. Add account sign-in and provider sign-in as distinct setup paths. Keep entitlements and model availability conditional on what the account/model picker reports.
5. Add the missing `never` approval mode and describe the policies before listing them as a terse command argument.
6. Update the tool list for `read_pdf`, `read_image`, and `read_document`. Prefer workflow examples over asking users to type internal tool invocations.
7. Rewrite Subagents examples as natural-language requests or actual supported slash commands. `spawn_subagent` and `spawn_subagents` are agent tools; the existing pseudo-call snippets are not terminal commands.
8. Verify global configuration and skills paths by platform. The runtime resolves global config with `platformdirs.user_config_dir("ite")`; a blanket `~/.ite/config.toml` claim is misleading. Workspace config remains `.ite/config.toml`.

## Proposed navigation

Keep the existing section anchors where practical, so current links continue to work. Group navigation around the user journey:

- **Start:** Intro, prerequisites/install, account/provider setup, initialize a project.
- **Work:** Terminal basics, settings/models, plan/workboard/aside, Goal mode, files/documents, voice input, sessions/context, review/Git.
- **Customize:** AGENTS.md/memory, permissions/sandbox, skills, subagents, MCP, hooks, optional integrations.
- **Reference:** Slash commands, terminal CLI flags/subcommands, built-in capabilities, troubleshooting.

The existing single-page web docs contain their content directly in JSX. These groups are an editorial structure; they do not require a route redesign before the copy can be updated.

## Command-reference additions

Promote these verified local commands into the web reference:

- `/goal [<objective>|pause|resume|edit <objective>|clear]`
- `/settings`, `/models`, `/theme`, `/refresh`
- `/login`, `/status`, `/usage`, `/activity`
- `/compact`, `/compact status`, `/stats`
- `/changes`, `/history`, `/publish`
- `/workboard`, `/aside`
- `/flow status|setup|on|off`
- `/sandbox [on|off|allow <path>|remove <path>|clear|list]`
- `/hooks`, `/hooks on|off`, `/memory`, `/memory prompt <query>`, `/remind`
- `/oi`, `/oi on|off`
- Complete existing `/attach`, `/skills`, and `/mcp` entries from their handlers.

Keep terminal invocations separate: `ite --cwd <directory>`, `ite --resume-last`, `ite --upgrade`, model/provider flags, and `ite mcp add`. Avoid mixing agent tools, slash commands, and shell commands in one runnable example.

## Evidence and implementation notes

Paths below are relative to this web repository. These are local source references for the documentation work, not links to ship to users.

| Topic | Source of truth |
| --- | --- |
| Current web sections and copy | [DocsPage.tsx](../src/pages/DocsPage.tsx) |
| Goal commands/state/continuation | [goal command](../../ite/src/ite/commands/goal.py), [goal state](../../ite/src/ite/agent/goal.py), [native workflows](../../ite/src/ite/ui/reup/_turn.py), [composer stop](../../ite/src/ite/ui/reup/_composer.py) |
| Settings/models/account | [settings](../../ite/src/ite/ui/reup/settings.py), [model commands](../../ite/src/ite/commands/model.py), [general commands](../../ite/src/ite/commands/general.py), [account commands](../../ite/src/ite/commands/cloud.py), [setup UI](../../ite/src/ite/ui/reup/modals.py) |
| OpenRouter/configuration | [PKCE implementation](../../ite/src/ite/auth/openrouter_pkce.py), [loader](../../ite/src/ite/config/loader.py), [configuration models](../../ite/src/ite/config/config.py) |
| Sessions/context | [session commands](../../ite/src/ite/commands/session.py), [context manager](../../ite/src/ite/context/manager.py), [compaction](../../ite/src/ite/context/compaction.py) |
| Files/documents | [attachments](../../ite/src/ite/attachments.py), [attachment commands](../../ite/src/ite/commands/attach.py), [media tools](../../ite/src/ite/tools/builtin/media_tools.py), [model metadata](../../ite/src/ite/model_metadata.py) |
| Voice/keyboard | [Flow commands](../../ite/src/ite/commands/flow.py), [composer](../../ite/src/ite/ui/reup/_composer.py), [app bindings](../../ite/src/ite/ui/reup/app.py), [voice implementation](../../ite/src/ite/voice/) |
| Review/Git | [native workflows](../../ite/src/ite/ui/reup/_turn.py), [history commands](../../ite/src/ite/commands/history.py), [publish](../../ite/src/ite/commands/publish.py) |
| Advanced customization | [sandbox](../../ite/src/ite/commands/sandbox.py), [hooks](../../ite/src/ite/commands/hooks.py), [skills](../../ite/src/ite/commands/skills.py), [MCP commands](../../ite/src/ite/commands/info.py), [MCP auth](../../ite/src/ite/tools/mcp/), [instruction refresh](../../ite/src/ite/commands/remind.py), [Open Island](../../ite/src/ite/commands/open_island.py) |
| Installation and terminal commands | [CLI](../../ite/src/ite/main.py), [Unix installer](../../ite/install.sh), [Windows installer](../../ite/install.ps1) |

The web page does not import the Markdown files in `ite/docs/`. Its content is independently embedded in `DocsPage.tsx`. The older `ite/docs/README.md` refers to a `docs-content.json` that is absent from that directory; do not assume a shared content pipeline exists. The Python Markdown configuration guide also still calls bundled access “Coming Soon” and names credential paths that need rechecking.

Do not turn implementation-only changes into user-facing sections: event-loop fixes, scroll repairs, UI refactors, build internals, token-schema optimization, and the contributor repository-tour script. The computer-use design plan does not establish a shipped capability.

## Suggested writing order

1. Correct install/setup/model/approval instructions and write account/settings/context guides.
2. Add Goal mode and files/documents with runnable user examples.
3. Add terminal basics, session recovery, review/Git, planning/aside, and voice.
4. Expand skills/MCP and add advanced permissions, hooks, memory, and optional integrations.
5. Synchronize the command reference, verify every example against the registered commands and native UI dispatch, then review desktop/mobile web rendering.

Before publishing, validate the interactive paths for setup, sign-in, Goal pause/resume, attachment errors, compaction, voice permissions, and MCP auth. This mapping is based on source inspection and local history; those end-to-end flows have not been run as part of this audit.
