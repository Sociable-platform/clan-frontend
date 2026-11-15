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

## Build and deploy

Studio ships as a container image: the built app served by nginx on port 8080 (`Dockerfile`, `deploy/nginx.conf`). `VITE_PLATFORM_URL` is baked into the JavaScript at build time.

| CI job (`.gitlab-ci.yml`) | When | What it does |
|---|---|---|
| `publish-ui` | `develop`, when `packages/ui` changed | tests `packages/ui` and publishes a new `@clan/ui` version for clan-sdk |
| `images` | `develop` and `main` (by hand on a merge request) | builds the Studio image for amd64 and arm64 and pushes `clan-frontend/studio:<short commit sha>` |
| `deploy` | `main` only, after `images` | deploys that image to the k3s server |

**Every merge to `main` is deployed.** `deploy/deploy.sh <tag>` copies the chart in `deploy/helm/studio` to the server over SSH and runs `helm upgrade --install clan-studio ... --set image.tag=<tag> --wait`; if the new pod is not ready within 5 minutes the deploy fails and the old pod keeps serving. Studio is its own Helm release (`clan-studio`) in the `clan` namespace, at `https://studio.130-61-158-79.sslip.io`, so a release needs no change in clan-backend. It reuses that chart's registry pull secret (`gitlab-registry`) and certificate issuer (`clan-letsencrypt`), so clan-backend must be installed first.

- The job needs the CI/CD variables `DEPLOY_SSH_KEY_B64` and `DEPLOY_SSH_KNOWN_HOSTS` (protected, the same two clan-backend and clan-sdk use), and `main` must be a protected branch.
- Which build runs, and rolling back: GitLab -> Operate -> Environments -> `studio-production`, where an older deploy can be run again.
- From a laptop (Git Bash): `bash deploy/deploy.sh <short commit sha>`, with your own SSH key.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_PLATFORM_URL` | Base URL of the Platform API, e.g. `http://localhost:8081`. In `npm run dev` it falls back to that value when unset. |
| `VITE_SUPPORT_EMAIL` | Optional. The address a suspended developer is told to write to (shown in the suspension banner). Without it the banner says to contact the Sociable team, with no address. |

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

