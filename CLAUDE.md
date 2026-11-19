# clan-frontend

Developer dashboard for the clan platform (React, Vite). The backend lives in `../clan-backend` (Go; contracts in its `openapi/*.yaml`, Platform API on :8081, CORS origin `http://localhost:5173`). This repo is currently empty apart from `.git`.

System design: `/home/muradhasanli/Documents/capstone/complete system architecture.md` ("Developer dashboard" section). Pages: Sign up / Log in, Projects (secret key shown once, copy button), Editor (form on the left, live preview of the SDK panel on the right, Save draft, Publish), Versions, Integration (public key, rotate secret, allowed origins, copy-paste snippet). The 2-week build ships Log in, Projects, Editor and Integration. **Note (2026-11-08, TEAM-101):** the Platform API in `../clan-backend/openapi/platform.yaml` models Projects as *games* ("Register existing game", never "Create game") with *API keys* (created, shown once, listed by prefix, revoked); there is no `secret_key` or `public_key` on the games endpoints yet. The design doc still says projects and secret key; the OpenAPI file is the contract the dashboard follows. Editor details: form edits a local copy, preview updates on every change with no server call, server validation errors map to field paths.

The conventions below come from the team's frontend convention docs (`/home/muradhasanli/Documents/capstone/conventions/01-04, 06, 07`). Those docs were written for a TypeScript app and use restaurant examples (booking, menu, reservations); the examples are dropped here, the rules are kept. The design doc says "React + JS", but the rules below assume TypeScript strict mode. **Confirm TS vs JS before scaffolding.** `05-features.md` is a restaurant-specific feature catalogue and is intentionally not copied.

Tech: React, Vite, React Router, TanStack Query, Zustand (auth only), Tailwind CSS v4 + shadcn/ui (Radix), Zod, Vitest + React Testing Library + MSW, Playwright, ESLint (flat config) + Prettier (Tailwind class sorting), pnpm.

## Architecture

Presentation-Domain-Data layering with feature-based vertical slices (FSD-inspired, simplified).

| Layer | Responsibility | Where |
|---|---|---|
| Presentation | UI and view logic | `pages/`, `features/*/ui/`, `features/*/hooks/` |
| Business logic | domain entities, rules, state | `entities/`, `features/*/model/`, `store/` |
| Data access | API calls, HTTP client, mapping | `features/*/api/`, `shared/api/` |

Call chain is one direction only: **UI -> hooks -> api**. Components never call the API layer directly; hooks never contain JSX.

Top-level folders: `app` (providers, router, styles, entry), `assets`, `entities` (cross-feature domain models), `features` (vertical slices), `pages` (one per route), `shared` (business-agnostic api/ui/hooks/utils/config), `store` (global state), `test` (shared test infra), plus `e2e/` for Playwright.

Every feature has the same shape, no exceptions: `ui/` (presentational), `hooks/` (query/mutation/form-state), `api/` (HTTP calls + mappers), `utils/`, `model/` (types + Zod schemas), `config/` (constants, query keys), and a public `index.ts`.

**Dependency rules**
- Pages may import features, entities, shared.
- Features may import entities and shared only, **never another feature**.
- Entities may import shared only. Shared has no upward imports.
- Always import through a module's public `index.ts`. Every component and hook folder has its own local `index.ts` (`features/auth/ui/LoginForm/index.ts` re-exporting `./LoginForm`), consumed via the folder path (`@/features/auth/ui/LoginForm`). No aggregated `ui/index.ts` or `hooks/index.ts` barrels.

**Bootstrap order:** error boundary -> global providers (TanStack Query, toast notifier, Query Devtools in dev only) -> one-time session initializer -> router. The session initializer registers HTTP interceptors, then restores the session against the backend; route guards wait for it to finish (no flash redirect). No provider for the auth store (Zustand is used via its hook).

**Routing:** every page lazy-loaded with a shared suspense helper. Route tree: public shell, guest-only shell (login/register), authenticated shell, catch-all 404 (also the router error fallback). One guard component per concern (auth required, guest only, role restricted), each rendering the route's outlet when allowed. Role guard supports a "stealth" mode that shows 404 instead of redirecting.

## State and API

