# AGENTS.md

## Project Overview

**Project:** `ite-cloud-web` — standalone user-facing frontend for iTE (Interactive Terminal Environment).

Browser-only React client covering landing, docs, pricing, login/sign-up, CLI device authorization, and the account area (settings, usage, billing, sessions). It calls `ite-cloud-api` (a sibling service in the `itetheagt` monorepo) as an external backend and owns no server-side code.

This is one sub-project of the `itetheagt` monorepo; each sibling has its own build system and `AGENTS.md`. Scope `README.md` is intentionally milestone-focused — it still describes Milestone 1 (`/login`, `/auth/cli`, `/account/sessions`) and is not a complete feature list; this file is.

## Architecture

```
ite-cloud-web/
├── index.html              # Vite HTML entry (mounts #root)
├── vite.config.ts          # @vitejs/plugin-react + "@" -> src alias
├── tsconfig.json           # strict, noEmit, bundler resolution, include: ["src"]
├── src/
│   ├── main.tsx            # React root render; wraps App in BrowserRouter + StrictMode
│   ├── App.tsx             # All routes + global chrome (preloader, ambient, effects) + HomePage
│   ├── styles.css          # Single global stylesheet (no CSS modules / CSS-in-JS)
│   ├── components/         # Presentational + layout components (visual effects, AccountLayout)
│   ├── pages/              # Route-level components
│   │   └── docs/           # Sub-sections of the in-app docs page
│   ├── lib/                # API client, auth client, config, browser storage, hooks
│   └── assets/             # Bundled images imported by components
├── public/                 # Copied verbatim: demo.mp4, install.sh, install.ps1,
│                           # releases/manifest.json, brand/hero images
├── docs/                   # MANUAL_TEST.md, user-docs-gap-map.md
└── .ite/                   # Local agent workspace (git-ignored, not project config)
```

**Routes** (all declared in `src/App.tsx`):

| Path | Component |
|------|-----------|
| `/` | `HomePage` (defined inside `src/App.tsx`) |
| `/docs` | `DocsPage` |
| `/pricing` | `PricingPage` |
| `/login` | `LoginPage` |
| `/auth/cli` | `CliAuthPage` |
| `/account` | `AccountLayout` (auth guard + rail nav, renders `Outlet`) |
| `/account/settings` | `SettingsPage` (index route; `/account` redirects here) |
| `/account/usage` | `ActivityPage` |
| `/account/billing` | `BillingPage` |
| `/account/sessions` | `AccountSessionsPage` |
| `/account/activity` | Redirect to `/account/usage` |
| `*` | Redirect to `/` |

Adding a route means editing the `Routes` tree in `src/App.tsx` and, for account pages, the `sections` array in `src/components/AccountLayout.tsx`.

**Key modules:**

- `src/lib/config.ts` — the only place `VITE_API_URL` and `VITE_DEV_AUTH_BYPASS` are read.
- `src/lib/api.ts` — typed `api` object wrapping `fetch` against `${config.apiUrl}` with `credentials: "include"`, a 15s abort timeout, and normalized error messages. Add backend calls here.
- `src/lib/auth-client.ts` — `better-auth` client with `emailOTPClient()`, pointed at `config.apiUrl`.
- `src/lib/use-account-resource.ts` — `useAccountResource(fetcher)` (data/error/loading/refresh/setData, refetch on focus + 30s poll) and `accountError(error)` for user-facing error strings. Use these instead of ad-hoc fetch state.
- `src/lib/dev-auth.ts` — local-only bypass user, gated on `import.meta.env.DEV`.
- `src/lib/browser-state.ts` — `localStorage` flags (`ite-known-user`, `ite-seen-browser`), guarded for SSR safety.
- `src/lib/install-command.ts` — install command strings (`INSTALL_COMMANDS`), OS detection, and the copy-reel slot builders.
- `src/components/AccountLayout.tsx` — auth guard: checks `getDevAuthUser()` then `authClient.getSession()`, redirects to `/login?redirect=…`, and passes the user through `<Outlet context={user} />`.

## Development Guidelines

