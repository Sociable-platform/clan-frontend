# clan-frontend

Developer dashboard for the clan platform. React + plain JavaScript (Vite), React Router, TanStack Query (server state), Zustand (auth session only), plain CSS, Vitest + Testing Library. No TypeScript, no Tailwind.

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
| `/games` | `RequireAuth` (guests go to `/login`, then back) | Games: list, "Register existing game" |
| `/games/:gameId` | `RequireAuth` | A game's API keys: create (shown once), list, revoke; link to the widget editor |
| `/games/:gameId/widget` | `RequireAuth` | Widget editor: edit the game's draft config, autosaved |

The login response is `{ token, expiresIn }` (no cookie), so the token is kept in `localStorage` (`src/store/authStorage.js`) and restored at startup by `useSessionInitializer`, which asks `GET /api/v1/developers/me` who it belongs to. Guards show a loading state until that finishes. Log out clears the store and the stored token; the backend has no logout endpoint.

## Games and API keys

Server state (games, API keys) lives in TanStack Query; the query client (`src/shared/api/queryClient.js`) retries queries once and never retries mutations, and its cache is emptied when the session ends. The wording is "Register existing game": the backend only records an integration for a game the developer already has.

A new API key's full value comes back from `POST /api/v1/games/{gameId}/api-keys` exactly once. It is kept in page state (never the query cache), shown with a warning and a copy button, and gone once dismissed or the page is left; the list only ever shows the key prefix. Revoking asks for confirmation in a Radix alert dialog.

## Widget editor

`/games/:gameId/widget` edits the game's draft widget config: the document defined in `docs/config-v1/` (schema, limits, versioning rules). Sections: Style, Layout, Clan, Chat, Texts, and Advanced (the whole draft as read-only JSON, with its size against the 64 KB limit).

- **Draft:** `GET` and `PUT /api/v1/games/{gameId}/widget/draft`. The form edits a local copy; the server copy is only the starting point.
- **Autosave:** 3 seconds after the last edit. The header shows Saved, Saving…, Unsaved changes or Could not save (with Retry). Leaving the page saves a waiting edit at once, and closing the tab with unsaved work asks first.
- **Validation errors:** a `400` with code `invalid_widget_config` and `error.details` = `[{ path, rule, message? }]`, where `path` is a JSON Pointer such as `/clan/maxMembers` (`""` for the whole document). Each message appears next to its field, the section tab shows how many problems it holds, and a path no field shows is listed at the top. A rejected draft is not resent until the next edit.
- **Contract assumptions** (until the draft endpoints are in `platform.yaml`, TEAM-113): `GET` returns the config document itself, not wrapped; `PUT` takes the document as its body and any `2xx` means saved. Both live in `src/features/widget/api/`; the error shape is read in `utils/widgetDraftErrors.js`.
- **Options stay in step with the contract:** the fonts, choices, label keys and limits offered by the form are checked against `config.v1.schema.json` by `widgetOptions.test.js`.