- Server state = TanStack Query. Client/global state = Zustand, **auth session only**. Never mirror backend data into Zustand.
- One shared HTTP client for the whole app; no feature creates its own. Endpoint paths are centralized by domain, not hardcoded at call sites.
- Cross-cutting errors (auth expiry, forbidden, server error, network/timeout) are handled once in the HTTP client's response handling. Endpoint-specific error meaning is handled per feature. Hooks use TanStack's error state for UI-level error rendering.
- Every API module pairs with a mapper module: pure functions turning raw backend responses into UI shapes. Raw response shapes never reach components or hooks.
- Query key factories live in each feature's `config/`, rooted at a shared `all` key so a whole feature can be invalidated at once.
- Query hooks: call the feature's API module, map the response, return only what the UI needs (never the raw envelope). Mutation hooks: call API module, show success notification, invalidate the affected key, return only an action plus `isPending`/`isError`.
- Retry: queries retry once, **mutations never auto-retry**. Set globally on the query client; override per call only with a comment explaining why.
- Pagination: unwrap the backend page envelope into a flatter shape; MSW handlers reproduce the real shape.
- Auth: the backend would ideally issue an `httpOnly` cookie session (the Platform API uses a cookie for developers per the design doc, but currently also returns `{ token, expiresIn }` from `POST /api/v1/developers/login`; check the OpenAPI file and agree the approach with the backend before building). Sign-out always clears local state in a `finally` block. Failed login attempts are ordinary form errors and exempt from the 401-refresh flow.

## Code style

**Naming.** Components PascalCase (`RegistrationForm.tsx`); hooks camelCase with `use` prefix; utilities camelCase; types/schemas `auth.types.ts` / `auth.schema.ts`; tests `<name>.test.ts(x)` colocated next to source (no `__tests__`). Variables camelCase; functions camelCase with verb prefix; constants `UPPER_SNAKE_CASE`; booleans `is/has/can`; handlers `handle*`. Props interface `ComponentNameProps`; Zod schemas camelCase + `Schema`; inferred types `type XFormValues`. Constant groups (categories, error codes, messages) are grouped objects, not scattered literals.

**Exports and imports.** Named exports only, no default exports from features. Import order: external -> internal path aliases -> relative -> type-only, alphabetized within group, blank line between groups (lint-enforced).

**Components.** Order: props -> hooks -> derived values -> handlers -> JSX (no logic in JSX). No API calls or business logic in components; extract a hook once a component has more than a couple of pieces of local state. Explicit props interfaces, never inline type objects. Shared UI components hold no business logic. Split components that do too much.

**Hooks.** Queries `use{Domain}Query`, mutations `use{Domain}Mutation`, forms `useFormName`; the suffix is required. Reads and writes never mix in one hook. Return primitives, never the raw query/mutation object. Hooks call the feature's API module, never the HTTP client directly. Never call hooks conditionally. Hooks live in a feature's `hooks/` or in shared hooks.

**TypeScript.** Strict mode. Never `any` (use `unknown`/specific type/generic; relaxed in tests only). Never `as SomeType` to silence an error (test builders excepted). Annotate return types on exported functions.

**Lint/format.** ESLint flat config + Prettier; zero warnings (a warning fails CI). The lint config is the source of truth. TODOs state why the code is temporary and what unblocks it.

## Design patterns

- **Container/presentational:** each page has a page-composing hook (`useXPage`) owning data, derived state and handlers; the page and feature UI are props-in/JSX-out.
- **Hooks everywhere for logic:** data hooks, page-composing hooks, cross-cutting behavior hooks (unsaved-changes guard etc.).
- **Compound components** only where parts genuinely share implicit state (e.g. tab list + panel), not for simple parent/child composition.
- **Error handling:** one global error boundary at the root as a last resort; expected failures get explicit page-level error states rendered from query error status, not thrown.
- **Loading:** skeletons shaped like the real content, one per list/card view; no generic spinners, no reusing an unrelated skeleton.
- **Lazy loading:** every page code-split; heavy UI reachable immediately is lazy, UI that only appears after data loads is not.
- **Accessibility:** real interactive elements and ARIA roles over clickable `div`s; visually-hidden live regions for async states (loading/error/empty/N results); Radix primitives for dialogs/dropdowns; a11y ESLint plugin enabled; everything keyboard-operable.
- **Performance:** query caching (`staleTime`/`gcTime`) instead of manual caching; memoize only for measured problems; images via the project's image tooling; run the bundle analyzer (`pnpm analyze`) when adding heavy dependencies.

