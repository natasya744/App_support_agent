# Frontend setup

The frontend is the `dashboard/` folder: a Vite + React + TypeScript single-page app styled with Tailwind v4 and shadcn/ui. It does **not** connect to Supabase directly — it calls the FastAPI backend, which owns the database.

## 1. Prerequisites

- **Node.js** matching the installed Vite version: `^20.19.0 || >=22.12.0` (from `dashboard/package-lock.json`). The Docker build uses `node:20-alpine`.
- **npm** — the repo contains `dashboard/package-lock.json` (lockfile v3) and no other package-manager lockfile.
- The **backend running on `http://localhost:8000`** — see [backend_setup.md](backend_setup.md). The dev server proxies `/api` to that address, so login and every data view fail without it.
- **No frontend environment variables are needed.** There is no `.env` in `dashboard/`, and no `VITE_*` / `import.meta.env` usage in `dashboard/src`.

## 2. Install dependencies

```bash
cd dashboard
npm ci
```

`npm ci` installs exactly what `package-lock.json` records. `npm install` (as written in the root README) also works.

Key dependencies:

| Package | Purpose |
| --- | --- |
| `react`, `react-dom` (19) | UI runtime. |
| `vite` (8) | Dev server and bundler. |
| `typescript` (~6.0) | Typechecking/build. |
| `@vitejs/plugin-react` | React support for Vite. |
| `tailwindcss` (4), `@tailwindcss/vite` | Styling pipeline. |
| `shadcn`, `radix-ui`, `lucide-react` | UI components and icons. |
| `cn`, `class-variance-authority` | Class-name helpers. |
| `@fontsource-variable/geist`, `tw-animate-css` | Font and animation CSS imported by `src/index.css`. |

Dev tools: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `prettier`, `prettier-plugin-tailwindcss`, `@types/*`, `globals`.

> Note: `eslint` requires `^20.19.0 || ^22.13.0 || >=24`; an older Node 20 patch release will satisfy Vite but fail linting.

## 3. Run in development

From the repository root, with the backend already running:

```bash
cd dashboard
npm run dev
```

Open <http://localhost:5173> (Vite's default port; no `server.port` is set in `vite.config.ts`).

`vite.config.ts` configures:

- React and Tailwind plugins.
- `@` → `./src` path alias.
- `server.proxy` for `/api` → `http://localhost:8000` with `changeOrigin: true`.

Log in with the `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` values from the root `.env`. `DASHBOARD_PASSWORD` must be non-empty or the backend rejects every call with 401.

## 4. Available scripts

Run these inside `dashboard/`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server (port 5173). |
| `npm run build` | `tsc -b && vite build` — typecheck project references, then build into `dist/`. |
| `npm run preview` | `vite preview` — serve the built `dist/` locally. |
| `npm run lint` | `eslint .` — lint check. |
| `npm run typecheck` | `tsc --noEmit` — types only, no build. |
| `npm run format` | `prettier --write "**/*.{ts,tsx}"` — **rewrites files**, it is not a check. |

Typical verification before committing:

```bash
npm run typecheck
npm run lint
npm run build
```

## 5. How the app is structured

| File | Role |
| --- | --- |
| `index.html` | HTML shell, loads `/src/main.tsx`, favicon `/vite.svg`. |
| `src/main.tsx` | React root; wraps `<App />` in `<ThemeProvider>`. |
| `src/App.tsx` | Login gate, header, theme toggle, logout, and three tabs. |
| `src/lib/api.ts` | `api<T>()` fetch wrapper, Basic-auth header, `saveLogin`/`logout`. |
| `src/lib/types.ts` | `SupportEvent`, `Ticket`, `Message`, `Entry` and `formatDate`. |
| `src/lib/utils.ts` | Re-exports `cn` from the `cn` package. |
| `src/pages/login.tsx` | Username/password form. |
| `src/pages/events.tsx` | Event list, Refresh, "Check inbox now". |
| `src/pages/tickets.tsx` | Ticket table, search/status filters, conversation thread. |
| `src/pages/knowledge-base.tsx` | Knowledge-base list by section and inline editor (PUT). |
| `src/components/` | Theme provider/toggle, status badge, and `ui/` primitives. |
| `src/index.css` | Tailwind + shadcn + Geist font imports and dark-mode variables. |
| `public/vite.svg` | Favicon. |

There is **no router** — navigation is three tabs (`events`, `tickets`, `knowledge-base`) held in `App.tsx`.

Authentication is HTTP Basic: `src/lib/api.ts` stores `btoa("username:password")` in `sessionStorage` under `dashboard-login` and sends it as `Authorization: Basic ...` with every request. A 401 clears the session and shows "Wrong username or password".

## 6. API calls the frontend makes

All URLs are relative (`/api/...`) and are resolved by the Vite proxy in dev or by FastAPI's static mount in production.

| Method | URL | Used by |
| --- | --- | --- |
| `GET` | `/api/login` | `src/pages/login.tsx` |
| `GET` | `/api/events` | `src/pages/events.tsx` |
| `POST` | `/api/poll` | `src/pages/events.tsx` ("Check inbox now") |
| `GET` | `/api/tickets` | `src/pages/tickets.tsx` |
| `GET` | `/api/tickets/{id}/messages` | `src/pages/tickets.tsx` |
| `GET` | `/api/knowledge-base` | `src/pages/knowledge-base.tsx` |
| `PUT` | `/api/knowledge-base/{id}` | `src/pages/knowledge-base.tsx` |

These match the routes declared in `app/main.py`. Only `/health` is public.

## 7. Production build

```bash
cd dashboard
npm run build
```

The output is `dashboard/dist/` (`index.html`, hashed JS/CSS, fonts, `vite.svg`). `app/main.py` mounts that folder at `/` when it exists, so open <http://localhost:8000> after starting the backend — no separate static host is required.

Because the mount is set up when the module is imported, build the dashboard **before** starting uvicorn, and restart uvicorn after rebuilding. The same thing happens automatically in Docker: the Dockerfile's first stage runs `npm ci && npm run build` and copies `dist/` into the backend image.

`npm run preview` is a local way to inspect the built bundle; remember it does not provide the `/api` proxy, so API calls will fail unless you point it at a running backend.

## 8. Troubleshooting

- **Login always fails / 401 on every page** — the backend is not running on port 8000, or `DASHBOARD_PASSWORD` in the root `.env` is empty. Check `curl http://localhost:8000/health`.
- **API calls fail in dev but `/health` works** — check `server.proxy` in `vite.config.ts` and make sure no other process occupies port 5173 or 8000.
- **Build fails on `tsc -b`** — run `npm run typecheck` to see the errors; the config uses `strict`, `noUnusedLocals` and `verbatimModuleSyntax`.
- **"Check inbox now" throws** — this is a backend bug, not a frontend one: `app/main.py` calls `poll_once()` without the required `gmail` argument. Use the background poller instead (see [backend_setup.md](backend_setup.md#11-known-issues-in-the-current-code)).
