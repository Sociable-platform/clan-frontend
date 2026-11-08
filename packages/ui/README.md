# @clan/ui

The clan social panel as one config-driven renderer. The SDK mounts it in a game and the Studio preview (`clan-frontend`, `PreviewPanel`) mounts the same code, so what a developer sees in Studio is what players get. Plain JavaScript, no dependencies, no build step: the SDK and Vite both consume `src/` directly.

```js
import { render } from '@clan/ui';

const widget = render(container, config, data); // config: experience config v1, data: see below
widget.update(nextConfig, nextData);           // new draft or new data, same panel
widget.destroy();                              // removes everything it added
```

`container` is any element. It should be positioned (the panel is `position: absolute; inset: 0` inside it and docks itself 16px from the bottom corner named by `layout.position`); the SDK gives it a fixed, full-viewport box. The panel lives in a **Shadow DOM** on a child of the container, so game CSS cannot reach it.

## What it draws

Everything the config's `theme`, `layout`, `friends`, `clan`, `chat` and `texts` sections say, from the SocialKit Studio design:

| Screen | Shown to | Config |
|---|---|---|
| `discover` | a player with no clan: search, clan rows with Join or Full, "Create" button | `clan.screens.discover` |
| `create` | a player with no clan: badge, name, tag (if `clan.tags`), description, Create | `clan.screens.create`, `clan.badges.allowed`, `clan.descriptionMax` |
| `home` | a clan member: compact header, info with stats and Leave (with confirmation), clan chat | `clan.screens.home` (`showStats`), `chat.clanChat`, `chat.layout`, `chat.maxMessageLength`, `chat.slowModeSeconds` |
| `members` | a clan member: roster (strongest role first) with role titles, click a member to promote, demote or kick, Leave | `clan.screens.members`, `clan.roles` |

| friends tab | everyone: search, incoming requests with Accept, the friend list with online state, Chat button when direct messages are on | `friends.enabled`, `chat.directMessages` |
| chat tab | everyone: a chip per conversation (each friend, and the clan if the player is in one), back button when opened from Friends, messages, message box | `chat.enabled`, `chat.directMessages`, `chat.clanChat`, `chat.layout`, `chat.maxMessageLength`, `chat.slowModeSeconds` |

Plus the panel frame (title, tabs, launcher button) and the theme: mode, fonts, frame, corners, buttons, panel opacity and blur, the five colors and the four textures. Placeholders `{Clan}`, `{clan}`, `{Clans}`, `{clans}` in any label resolve to the game's own word (`texts.terms`). A screen the config turns off is skipped, and so is the button that leads to it. Players without a clan only ever get `discover`/`create`, members only `home`/`members`.

The friends tab has no invite-link button: the Studio mockup draws one, but config v1 has no `friends.inviteLink` field, so there is nothing to switch it on.

## `data`

```js
{
  player: { id, name },                                           // id = the member row that is the viewer
  clan: null | { id, name, tag, badge, description, memberCount, level, weeklyXp, ownerName, createdAt },
  clans: [{ id, name, tag, badge, description, memberCount }],   // discover
  members: [{ id, name, role }],                                  // members; role is a `clan.roles[].id` (the old 'owner' and 'member' read as the last and first role)
  messages: [{ id, from, body, mine }],                           // clan chat
  friends: [{ id, name, status, online }],                        // friends tab, direct messages
  requests: [{ id, name }],                                       // incoming friend requests
  threads: { [friendId]: [{ id, from, body, mine }] },            // direct messages
  assets: { badges: { 'custom-dragon': '/img/dragon.png' }, textures: { 'custom-metal': '/img/metal.png' } },  // see "Custom images"
  // optional view control; a value that did not change since the last call is not re-applied
  screen: 'discover' | 'create' | 'home' | 'members',
  tab: 'friends' | 'clan' | 'chat',
  convo: 'clan' | friendId,                                       // open conversation in the chat tab
  open: true,                                                     // default: not layout.startCollapsed
  // optional callbacks, called after the panel has updated its own view
  actions: {
    join(clanId), create({ name, tag, description, badge }), leave(), acceptRequest(requestId),
    setRole(memberId, roleId), kick(memberId),
    sendMessage(text, { conversation }),   // conversation: 'clan' or a friend's id
    screenChanged(screen), tabChanged(tab),
  },
}
```