## Styling and design tokens

Tailwind v4 + shadcn/ui (Radix). Two token layers: raw brand palette and semantic tokens (background, foreground, card, primary, secondary, muted, accent, destructive, border, input, ring), defined in `app/styles/tokens.css` (source of truth). **Components use semantic tokens only, never raw brand colors.** Dark-mode variant hook wired in even if only light values exist. Typography uses a fixed set of utility classes, not ad hoc text/font utilities.

Responsive, mobile-first with default Tailwind breakpoints (`sm` 640, `md` 768, `lg` 1024, `xl` 1280); `sm:` is the main first step, `md:` only for fine-tuning. Recurring patterns: page containers `p-4 sm:p-6 lg:p-10`; card grids `grid grid-cols-1 gap-n sm:grid-cols-2 lg:grid-cols-3` (+ `xl:grid-cols-4` when dense); toolbar rows `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`; filter forms `grid grid-cols-1 gap-3 min-[480px]:grid-cols-2`; headings `typo-h3 sm:typo-h2`; desktop-only `hidden lg:flex` paired with mobile-only `lg:hidden`. Extend shared components with an optional `className` override point instead of changing the default for every consumer. The sizing and class names above come from the previous project's tokens; re-check them against this project's `index.css` once it exists.

## Testing

| Level | Tool | Covers |
|---|---|---|
| Unit | Vitest | schemas, mappers, utils, store logic, hook logic |
| Component | Vitest + RTL + MSW | UI, forms, API-integrated flows, pages through MSW + real router/store |
| E2E | Playwright | full user journeys, against the built app |

AAA structure. Prefer accessible queries (role, label) over test IDs. Mock child components minimally. Shared infra in `src/test/`: **builders** (`build<Entity>(overrides)` per domain, never ad hoc fixtures), **MSW handlers** (one module per feature, read query params, errors opt-in via query flag, shared by Node and the browser dev worker), **query-result mock helpers** (fully shaped success/pending/error), **composable wrappers** (use the narrowest), **auth test context** (`seedAuthStore`/`renderWithAuth`, no provider to mock). When a test file's setup grows, move it to a colocated `<Name>.test.utils.tsx` with `mockUse<Name>` and `build<Name>State(overrides)`. `vi.mock()` calls stay in the `.test.tsx` file; mock the exact module path the source imports.

## Contributing and CI

- Before starting: `pnpm install` and confirm `pnpm validate` passes clean. Rebase onto the target branch before opening an MR; don't merge it in.
- Commits (Commitlint via Husky `commit-msg`): `type(scope?): subject`, types `feat fix docs style refactor test chore perf ci`. The type drives CHANGELOG and the semantic-release bump, so a `fix:` that is really a `feat:` misversions the release. The convention docs conflict on header length (git doc: <= 72, contributing doc: <= 120); keep <= 72.
- Pre-commit: lint-staged runs `eslint --max-warnings=0` + `prettier --write` on staged `.ts/.tsx`, and `prettier --write` on `.json/.md/.css`. Run `pnpm validate` and `pnpm test:coverage` before pushing.
- PR checklist: validate and coverage pass; new logic tested at the right level; feature folder shape standard; no cross-feature imports; no new `any` or silenced warnings; new env vars in `.env.example` and README; Conventional Commits end to end; UI uses semantic tokens.
- Changes to architecture, public API surfaces, the route tree or the token system update the relevant doc in the same MR.
- Env: `VITE_API_URL` (local/dev backend; per deploy target in CI), `VITE_ENABLE_MSW` (`true` locally, always `false` in CI builds).
- The convention docs describe KubeRocketCI + ArgoCD + semantic-release from the previous project (build via `npm ci`, `npm run build:prod`, `npm run test:coverage`; output dir `build`). This project's design doc says GitHub Actions and Docker Compose with an nginx-served dashboard image, so treat that pipeline section as unconfirmed.

## Git conventions