`AppLayout` is one top bar, as in the SocialKit Studio design: the Xsolla wordmark and the product name (a link home), a slot for the page's own controls, and a single account button at the end, whose menu has Your games for a signed-in developer. Above the bar is a slot for a page's full-width notice (`TopSlot`; the landing page's announcement strip). A page puts controls into the slot with `HeaderSlot` (the widget editor shows its game chip, save state and Show/Hide config there); without an app frame around, they render in place.

The account button (`UserMenu`, a Radix dropdown) is a user icon that opens a menu: who is signed in, the **theme** choice (Light or Dark) and Log out; signed out, it offers Log in and Register instead. The theme switches the whole dashboard (`data-theme` on `<html>`, set by `initTheme()` before the first render). Light is the default for this B2B surface; the choice is remembered in this browser (`src/shared/theme/`). There is no profile page yet, so the menu has no "Profile settings" item.

## Auth and routes

| Route | Guard | Page |
|---|---|---|
| `/` | none | Home |
| `/login`, `/register` | `GuestOnly` (logged-in developers are redirected on) | Login, Register |
| `/games` | `RequireAuth` (guests go to `/login`, then back) | Games: list, "Register existing game" |
| `/games/:gameId` | `RequireAuth` | A game's API keys: create (shown once), list, revoke; link to the widget editor |
| `/games/:gameId/widget` | `RequireAuth` | Widget editor: edit the game's draft config, autosaved |
| `/admin/login` | `GuestOnly role="admin"` (anyone not already an admin sees the form) | Admin sign in |
| `/admin`, `/admin/developers` | `RequireRole role="admin" stealth` | Developers list with search and status filter; `/admin` redirects here |
| `/admin/developers/:developerId` | `RequireRole role="admin" stealth` | One developer: status and reason, their games, and the status history (audit log) |

The login response is `{ token, expiresIn }` (no cookie), so the token is kept in `localStorage` (`src/store/authStorage.js`) and restored at startup by `useSessionInitializer`, which asks `GET /api/v1/developers/me` who it belongs to. Guards show a loading state until that finishes. Log out clears the store and the stored token; the backend has no logout endpoint.

**Admin session.** The session has a `role` (`developer` or `admin`), stored next to the token; a session stored before roles existed counts as a developer's. Admins sign in at `POST /api/v1/admin/login` and are restored through `GET /api/v1/admin/me`. There is one session at a time: logging in as admin replaces a developer session (and the other way round), and the query cache is emptied when that happens so the next person never sees the previous one's data. `RequireAuth` sends an admin who opens a developer page to `/admin/developers`. In `stealth` mode `RequireRole` shows the 404 page instead of redirecting, so a guest or a developer cannot tell `/admin` exists; the caller passes the 404 element because a feature cannot import a page. Admin sign-in lives in `features/auth` (not `features/admin`) because the session initializer restores both kinds of session.

**Suspend and resume.** On `/admin/developers/:developerId` an admin can suspend or resume the developer (`PUT /api/v1/admin/developers/{id}/status`) and each game (`PUT /api/v1/admin/games/{id}/status`). A `StatusSwitch` button opens a dialog first: suspending needs a reason (non-payment, abuse, other) and takes an optional internal note, resuming only asks to confirm. The mutations wait for the server (no optimistic update), then refresh every admin query and show a toast; a failed request keeps the dialog open with the error and changes nothing. Toasts come from `shared/notifications` (`showToast`) and are drawn by `<Toaster />` in `App`.

**Suspended developers.** While an admin has suspended a developer, the dashboard is read-only (`GET` and revoking an API key still work). `developer.status` and `statusReason` come from `GET /api/v1/developers/me` and are kept in the auth store. `SuspensionBanner` (rendered by `AppLayout`'s `banner` slot, so on every dashboard page) says what happened by reason code and who to contact; the admin's internal note never reaches the developer. Register game, Create API key, Publish, Roll back and the widget draft are turned off with the same explanation (`useAccountAccess().readOnlyMessage`, passed down by the page hooks; `ReadOnlyScope` switches a whole panel off). A suspension that happens while the dashboard is open is picked up centrally: the HTTP client reports any 403 `account_suspended` to the session bridge, which marks the developer suspended and refetches `/developers/me` once for the reason. "Check again" in the banner refetches it so a resumed account unlocks without a reload.

## Games and API keys

Server state (games, API keys) lives in TanStack Query; the query client (`src/shared/api/queryClient.js`) retries queries once and never retries mutations, and its cache is emptied when the session ends. The wording is "Register existing game": the backend only records an integration for a game the developer already has.

A new API key's full value comes back from `POST /api/v1/games/{gameId}/api-keys` exactly once. It is kept in page state (never the query cache), shown with a warning and a copy button, and gone once dismissed or the page is left; the list only ever shows the key prefix. Revoking asks for confirmation in a Radix alert dialog.

## Widget editor

`/games/:gameId/widget` edits the game's draft widget config: the document defined in `docs/config-v1/` (schema, limits, versioning rules). The page follows the SocialKit Studio design (light theme) as three columns: a **settings** panel on the left (tabs Layout, Clan, Chat, Texts), the **preview** and the **Experience config** (the whole draft as read-only JSON in a `{ "config": … }` envelope, the shape the platform API sends and receives, so Copy JSON can be pasted into a request; its size, counted for the config only, is shown against the 64 KB limit; toggled by Show/Hide config) in the middle, and a **Style** panel on the right (tabs General, Panel, Messages, Buttons, Tabs, Lists). Below 1100px the columns wrap: settings and style side by side from 768px, one column on a phone. The preview draws the draft with the shared renderer (`@clan/ui`).

- **Draft:** `GET` and `PUT /api/v1/games/{gameId}/widget/draft` (`openapi/platform.yaml`). `GET` answers `{ config, updatedAt }`, `PUT` takes `{ config }`. A game with no saved draft gets `{ "schemaVersion": 1 }` from the server, so the editor completes whatever is missing from `DEFAULT_WIDGET_CONFIG` (saved values always win, unknown keys are kept). The form edits a local copy; the server copy is only the starting point.
- **Publish:** the **Publish vN** button in the bar saves the draft first (even one nobody edited, and any edit still waiting for its timer), then calls `POST .../widget/publish`, because the server publishes the draft it holds, not what the browser shows. If the draft cannot be saved nothing is published and the reason is shown. A success shows "Published version N"; a failure says nothing was published and why (`invalid_widget_config` with the server message and any `details`, `widget_draft_missing`, network). The chip next to the save state reads Not published yet, Published · vN, or Draft · unpublished changes (the draft is compared with the live version's config, ignoring key order).
- **Version history:** a card (Show/Hide history) lists the published versions newest first with their date; the newest is Live. **Preview** loads that version (`GET .../versions/{n}`) and shows its config read-only in place of the draft config, with Back to draft. **Roll back** opens a confirmation, then calls `POST .../versions/{n}/rollback`: the old config is published again as a new version on top, which then shows as the newest. Nothing is deleted and the draft is not changed. There is no Roll back for the live version.
- **Autosave:** 3 seconds after the last edit. The header shows Saved, Saving…, Unsaved changes or Could not save (with Retry). Leaving the page saves a waiting edit at once, and closing the tab with unsaved work asks first.
- **Validation errors:** the server currently checks only that the config is a JSON object up to 64 KB, and answers `400 invalid_widget_config` with a message, which the editor shows at the top. The editor is ready for per-field errors (W3): `error.details` = `[{ path, rule, message? }]` with `path` a JSON Pointer such as `/clan/maxMembers` (`""` for the whole document) will appear next to each field, with a problem count on the section tab, and a path no field shows is listed at the top. That `details` shape is an agreement with the backend, not yet in `platform.yaml`. A rejected draft is not resent until the next edit. Each error is routed to the tab that holds its field (`config/widgetSections.js`), so a problem on a tab you are not looking at still shows as a count on that tab and in the config panel.
- **Live preview:** `PreviewPanel` mounts `@clan/ui` (`render(container, config, data)`, the code the SDK runs) over a made-up game, with mock data and no network, and calls `update` on every edit. The widget sits on a plain solid surface. "Viewing as" sits at the right end of the title row. Under the title, three chips in the order of the widget's tab bar pick what it shows: Friends, Clan and Chat. The Clan chip names the clan screen on show and opens a list of the four clan screens (Home & chat and Members for a clan member, Discover and Create for a player without a clan). The widget's own buttons and tabs (Join, Create, Leave, View members, Accept, Chat, the tab bar) move the chips too. Accepting a request and sending a message work inside the preview, with nothing sent anywhere. Sending also starts the draft's slow mode the way a player sees it in a game: Send is off for `chat.slowModeSeconds`, and from 4 seconds up it counts the wait down (`utils/previewSlowMode.js`). The panel is always open here and sits where `layout.position` says. The Google Fonts the draft uses are added to the page head, because a Shadow DOM cannot load fonts itself.
- **Style panel:** the right-hand panel is organized by part of the widget. **General** holds what restyles everything at once: dark or light, the five colors, the corner style, the fonts, and the library of imported textures. Then one tab per part, each with everything about it in one place: **Panel** (frame or bezel, opacity and blur, and the textures of the frame and the content area), **Messages** (bubbles or log, your bubbles and other players' bubbles, the bubble texture), **Buttons** (filled, outline or bevel, uppercase, the main and the outline buttons, the button texture), **Tabs** (the tab bar and the selected tab) and **Lists** (rows and cards: clans, members, requests, the clan header). Opening a tab takes the preview to a screen where its parts can be seen (Lists opens Members).
- **Parts:** the tabs above restyle single parts of the widget: your chat bubbles and other players', the main and outline buttons, the tab bar and the selected tab, and rows and cards. Each part is switched on to customize it, starting from what the theme gives it today (so nothing changes by itself), and then has its own background and text color (with a contrast check), border style, width and color, and corner radius. Switching a part off goes back to following the theme, and the last one off removes `theme.components` from the draft. Because a tab can hold parts seen on different screens (Buttons: Send on Home, Chat buttons on Friends), switching a part on takes the preview to its screen, and a Show in preview button in the part brings it back (`docs/config-v1/README.md`, "Component styles").
- **Finding other clans while in a clan:** a member of a clan sees a small search icon on the right edge of the Clan tab (the tab and the icon read as one control; it needs the discover screen on, and it works from any tab). It opens the same clan search players without a clan use, read-only: Join is off with the hint "Leave your clan to join another.", their own clan says Joined, there is no create button, and Back (or pressing the icon again) returns to Home. In the preview the player stays in the clan while looking (the Discover chip is the "no clan" view, where Join works), and none of the view chips is highlighted.
- **Clan roles:** the Clan tab has a Roles list. The developer defines the titles a member can hold (Member, Elder, Co-leader, Leader, up to 12), strongest on top, and orders them **by dragging** (Move up and Move down buttons do the same for keyboards and touch screens). The lowest role (what a new member gets) and the owner role (the clan's creator) stay at the ends. **Clicking a role** opens its title and two switches: can kick the roles below it, and can promote and demote them; each row shows what the role may do. Roles are added by title just below the owner role and removed from the edit panel. A role's id is made from its title when it is added and never changes when renamed. In the preview, **Viewing as** picks which role is looking: on Members, clicking someone the role may manage shows Promote, Demote and Kick (a role can only act on lower roles and promote up to just below itself); changes and kicks work inside the preview and nothing is sent. Server-side the social service knows only owner and member today, so it must learn custom roles, promote and kick (`docs/config-v1/README.md`, "Clan roles").
- **Custom badges and textures:** the developer can import their own images: badges (PNG, WebP or SVG, up to 64 KB) in the Clan tab, textures (tileable PNG or WebP, up to 256 KB) from any texture picker (Panel, Messages, Buttons), which applies the new image to that slot; the imported textures are listed, removed and mapped in General. The file is checked by its content, not its name or type (SVGs with scripts are refused), then kept **in this browser only** (`localStorage`, per game) so the preview can draw it. The draft and the platform get just a name made from the file name (`Dragon Badge.png` -> `custom-dragon-badge`) in `clan.badges.allowed` or `theme.textures.<slot>.asset`; the image is never saved with the config. Studio shows the SDK `assets` option with the names in use and a Copy button, and the game developer points each name at a file of their own. A name whose image is not in this browser (another machine) still appears, marked "Not imported in this browser". Remove deletes the image and takes the name out of the config. Up to 12 badges can be on.
- **Badge set highlight:** "on" is the tint and the On label; the bright outline marks the one badge you last touched, so only one carries it.
- **Options stay in step with the contract:** the fonts, choices, label keys and limits offered by the form are checked against `config.v1.schema.json` by `widgetOptions.test.js`.

