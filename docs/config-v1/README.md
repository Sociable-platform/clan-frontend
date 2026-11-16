# Experience config v1

Status: **Proposed** (TEAM-110). Not final until the sign-off below is ticked. Amended 2026-11-08 (TEAM-118): custom badge and texture names, see "Custom images", clan roles, see "Clan roles", and per-part styles, see "Component styles". While the status is Proposed such amendments do not bump `schemaVersion`.

One document describes how a game's social panel looks and behaves. Studio produces it, the platform stores it (draft and immutable published versions), the SDK validates and renders it. It is **data only**: no HTML, JS, CSS or URLs.

| File | Purpose |
|---|---|
| `config.v1.schema.json` | The contract (JSON Schema draft 2020-12) |
| `examples/valid/*.json` | Four valid documents (`arena`: everything on; `farm-minimal`: light, clan off; `custom-assets`: game-supplied badges and textures; `styled-parts`: every part restyled) |
| `examples/invalid/*.json` | Six invalid documents, one rule each (the last three have bad custom asset names, bad clan roles and bad part styles) |
| `examples/manifest.json` | Shared fixtures: every file with the expected result and errors |
| `configSchema.test.js` | Runs the schema against the fixtures and each limit's bounds |

## Decision

1. There is **one** format. It replaces the chat `schemaVersion 1` config and the `clan-complete-ui` fixture. Neither is read any more once the SDK moves to this schema.
2. The shape is the object SocialKit Studio's editor emits (design file, "Show config"), made strict:

```
schemaVersion  1
game_id        platform Game.id (UUID)
theme          mode, fonts{heading,body}, frame, buttons, panel, colors, textures, components (optional)
layout         position, startCollapsed (ignored since TEAM-243, see "Launcher" below)
friends        enabled
clan           enabled, maxMembers, descriptionMax, roles[], badges, screens{discover,create,home,members}
chat           enabled, layout, directMessages, clanChat, maxMessageLength, slowModeSeconds, profanityFilter, historyLimit
texts          terms{clan,clans}, labels{...}
```

3. Every section is **required** and every field inside it is required, except the optional parts: `theme.textures.<slot>`, `texts.labels.<key>` and the whole `theme.components` section with each part and field in it (absent = no texture / SDK default text / the look the theme gives). Studio writes the full document and adds an optional part only when the developer uses it, so there are no implicit defaults to disagree about.
4. Identity is `game_id`. The legacy `project` / `public_key` fields are not part of the contract and are rejected.
5. Key style is the one Studio already emits: camelCase, except `game_id`, which the ticket fixes.

## Limits