**Commands** (from `package.json`):

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server via `vite --host 127.0.0.1 --port 3000` |
| `npm run build` | Typecheck then bundle: `tsc -b && vite build` |
| `npm run preview` | Serve `dist/` on `http://127.0.0.1:3000` |

There is **no** test runner, linter, or formatter configured in this package. `npm run build` is the verification gate — it runs `tsc -b`, so type errors fail the build. For manual verification flows, see `docs/MANUAL_TEST.md` (start `ite-cloud-api` first, then this app on `http://127.0.0.1:3000/login`).

**Code Patterns:**

| Convention | Pattern |
|------------|---------|
| Imports | `import { X } from "@/lib/api"` — `@` aliases `src/` (see `vite.config.ts`, `tsconfig.json` `paths`) |
| Components | PascalCase files, **named** exports (`export function LoginPage()`) |
| Pages | One component per route, exported by name, imported by `src/App.tsx` |
| Hooks | `use` prefix, camelCase, co-located in `src/lib/` |
| Constants | UPPER_SNAKE_CASE, often `as const` maps (`INSTALL_COMMANDS`) |
| Types | PascalCase, exported alongside usage; inline generics on `api.*` methods |
| Formatting | 2-space indent, double quotes, semicolons, trailing commas in multiline literals |
| Data fetching | `useAccountResource(api.someCall)`; mutate locally via `setData` after optimistic updates |
| Errors | Always resolve to a user-facing sentence via `accountError()`; never surface raw API payloads |

**Dependencies:** React 19, react-router-dom 7, TypeScript 5, Vite 6, better-auth 1.6. `zod` and `nanoid` appear only as `overrides` pins — no `src/` file imports them.

**Styling:** all CSS lives in `src/styles.css` using BEM-ish class names (`record-hero__copy`, `workspace-rail`, `line-install__reel`). Add new rules there rather than introducing CSS modules or inline style objects (inline styles appear only for computed animation values via `CSSProperties`).

**Accessibility conventions already in use** — keep them: skip links (`#main-content`, `#account-main`), `aria-live`/`role="status"`/`role="alert"` on async state, `sr-only` text alongside `aria-hidden` visual text, and `prefers-reduced-motion` guards (multiple `@media (prefers-reduced-motion: reduce)` blocks in `src/styles.css`; also checked in JS via `window.matchMedia` in `src/App.tsx`) before non-essential animation.

## Configuration

| File | Purpose |
|------|---------|
| `vite.config.ts` | React plugin + `@` alias |
| `tsconfig.json` | Strict TS, `noEmit`, ES2022, bundler resolution, `include: ["src"]` |
| `.env.example` | Local template: `VITE_API_URL`, `VITE_DEV_AUTH_BYPASS=1` |
| `.env.production.example` | Production env template consumed by the Docker build |
| `Dockerfile` | Multi-stage: `node:22-bookworm-slim` build (`npm ci`, `npm run build`) → `nginx:1.27-alpine` serving `dist/` on port 80 |
| `nginx.conf` | SPA fallback via `try_files $uri $uri/ /index.html` |
| `netlify.toml` | Alternate deploy: `rm -rf node_modules package-lock.json && npm install && npm run build`, publish `dist`, `/demo.mp4` immutable cache header, pass-through for `install.sh`, `install.ps1`, `/releases/*`, SPA redirect |
| `.github/workflows/diagnose-windows-runtime.yml` | Manual (`workflow_dispatch`) Windows CLI runtime diagnostic — not web CI |

**Environment variables** (Vite-prefixed, read only in `src/lib/config.ts`):

- `VITE_API_URL` — `ite-cloud-api` base URL; defaults to `http://127.0.0.1:4000`.
- `VITE_DEV_AUTH_BYPASS=1` — only honored when `import.meta.env.DEV`; returns a fake dev user and skips session checks.

Local setup: `cp .env.example .env.local`, then run `npm install`, followed by `npm run dev`. Never commit `.env` or `.env.local` (see `.gitignore`).

**Deployment notes:** the API base URL is baked in at build time (`VITE_API_URL` build arg in `Dockerfile`). API calls are credentialed cross-origin, so the API must allow this origin. Both `nginx.conf` and `netlify.toml` implement SPA fallback — keep them in sync when adding routes that need deep-link refresh.