- **Branches:** `<category>/<JIRA-ID>-<short-description>`; category lowercase (`feat fix hotfix refactor test docs ci chore release`), Jira ID uppercase (this project: `TEAM-nn`), description lowercase hyphenated 2-4 words. `chore`/`release` need no ticket ID.
- **Long-lived:** `main` and `develop`. Never push directly; branch + MR; pull latest `develop` first; one feature/fix per branch; delete after merge.
- **Commits:** Conventional Commits as above, imperative present tense, no trailing period, first line <= 72 chars.
- **MRs:** title in commit format; small and focused; draft for WIP; squash on merge with message = MR title. Description: `## Summary`, `## Changes`, `## Type` (Feature / Bug fix / Refactor / Documentation / CI), `## Notes (optional)`.
- **Review:** share link in group chat -> teammates thumbs up/down -> author resolves discussions -> Team Lead gives the only formal approval -> author merges into `develop`. Prefix feedback `blocking:` / `suggestion:`. Discuss in MR comments.
- Never commit secrets (`.env`, keys, tokens) or broken/unfinished code. Resolve conflicts locally.

## Jira conventions

- BA writes User Stories (no sub-tasks); FE/BE create sub-tasks under the story; QA creates a separate `[QA] <story title> Testing` task and logs bugs as sub-tasks inside it.
- Titles: `[FE]`/`[BE]` + imperative verb + what + context; bugs `[FE]`/`[BE]` + what is broken (problem, not fix); sentence case, <= 80 chars, no trailing punctuation, one deliverable per sub-task.
- Description (mandatory before IN PROGRESS): `## What to deliver` (2-3 sentences) and `## Done when` (testable checkboxes). Bug description: Description, Video/Screenshot, Preconditions, Steps to Reproduce, Actual Result, Expected Result.
- Status: `BLOCKED -> TO DO -> IN PROGRESS -> RESOLVED (ON REVIEW) -> QA REVIEW -> DONE`; BLOCKED from any status returns to it, blocker named in a comment.
- Comment on every status change. In Progress -> Resolved: `MR opened. / MR: <link> / Branch: <name> / What changed: <one sentence>`. Resolved -> QA Review: `MR approved and merged into <target branch>. Ready for QA.` Back to To Do: `Reason / Details / Next step`.

## Brand

Source: Xsolla Brand Guidelines, https://brand.xsolla.com/document/28 (read in Chrome on 2026-11-07; Colors, Typography, Logo, Symbol, Product Screens pages). Follow it for all UI work. Tokens live in `src/app/styles/tokens.css` (raw `--brand-*` palette, then semantic tokens).

