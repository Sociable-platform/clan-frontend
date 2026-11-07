# clan-frontend

Developer dashboard for the clan platform. React + plain JavaScript (Vite), React Router, Zustand (auth session only), plain CSS, Vitest + Testing Library. No TypeScript, no Tailwind.

The backend lives in `../clan-backend`; the Platform API contract is `openapi/platform.yaml`.

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

## Layout

```
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

`platformClient` (`src/shared/api`) is the single fetch-based client. It sends JSON, adds `Authorization: Bearer <token>`, and throws `ApiError { status, code, message }` built from the backend's `{ "error": { "code", "message" } }` shape. Network failures become `ApiError` with code `network_error`. A 401 calls the `onUnauthorized` handler once, except for requests passed `skipAuthHandling: true` (use it for login so a wrong password stays a form error). The auth feature wires the token and handler with `registerSessionHandlers`.

## Auth and routes

| Route | Guard | Page |
|---|---|---|
| `/` | none | Home |
| `/login`, `/register` | `GuestOnly` (logged-in developers are redirected on) | Login, Register |
| `/projects` | `RequireAuth` (guests go to `/login`, then back) | Projects |

The login response is `{ token, expiresIn }` (no cookie), so the token is kept in `localStorage` (`src/store/authStorage.js`) and restored at startup by `useSessionInitializer`, which asks `GET /api/v1/developers/me` who it belongs to. Guards show a loading state until that finishes. Log out clears the store and the stored token; the backend has no logout endpoint.