`clan: null` means "no clan", and decides which screens are reachable. The panel never changes membership on its own: it calls `actions.join/create/leave`, the host does the work (an API call in the SDK, a state flip in the preview) and calls `update` with the new `clan`. `createMockData(config, { inClan })` gives fake data (three clans, a four-member clan, a short clan chat, three friends with a request and a thread each) for previews.

## Roles and managing members

`clan.roles` (lowest power first, see `docs/config-v1/README.md` "Clan roles") gives each member a title. On the members screen the viewer is the member whose id is `data.player.id`. A member the viewer may manage is a button; clicking it opens, one member at a time, **Promote**, **Demote** (one step, to the role next to theirs; the target role is in the button's accessible name) and **Kick** (with a confirmation), only what the viewer's role allows: someone of a lower role, promotion only to a role below the viewer's own, and the powers `canPromote` and `canKick` of the viewer's role (the owner role has both). The panel only offers the actions and calls `actions.setRole(memberId, roleId)` or `actions.kick(memberId)`; the host does the work, the server decides, and `update` shows the result. The pure rules are in `data/roles.js` (`abilitiesOver`).

## Custom images

A config may name a custom badge or texture (`custom-dragon`, see `docs/config-v1/README.md`). The config never carries the image: the host passes `data.assets`, a map from each name to a file of the game's own. A name with no entry shows a neutral tile with the first letter (badge) or no texture; a clan whose badge the game no longer allows falls back to another allowed badge.

A URL is used only if it is an `http(s)` address, a path in the game (`/img/a.png`, `./a.png`, `img/a.png`) or an inline PNG/WebP/JPEG/GIF/SVG data URL; anything else (`javascript:`, `//host`, quotes, parentheses, spaces) is ignored (`data/assets.js`). A custom texture is tiled under a translucent layer of the slot's own color, so text over it stays readable.

The badge choice on the create screen is a radio group: one badge is selected and highlighted, only it is reachable with Tab, and the arrow keys move the choice and the focus together.

## Safe by construction

- Every string from the config or the data is written with `textContent` or a text node. `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `DOMParser`, `createContextualFragment` and friends are never used. `noHtmlInjection.test.js` renders hostile strings in every config and data field on all four screens with spies on those APIs, and scans the source for them.
- The stylesheet is a constant. The theme reaches it only through `--sk-*` custom properties built in `theme/theme.js`: colors must match `#RRGGBB`, fonts and textures are looked up by id (an unknown value falls back to a default), numbers are clamped. No config text becomes CSS.
- `dom/h.js` only sets attributes from a short allow-list (no `on*`, `href`, `src`, `style`). The one `<img>` the panel draws (a custom badge) is made by `dom/image.js`, which sets `src` only after `safeAssetUrl` accepts it.
- Fonts are **not** loaded by the panel (a Shadow DOM cannot host `@font-face`). `googleFontsHref(config)` returns the Google Fonts URL for the two families, built only from the curated list; the host page adds the link.

## Contract tests

`contract.test.js` fails when the package's font, badge and texture lists, or its label defaults, drift from `docs/config-v1/config.v1.schema.json`. The tests render the shared fixtures `docs/config-v1/examples/valid/*.json`.

## Using it from clan-sdk

`@clan/ui` is a workspace package of this repo (`npm install` links it into `node_modules/@clan/ui`). clan-sdk is a separate repo, so it needs the package by path, git subpath or a published copy; when it does, delete `src/ui/renderers/placeholder-chat.js` there and mount this renderer in the launcher instead, so there is one renderer, not two. This ticket does not touch clan-sdk.