**This dashboard is B2B, so it uses Light Mode.** The guidelines split B2B (Light Mode, lighter regular-width type) from B2C (Dark Mode, heavy wide type). Dark Mode tokens exist under `[data-theme='dark']` and are not the default: the dashboard starts in Light Mode and the Light / Dark choice in the account menu (`UserMenu`, `src/shared/theme/`) switches the whole surface, remembering the choice in `localStorage`. In Dark Mode `--card` is `#1b2628` (the Studio design's surface) so cards stand out from the page; text on destructive fills uses `--destructive-foreground`.

**Colors**
| Token | Hex | Role |
|---|---|---|
| S9 Spark Blue | `#80EAFF` | primary brand colour |
| C9 / M9 | `#9580FF` / `#D9FF66` | marketing accents, not for the dashboard |
| L13 / L1 / L5 | `#FFFFFF` / `#000000` / `#5B5D56` | Light Mode background / text primary / text secondary |
| D13 / D3 / D5 | `#141D1F` / `#E8ECED` / `#B7C5C8` | Dark Mode background / text primary / text secondary |

- Use only one of S9/C9/M9 per design, and sparingly.
- Do not use accent colours for headings, do not put accents next to one another, do not mix light and dark palettes.
- S9 on white has very low contrast: use it as a fill (black text on it) or an underline, never as text. The guidelines allow S8/S7 in place of S9 on light backgrounds for logo legibility, but their hex values are not on the pages read; get them from the download package.
- L5 was read from a screenshot (the other hex values were unambiguous); confirm it against the export. Border/input/ring tokens are not brand colours, they are derived from the foreground.

**Typography**
- Lead typeface: Pilat (General Type Studio). B2B headline: Pilat Light (primary, centred, 90% line height, -4% spacing) and Pilat Regular (secondary, 90%, -3%).
- UI typeface for small sizes in digital products: Aktiv Grotesk. Sub-headline Medium (95%, -2%), Title Bold (100%, 0), Body Regular (130%, 0), Technical text Regular (140%, +15%, all caps).
- Headline styles stay Pilat; only small UI text switches to Aktiv Grotesk.
- Scale in multiples of 8 (examples: 96 / 64 / 24 / 20 / 16 / 12 / 8 pt). Check contrast between hierarchy levels; a non-multiple of 8 is acceptable only when unavoidable.
- The font files are licensed and were supplied by the tech lead; they are in `src/shared/assets/fonts` and declared with `@font-face` in `src/app/styles/fonts.css`, used as supplied (not converted or subset). We have Pilat Extended Book only, so it draws every headline weight (the guidelines ask for Pilat Light and Regular), and Aktiv Grotesk Regular, Medium and Bold. System fonts show while a font loads. Do not substitute a Google font that looks similar, and do not add other cuts without a licence.

**Logo and symbol**
- Web and product always use the standalone wordmark, not the symbol + wordmark lockup. The 3D logo is for signage and video closing frames only.
- Logo colours: S9, L1 (black) or D1 (white). On light backgrounds use the Positive (dark) version, on dark the Reverse. Legibility over the background decides.
- Clear space is 50% of the wordmark height on every side. Minimum height is 12px on screen.
- Never alter, recolour, distort, rotate, add effects to, attach graphics to, or tile the symbol.
- The Primary Symbol is for small sizes and third-party platforms. The Outline Symbol marks functional or agentic actions (core CTAs, chatbot) and can sit next to the logo.
- Logo assets are in the guidelines' "Download package"; they are not in the repo yet. Do not redraw them.

**Product screens:** the guidelines point to Figma (Web Shop and XPS screens) as the approved reference for product UI. Get the link from the team and check the Editor/Projects layouts against it.

**Product UI reference (follow this for all dashboard UI):** Xsolla Publisher Account, https://publisher.xsolla.com/938575/dashboard (the user's account, id 938575). It is a B2B light-mode product, so it is the visual model for layout and components. Only the **login page** has been captured so far (read in Chrome on 2026-11-08): the dashboard URL redirects to login when signed out, and credentials are never entered by Claude. To capture the signed-in dashboard (nav, tables, empty states, project cards), the user must log in themselves in the Chrome tab first, then ask Claude to read it. Do this before building Projects, Editor, Versions and Integration, and add what it shows here.

Measured on the login page (CSS values, not brand-palette colours; they are the `--page-background`, `--field`, `--field-border`, `--link`, `--selected`, `--radius-control` tokens in `src/app/styles/tokens.css`):
- Page background `#F7F7F8`. Cards are white with an 8px radius and 32px padding, about 406px wide, centred or beside content.
- Text black; labels 14px at 55% black. Body 15px / 24px line height. The site's own font is Graphik LC Web (licensed), do not copy it; keep the brand font rules above.
- Inputs: 40px high, fill `rgba(0,0,0,0.08)`, no border, 4px radius, 14px text. Label sits above the input.
- Primary button: S9 `#80EAFF` fill, black text, 4px radius, 40px high, 15px regular weight. Disabled state is a grey fill with grey text.
- Segmented control (Log in / Sign up): 40px high, equal halves, 4px outer radius. Active half is filled `#233134` with white text; inactive is `rgba(0,0,0,0.08)` with a `rgba(0,0,0,0.1)` border. Implemented as `AuthTabs` (real links, so routes stay linkable).
- Text links (Forgot password, support) are blue `#0073F7`, 15px. Body copy and nav links stay black.
- Header: product name ("Publisher account") next to the wordmark, links on the right, no heavy border. A Spark Blue announcement strip sits above it.
- Login card content order: title, segmented control, fields, primary button, link, divider with "or", social sign-in icons, support link. We omit social sign-in and the marketing column for now.

**Auth/session decision (2026-11-08):** a future move to an `httpOnly` cookie session is planned; for now the bearer token is kept in `localStorage` and log out is local only (no backend logout endpoint). Keep token handling inside `src/store/authStorage.js` and the `session` bridge so the switch stays small.

Not captured: Partnership Lockups, Archive Imagery and World Imagery pages (marketing imagery, not needed for the dashboard).
