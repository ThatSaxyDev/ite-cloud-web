# AGENTS.md

## Project Overview

**Project:** `ite-cloud-web`

The standalone user-facing frontend for iTE (Interactive Terminal Environment). Provides login/sign-up UI, session management, and account pages. Communicates with `ite-cloud-api` as an external service.

## Architecture

```
src/
├── main.tsx              # Entry point - React root render
├── App.tsx               # Root component with routing
├── styles.css            # Global styles
├── vite-env.d.ts         # Vite types
├── components/           # Reusable UI components
│   ├── AccountLayout.tsx
│   ├── AmbientTriangles.tsx
│   ├── GlitchImageLogo.tsx
│   ├── GlobalInteractionEffects.tsx
│   └── StartupPreloader.tsx
├── pages/                # Route-level page components
│   ├── LoginPage.tsx
│   ├── CliAuthPage.tsx
│   ├── AccountSessionsPage.tsx
│   ├── SettingsPage.tsx
│   ├── DocsPage.tsx
│   └── ...
└── lib/                  # Utilities and services
    ├── auth-client.ts    # better-auth client config
    ├── api.ts
    ├── config.ts
    └── browser-state.ts
```

**Routes:**
- `/` - Landing page
- `/login` - Authentication
- `/auth/cli` - CLI device auth
- `/account/sessions` - Session management
- `/account/settings` - Account settings

## Development Guidelines

**Build Commands:**

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

**Code Patterns:**

| Convention | Pattern |
|------------|---------|
| Imports | `import { X } from "@/path"` (path aliased to `src/`) |
| Components | PascalCase files, named exports |
| Hooks | `use` prefix, camelCase |
| Constants | UPPER_SNAKE_CASE |
| Types/Interfaces | PascalCase, explicit typing |
| Libs | `*.client.ts` for browser-only code |

**Key Libraries:**
- React 19 + React Router v7
- TypeScript 5
- Vite (build tool)
- better-auth (authentication)
- nanostores (state management)

## Configuration

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite config with @/ alias |
| `tsconfig.json` | TypeScript config |
| `package.json` | Dependencies and scripts |
| `index.html` | HTML entry point |
| `netlify.toml` | Deployment config |

**Environment:**
- Dev server runs via Vite
- Build outputs to `dist/`
- Path alias `@/` resolves to `src/`