| Limit | Value | Enforced by |
|---|---|---|
| Document size | **64 KB** (65 536 bytes of UTF-8 JSON) | Validator, **before** parsing. JSON Schema cannot express it |
| Sections | Fixed: 3 tabs (`friends`, `clan`, `chat`) and 4 clan screens (`discover`, `create`, `home`, `members`). At least one tab must be enabled | Schema (`additionalProperties`, `anyOf`) |
| Colors | `#RRGGBB`, uppercase. 5 theme colors + frame color | Schema (`pattern`) |
| Fonts | 43 families from the Studio picker, `source: "google"` only | Schema (`enum`) |
| Icons | Badges: `star diamond peak spark moon cross` or a custom name, unique, max 12. Textures: `tex_stone tex_grid tex_wood tex_carbon` or a custom name. Built-in ids are built into the SDK; custom names are `custom-` + lowercase letters, digits and single dashes, max 32 characters. Never URLs | Schema (`anyOf` of `enum` and `pattern`, `uniqueItems`, `maxItems`) |
| Text | Labels 1-40 chars, terms 1-20 chars; no `<`, `>`, `http(s):`, `www.`, `//`. Placeholders `{Clan} {clan} {Clans} {clans}` allowed, and `{player}` (the player's name) in `memberJoined`, `memberLeft`, `memberKicked` and `memberKickedBy`, and `{by}` (the name of the player who removed them) in `memberKickedBy`. 26 label keys, listed in the schema | Schema (`pattern`, `not`) |
| `clan.maxMembers` | 2-200 | Schema |
| `clan.roles` | 2-12 roles. Id: lowercase letters, digits and single dashes, starts with a letter, max 24. Title: 1-20 characters, same text rules as labels. Ids must be unique | Schema (`minItems`, `maxItems`, `pattern`); uniqueness by the validator |
| `clan.descriptionMax` | 20-300 | Schema |
| `chat.maxMessageLength` | 20-1000 | Schema |
| `chat.slowModeSeconds` | 0-30 | Schema |
| `chat.historyLimit` | 1-50 | Schema |
| `theme.frame.width` | 1-8 | Schema |
| `theme.panel.opacity` | 0.5-1 | Schema |
| `theme.components.<part>.radius` | 0-24 | Schema |
| `theme.components.<part>.borderWidth` | 1-8 | Schema |

Text patterns avoid lookahead on purpose so the Go validator (RE2) and the JS validator accept exactly the same strings.

**Built-in texts.** Some texts of the widget are not config keys, so a game cannot override them: the search icon's name "Find clans", the hint "Leave your clan to join another.", the leave warning, the "{clan} chat" title, and short UI words such as "Promote", "Demote" and "Kick". They follow the game's own word for a clan (`texts.terms`). Making one editable means adding its key to `texts.labels` (a contract change).

## Launcher

The widget has no launcher button (TEAM-243): it draws the panel, always open, and the game opens and closes it with its own button. Two fields that belonged to the launcher stay in the schema so that configs already saved or published remain valid, and they do nothing: `layout.startCollapsed` (still **required**, any boolean) and `texts.labels.launcher`. Studio no longer offers either. Removing them from the schema is a later, breaking change: the schema, the copy in clan-backend and the copy in clan-sdk change together, and stored configs are cleaned up first.

## Clan tags

Clans have no tags. The widget draws none (not in the clan header, the clan list or the log chat), the Create form has no Tag field, and Studio offers no "Clan tags" switch. `clan.tags` is no longer part of config v1 (TEAM-276): a config that sends it is refused like any unknown field (`/clan`, `additionalProperties`; example `invalid/legacy-clan-tags.json`).

It went in two steps, so no saved config broke on the way: Platform first made it optional, then removed it together with a migration that took it out of every stored draft and published version. Studio no longer writes it and drops it from a draft it loads (`withDefaults`), so a draft saved before the migration is never sent back with it. This Studio change must be deployed before Platform's removal. clan-sdk never read it and has no copy of the schema.

## Custom images

A game can use its own badge icons and textures. The config never carries an image, a URL or a path, only a **name**:

- Studio lets the developer import a PNG or WebP (badges may also be SVG) so the preview shows it. The file stays in that browser; it is not saved with the draft and not sent to the platform. Studio names it from the file name: `Dragon.png` becomes `custom-dragon`, and that name goes into `clan.badges.allowed` or `theme.textures.<slot>.asset`.
- In the game, the developer points each name at a real file in their own project, in the SDK options (`SocialKit.init({ ..., assets: { badges: { 'custom-dragon': '/img/dragon.png' }, textures: { 'custom-metal': '/img/metal.png' } } })`; Studio shows this snippet with the names the config uses).
- A name the game has not mapped shows a neutral tile (badge) or no texture. Nothing is fetched from the config, so a config still cannot load anything from an outside site; the URL comes from the game's own code.
- Custom textures are drawn under a translucent layer of the surface color, so text over them stays readable ("subtle" is enforced by the renderer).

The platform does not need an upload endpoint for this.

## Where the clan screens show

`discover` and `create` are for a player without a clan. A member of a clan sees `home` and `members`, and can open `discover` from a small search icon on the Clan tab to search other clans: they can read and search, but cannot join (Join is off with a hint) and cannot create while in a clan. `clan.screens.discover.enabled` switches both ways in; with it off, members get no search icon. The platform still enforces one clan per player.

## Component styles

`theme.components` is an optional section that restyles single parts of the widget on top of the global theme. A part with no entry, and a field a part leaves out, keep the look the rest of the theme gives them, so a config that never uses it renders exactly as before.

| Part | What it styles |
|---|---|
| `bubbleMine`, `bubbleTheirs` | chat bubbles: the player's own and other players' (the bubbles layout only) |
| `button` | the main buttons (Join, Send, Create); wins over `theme.buttons` where it sets a value |
| `buttonSecondary` | outlined and dashed buttons (Cancel, View members, Leave, Chat, Create a clan) |
| `tab`, `tabSelected` | the tab bar's tabs, and the open one |
| `row` | list rows and cards: clans, members, requests, the clan header |

Each part takes any of: `background` and `text` (`#RRGGBB`, uppercase), `borderStyle` (`none solid double bevel inset`), `borderWidth` (1-8), `borderColor` (`#RRGGBB`), `radius` (0-24, whole pixels). A border is drawn as soon as one of its three fields is set; the others default to a solid 1px line in the theme's border color. Setting `radius` also turns off the chamfered corners for that part. The SDK ignores a value that fails these rules and keeps the theme's look. The setting is data only: colors, a short list of border styles and small integers, never CSS text.

Studio's Style tabs (Messages, Buttons, Tabs, Lists) start a part from what the theme gives it today, so switching a part on changes nothing visible until a value is edited, and switching it off removes the entry.

## Clan roles

`clan.roles` is the list of titles a clan member can hold, **lowest power first**. A game can have as many as it wants, from 2 to 12 (Member, Elder, Co-leader, Leader...). Each role is `{ id, name, canPromote, canKick }`: `id` is the stable machine name the platform stores for a player (it does not change when the title is renamed), `name` is what players see.

- The first role is what a new member gets. The last is the clan owner's: exactly one holder, the player who created the clan. It is never handed out by promoting, and it always has both powers whatever its flags say.
- **Power is position.** A member can promote, demote or kick only someone whose role is **lower** than their own, never an equal or a higher one, and never themselves.
- **Promote** moves the target one step up, but only to a role **below** the actor's own, so a Co-leader can promote an Elder to the role just under Co-leader but never to Co-leader itself. **Demote** moves one step down. Both need `canPromote`; kicking needs `canKick`.
- A role's powers apply only to people below it, so giving the lowest role `canKick` has no effect.
- The platform enforces all of this too: the SDK only offers the actions, the server decides. Today the social service knows only `owner` and `member`; it has to learn custom role ids and the promote and kick calls before this works for real players. Until then the SDK reads `owner` as the last role and `member` as the first.

## The config on the wire

The schema describes the **bare config**. The platform API wraps it in a `config` envelope: `PUT /games/{id}/widget/draft` takes `{ "config": { ... } }`, `GET` returns `{ "config": { ... }, "updatedAt": "..." }`, and a published version comes back as `{ "version", "config", "publishedAt", "publishedBy" }`. Studio's Experience config panel and Copy JSON show the same `{ "config": ... }` envelope, so what is copied can be pasted into a request. The SDK reads the published config from the public endpoint `GET /api/v1/public/games/{gameID}/widget-config`, which answers `{ "version", "config" }`. Validators check the inner config, and the 64 KB limit counts the config, not the envelope, and as the platform counts it: the config JSON as sent, compact, without indentation (Studio's size label does the same; the pretty text in its panel is longer). The platform today only checks that the config is a JSON object of at most 64 KB; it stores any such object and does not run this schema yet (field-by-field checks are planned as W3). The files in `examples/` are bare configs.

