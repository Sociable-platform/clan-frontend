# Experience config v1

Status: **Proposed** (TEAM-110). Not final until the sign-off below is ticked.

One document describes how a game's social panel looks and behaves. Studio produces it, the platform stores it (draft and immutable published versions), the SDK validates and renders it. It is **data only**: no HTML, JS, CSS or URLs.

| File | Purpose |
|---|---|
| `config.v1.schema.json` | The contract (JSON Schema draft 2020-12) |
| `examples/valid/*.json` | Two valid documents (`arena`: everything on; `farm-minimal`: light, clan off) |
| `examples/invalid/*.json` | Three invalid documents, one rule each |
| `examples/manifest.json` | Shared fixtures: every file with the expected result and errors |
| `configSchema.test.js` | Runs the schema against the fixtures and each limit's bounds |

## Decision

1. There is **one** format. It replaces the chat `schemaVersion 1` config and the `clan-complete-ui` fixture. Neither is read any more once the SDK moves to this schema.
2. The shape is the object SocialKit Studio's editor emits (design file, "Show config"), made strict:

```
schemaVersion  1
game_id        platform Game.id (UUID)
theme          mode, fonts{heading,body}, frame, buttons, panel, colors, textures
layout         position, startCollapsed
friends        enabled
clan           enabled, maxMembers, tags, descriptionMax, badges, screens{discover,create,home,members}
chat           enabled, layout, directMessages, clanChat, maxMessageLength, slowModeSeconds, profanityFilter, historyLimit
texts          terms{clan,clans}, labels{...}
```

3. Every section is **required** and every field inside it is required, except `theme.textures.<slot>` and `texts.labels.<key>` (absent = no texture / SDK default text). Studio always writes the full document, so there are no implicit defaults to disagree about.
4. Identity is `game_id`. The legacy `project` / `public_key` fields are not part of the contract and are rejected.
5. Key style is the one Studio already emits: camelCase, except `game_id`, which the ticket fixes.

## Limits

| Limit | Value | Enforced by |
|---|---|---|
| Document size | **64 KB** (65 536 bytes of UTF-8 JSON) | Validator, **before** parsing. JSON Schema cannot express it |
| Sections | Fixed: 3 tabs (`friends`, `clan`, `chat`) and 4 clan screens (`discover`, `create`, `home`, `members`). At least one tab must be enabled | Schema (`additionalProperties`, `anyOf`) |
| Colors | `#RRGGBB`, uppercase. 5 theme colors + frame color | Schema (`pattern`) |
| Fonts | 43 families from the Studio picker, `source: "google"` only | Schema (`enum`) |
| Icons | Badges: `star diamond peak spark moon cross`, unique, max 6. Textures: `tex_stone tex_grid tex_wood tex_carbon`. All are ids built into the SDK, never URLs | Schema (`enum`, `uniqueItems`) |
| Text | Labels 1-40 chars, terms 1-20 chars; no `<`, `>`, `http(s):`, `www.`, `//`. Placeholders `{Clan} {clan} {Clans} {clans}` allowed. 22 label keys, listed in the schema | Schema (`pattern`, `not`) |
| `clan.maxMembers` | 2-200 | Schema |
| `clan.descriptionMax` | 20-300 | Schema |
| `chat.maxMessageLength` | 20-1000 | Schema |
| `chat.slowModeSeconds` | 0-30 | Schema |
| `chat.historyLimit` | 1-50 | Schema |
| `theme.frame.width` | 1-8 | Schema |
| `theme.panel.opacity` | 0.5-1 | Schema |

Text patterns avoid lookahead on purpose so the Go validator (RE2) and the JS validator accept exactly the same strings.

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

A failure is reported as a list of `{ path, rule }`, where `path` is a JSON Pointer (`/clan/maxMembers`, `""` for the root) and `rule` is the JSON Schema keyword (`required`, `additionalProperties`, `pattern`, `enum`, `minimum`, `maximum`, `const`, `anyOf`, `uniqueItems`). Studio maps `path` to a form field.

`examples/manifest.json` is the shared test data. **`validateExperienceConfig` in clan-sdk must be run over every row and agree on valid/invalid and on each listed `(path, rule)` pair.** Copy `config.v1.schema.json` and `examples/` into clan-sdk unchanged so both repos test the same files.

## Differences from what exists today

- Studio's mock uses `game_id: "game_arena_7f3a"`. The platform's `Game.id` is a UUID (`openapi/platform.yaml`), so the schema requires a UUID. Studio's mock should switch to a real id.
- `complete system architecture.md` (Customization config) shows a third shape (`schema_version`, `theme.primary_color`, `features.*`, `texts.friends_tab`). This contract supersedes it; that section needs updating.
- Proposed limits that the design does not state and need confirming: `theme.panel.opacity` 0.5-1, `clan.descriptionMax` 20-300, `chat.maxMessageLength` minimum 20 (design) vs 1 (architecture doc).

## Sign-off

- [ ] Murad Hasanli
- [ ] Farida
- [ ] Copied into clan-sdk docs, and `validateExperienceConfig` passes the shared fixtures
