# Development

Running Studio, its settings, how the code is laid out, the API client and the stylesheets. Back to the [README](../README.md).

The stack: React + plain JavaScript (Vite), React Router, TanStack Query (server state), Zustand (auth session only), plain CSS, Vitest + Testing Library. No TypeScript, no Tailwind. The backend lives in `../clan-backend`; the Platform API contract is `openapi/platform.yaml` there.

## Run

```sh
cp .env.example .env   # set VITE_PLATFORM_URL
npm install
npm run dev            # http://localhost:5173
npm run build          # production build into dist/
npm test               # unit and component tests (vitest run)
```

The Platform service accepts browser calls only from `http://localhost:5173` by default, so keep the dev port.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_PLATFORM_URL` | Base URL of the Platform API, e.g. `http://localhost:8081`. In `npm run dev` it falls back to that value when unset. |
| `VITE_SUPPORT_EMAIL` | Optional. The support address, shown on the Support page (`/support`) and in the banner a suspended developer sees. Without it the team's address is used: `sociableplatform.support@gmail.com` (the default in `shared/config/env.js`). |
| `VITE_DOCS_URL` | Optional. An outside address for the documentation. Without it the Docs links (landing header and footer) open the guide built into Studio at `/docs`; set it only if the docs move to a site of their own. |
| `VITE_SDK_URL`, `VITE_SOCIAL_URL`, `VITE_REALTIME_URL` | Optional. The addresses the guide shows in its code samples. Without them they follow `VITE_PLATFORM_URL`: on the hosted platform the services are siblings (`platform.<host>` gives `sdk.<host>`, `social.<host>`, `realtime.<host>`), and for a local address they are the docker compose ports (8082, 8083, and 18080 for the SDK). |

## Layout

```
packages/
  ui/         @clan/ui: the config-driven widget renderer shared with the SDK (see its README)
src/
  app/        entry wiring: App, router, global CSS
  pages/      one folder per route (lazy-loaded)
  features/   vertical slices (ui/, hooks/, api/, ...) - never import another feature
  store/      global client state: the auth session (Zustand)
  test/       shared test setup, builders, router helper
  shared/
    api/      HTTP client, ApiError, endpoint paths
    config/   env access (the only reader of import.meta.env)
    ui/       business-agnostic components
```

Import through a folder's `index.js` and use the `@/` alias for `src/`. Components call hooks, hooks call a feature's `api/`, and only `api/` talks to `shared/api`.

## API client

`platformClient` (`src/shared/api`) is the single fetch-based client. It sends JSON, adds `Authorization: Bearer <token>`, and throws `ApiError { status, code, message }` built from the backend's `{ "error": { "code", "message" } }` shape. Network failures become `ApiError` with code `network_error`. A 401 first asks the `refreshToken` handler for a new token and repeats the request once; only when that does not help it calls the `onUnauthorized` handler, once. Requests passed `skipAuthHandling: true` do neither (use it for login so a wrong password stays a form error). The auth feature wires the token and the handlers with `registerSessionHandlers`.

## Styles

The stylesheet is plain CSS in parts under `src/app/styles/`, and `src/app/index.css` only imports them. The order of the imports matters: where two rules are equally specific, the later file wins.

| File | What is in it |
| --- | --- |
| `fonts.css` | The `@font-face` rules for Pilat and Aktiv Grotesk |
| `tokens.css` | The brand palette and the semantic tokens, light and dark |
| `base.css` | Body text, headings, links, the focus ring |
| `layout.css` | The app frame (top bar, footer), the sidebar frame, the banner |
| `forms.css` | Buttons, the auth pages, fields and forms |
| `components.css` | Page scaffolding, lists and tables, the admin pages, API keys, badges, states, skeletons, toasts, dialogs |
| `editor-controls.css` | The widget editor's form controls: switches, steppers, colour rows, choices, fonts |
| `editor.css` | The widget editor's layout, preview, publishing, versions, assets and roles |
| `home.css` | The landing page |
| `games.css` | The games page |
| `team.css` | The team and invitations pages |
| `support.css`, `docs.css` | The Support page and the developer guide |

A new page gets a file of its own, imported after the shared files. `designTokens.test.js` fails when a file in `styles/` is not imported, or when a `var()` names a token nobody defines.