## Unknown fields

`additionalProperties: false` at every object level. A field the schema does not list is an error, never ignored. This also means a newer config **cannot** be silently half-understood by an older SDK.

## Versioning

`schemaVersion` is a single integer, currently `1`.

- **Any change to what validates bumps it**: add, remove or rename a field, change a type, tighten or widen a limit, add or remove an enum value. Because unknown fields are rejected, even "just an optional field" breaks older validators, so there is no minor/patch tier.
- **No bump** for edits that do not change what validates: descriptions, titles, new examples, new tests.
- A bump ships together with: the new `config.vN.schema.json` (the old file stays), a pure migration `vN-1 -> vN`, updated fixtures for both versions, and an entry in this README.
- The platform stores each config with its own `schemaVersion` and never rewrites published versions. The SDK supports the current and the previous version, migrating the older one in memory. Anything else is a hard validation error and the SDK keeps its last good config.
- Studio only ever writes the current version.

## Validation contract

Order: size check, then JSON parse, then schema. The Go service (on `PUT draft`), Studio (before Save/Publish) and the SDK (`validateExperienceConfig`, on load and on `config.updated`) run the same rules.

A failure is reported as a list of `{ path, rule }`, where `path` is a JSON Pointer (`/clan/maxMembers`, `""` for the root) and `rule` is the JSON Schema keyword (`required`, `additionalProperties`, `pattern`, `enum`, `minimum`, `maximum`, `minItems`, `maxItems`, `maxLength`, `type`, `const`, `anyOf`, `uniqueItems`, `not`). Studio maps `path` to a form field.

`examples/manifest.json` is the shared test data. **`validateExperienceConfig` in clan-sdk must be run over every row and agree on valid/invalid and on each listed `(path, rule)` pair.** Copy `config.v1.schema.json` and `examples/` into clan-sdk unchanged so both repos test the same files.

## Differences from what exists today

- Studio's mock uses `game_id: "game_arena_7f3a"`. The platform's `Game.id` is a UUID (`openapi/platform.yaml`), so the schema requires a UUID. Studio's mock should switch to a real id.
- `complete system architecture.md` (Customization config) shows a third shape (`schema_version`, `theme.primary_color`, `features.*`, `texts.friends_tab`). This contract supersedes it; that section needs updating.
- Studio's design draws an invite-link button on the Friends tab and its config has `friends.inviteLink`. This contract has only `friends.enabled`, so there is no invite-link setting and Studio does not show the button.
- `chat.profanityFilter` is only an on/off switch: the word list, languages and matching rules are decided by the platform, not by this config.
- Proposed limits that the design does not state and need confirming: `theme.panel.opacity` 0.5-1, `clan.descriptionMax` 20-300, `chat.maxMessageLength` minimum 20 (design) vs 1 (architecture doc).

## Sign-off

- [ ] Murad Hasanli
- [ ] Farida
- [ ] Copied into clan-sdk docs, and `validateExperienceConfig` passes the shared fixtures
