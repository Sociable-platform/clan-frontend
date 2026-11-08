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

`platformClient` (`src/shared/api`) is the single fetch-based client. It sends JSON, adds `Authorization: Bearer <token>`, and throws `ApiError { status, code, message }` built from the backend's `{ "error": { "code", "message" } }` shape. Network failures become `ApiError` with code `network_error`. A 401 calls the `onUnauthorized` handler once, except for requests passed `skipAuthHandling: true` (use it for login so a wrong password stays a form error). The auth feature wires the token and handler with `registerSessionHandlers`.

## App frame and theme

`AppLayout` is one top bar, as in the SocialKit Studio design: the brand mark and wordmark, the Home and Games links, a slot for the page's own controls, and a single account button at the end. A page puts controls into the slot with `HeaderSlot` (the widget editor shows its game chip, save state and Show/Hide config there); without an app frame around, they render in place.

The account button (`UserMenu`, a Radix dropdown) is a user icon that opens a menu: who is signed in, the **theme** choice (Light or Dark) and Log out; signed out, it offers Log in and Register instead. The theme switches the whole dashboard (`data-theme` on `<html>`, set by `initTheme()` before the first render). Light is the default for this B2B surface; the choice is remembered in this browser (`src/shared/theme/`). There is no profile page yet, so the menu has no "Profile settings" item.

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

`/games/:gameId/widget` edits the game's draft widget config: the document defined in `docs/config-v1/` (schema, limits, versioning rules). The page follows the SocialKit Studio design (light theme) as three columns: a **settings** panel on the left (tabs Layout, Clan, Chat, Texts), the **preview** and the **Experience config** (the whole draft as read-only JSON, with its size against the 64 KB limit, toggled by Show/Hide config) in the middle, and a **Style** panel on the right (tabs Colors, Type, Shape, Textures). Below 1100px the columns wrap: settings and style side by side from 768px, one column on a phone. The preview area is a placeholder until the shared widget renderer exists.

- **Draft:** `GET` and `PUT /api/v1/games/{gameId}/widget/draft` (`openapi/platform.yaml`). `GET` answers `{ config, updatedAt }`, `PUT` takes `{ config }`. A game with no saved draft gets `{ "schemaVersion": 1 }` from the server, so the editor completes whatever is missing from `DEFAULT_WIDGET_CONFIG` (saved values always win, unknown keys are kept). The form edits a local copy; the server copy is only the starting point.
- **Publish:** the **Publish vN** button in the bar saves the draft first (even one nobody edited, and any edit still waiting for its timer), then calls `POST .../widget/publish`, because the server publishes the draft it holds, not what the browser shows. If the draft cannot be saved nothing is published and the reason is shown. A success shows "Published version N"; a failure says nothing was published and why (`invalid_widget_config` with the server message and any `details`, `widget_draft_missing`, network). The chip next to the save state reads Not published yet, Published · vN, or Draft · unpublished changes (the draft is compared with the live version's config, ignoring key order).
- **Version history:** a card (Show/Hide history) lists the published versions newest first with their date; the newest is Live. **Preview** loads that version (`GET .../versions/{n}`) and shows its config read-only in place of the draft config, with Back to draft. **Roll back** opens a confirmation, then calls `POST .../versions/{n}/rollback`: the old config is published again as a new version on top, which then shows as the newest. Nothing is deleted and the draft is not changed. There is no Roll back for the live version.
- **Autosave:** 3 seconds after the last edit. The header shows Saved, Saving…, Unsaved changes or Could not save (with Retry). Leaving the page saves a waiting edit at once, and closing the tab with unsaved work asks first.
- **Validation errors:** the server currently checks only that the config is a JSON object up to 64 KB, and answers `400 invalid_widget_config` with a message, which the editor shows at the top. The editor is ready for per-field errors (W3): `error.details` = `[{ path, rule, message? }]` with `path` a JSON Pointer such as `/clan/maxMembers` (`""` for the whole document) will appear next to each field, with a problem count on the section tab, and a path no field shows is listed at the top. That `details` shape is an agreement with the backend, not yet in `platform.yaml`. A rejected draft is not resent until the next edit. Each error is routed to the tab that holds its field (`config/widgetSections.js`), so a problem on a tab you are not looking at still shows as a count on that tab and in the config panel.
- **Options stay in step with the contract:** the fonts, choices, label keys and limits offered by the form are checked against `config.v1.schema.json` by `widgetOptions.test.js`.

