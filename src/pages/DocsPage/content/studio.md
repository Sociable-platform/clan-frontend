# Designing the widget in Studio

Studio is where you decide what your players get and how it looks. You change the widget in your
browser, see the result as you go, and publish when you are happy. Your game does not need an
update for any of it.

Open it from [Your games](/games): press **Customize widget** on your game's row.

## The editor at a glance

| Area | Where | What it is for |
| --- | --- | --- |
| Settings | Left | What the widget does: its position, clans, chat and wording |
| Preview | Middle | The widget as your players will see it |
| Style | Right | How it looks: colours, fonts, corners, and each part of the widget |
| Top bar | Above | Undo and redo, whether your changes are saved, and **Publish** |

On a narrow screen the three areas stack under each other.

## Draft and published

You always edit a **draft**. Players never see the draft.

- **Saved** means your draft is stored on our side. It happens by itself, 3 seconds after your
  last change. The top bar says Saved, Saving, Unsaved changes, or Could not save with a Retry
  button.
- **Published** means players see it. Nothing reaches players until you press **Publish**.

Next to the save state, a chip tells you where you stand: **Not published yet**, **Published**
with its version number, or **Draft · unpublished changes** when the draft differs from what
players have.

So you can change things freely, close the page and come back tomorrow: your draft is kept, and
your players still have the last version you published.

## Settings: what the widget does

**Layout** sets which tabs the widget has (Friends, Clan, Chat) and which side the panel sits
on.

**Clan** covers clans:

- which clan screens exist (discover, create, home, members);
- **Max members**, from 2 to 200;
- how long a clan's description may be;
- the **roles** a member can hold, and what each may do (below);
- the **badges** a clan can choose from, up to 12.

**Chat** covers messaging:

- **Direct messages** between friends and **Clan chat**, each on or off;
- **Max message length**, from 20 to 1,000 characters;
- **Slow mode**: how many seconds a player waits between messages, 0 to 30. 0 is off;
- **Profanity filter**: replaces banned words with `***`;
- **History shown**: how many past messages load when a chat opens, up to 50.

**Texts** lets you rename things to fit your game, for example "Guild" in place of "Clan", and
change the labels on buttons and titles.

These are rules, not only looks. Clan size, roles and the chat limits are checked on our
servers, so a player cannot get around them by changing the page.

### Clan roles

In the Clan tab, the Roles list holds the titles a member can have, the strongest at the top.
You can have 2 to 12.

- **Drag** a role to reorder it, or use Move up and Move down.
- **Click** a role to rename it and to set two permissions: whether it can **kick** the roles
  below it, and whether it can **promote and demote** them.
- The lowest role is what a new member gets. The top role belongs to the clan's creator. These
  two stay at the ends.

A role can only act on roles below it.

## Style: how it looks

**General** changes everything at once: dark or light, the five colours, the corner style and the
fonts.

Then there is one tab per part of the widget: **Panel**, **Messages**, **Buttons**, **Tabs** and
**Lists**. Opening one takes the preview to a screen where that part is visible.

Inside those tabs, single parts (your chat bubbles, other players' bubbles, the main button, the
selected tab, rows and cards) follow the theme until you switch on **Customize** for them. A
customized part has its own background, text colour, border and corner radius. Switch it off and
it follows the theme again.

When you set a text colour on a background, the editor shows the contrast between them, so you
can see whether the text will be readable.

### Your own badges and textures

You can import your own images:

- **Badges** in the Clan tab: PNG, WebP or SVG, up to 64 KB each.
- **Textures** from any texture picker (Panel, Messages, Buttons): tileable PNG or WebP, up to
  256 KB each.

One thing to know: **the image itself stays in your browser.** It is there so the preview can
draw it. What is saved with your widget is only a name made from the file name, for example
`Dragon Badge.png` becomes `custom-dragon-badge`.

So your game has to supply the files. Studio shows the exact `assets` option to pass to the SDK,
with the names in use and a Copy button; you point each name at a file your game serves:

```js
const widget = sdk.mountExperience({
  container,
  assets: {
    badges: { 'custom-dragon-badge': '/images/dragon-badge.png' },
  },
});
```

If you open Studio on another computer, an imported image shows as "Not imported in this
browser". The name is still in your widget; import the file again to see it in the preview.

## The preview

The preview is drawn by the same code your players load, over a made-up game with sample
players. Nothing in it is sent anywhere.

- The three chips above it, **Friends**, **Clan** and **Chat**, pick what is on show. The Clan
  chip opens a list of the clan screens: Home and Members for a player in a clan, Discover and
  Create for a player without one.
- **Viewing as** picks which clan role is looking, so you can check what each role is allowed to
  do. On Members, click someone to see Promote, Demote and Kick as that role would.
- The widget's own buttons work: join a clan, accept a request, send a message. Sending also
  starts your slow mode, so you see the wait your players will get.

## Undo and redo

The two arrows in the top bar step back and forward through your changes, as do **Ctrl+Z** and
**Ctrl+Shift+Z** (or **Ctrl+Y**). Up to 50 steps are kept, for as long as the page stays open;
reloading the page starts a new list.

## Publishing

Press **Publish** in the top bar. The button shows the version number it will create.

- Your draft is saved first, then published. If it cannot be saved, nothing is published, and
  the editor says why.
- Players who load your game afterwards get the new version. Players who already have the
  widget open pick it up a moment later, without reloading.

A widget's configuration can be up to 64 KB. **Show config** displays it, with its size against
that limit.

## Version history and rolling back

**Show history** lists every version you published, newest first. The newest is marked Live.

- **Preview** shows an older version in the preview, read-only. **Back to draft** returns to your
  draft.
- **Roll back** publishes an older version again, as a new version on top. Nothing is deleted,
  so you can roll back a rollback.

After a rollback, your draft becomes that version too, so the editor shows what is live. Undo
brings your previous draft back if you still want it.

## Working with a team

A game can have several developers. On [Your games](/games), each game shows your role: **Owner** or
**Member**.

- **Owners** manage the game: its API keys, its team, and everything below. A game always has at
  least one owner.
- **Members** work on the game: they customize the widget and publish it, and they can see the team.
  They do not see the API keys.

Press **Team** on a game's row to open its team.

- **Invite a developer** by email address (owners only). They accept once they are signed in with an
  account that has that address, and someone with no account registers first. An invitation waits
  for 7 days, and you can cancel it before then.
- **Make owner** hands the game to another member: they become the owner and you become a member.
  **Remove** takes a developer off the game at once.
- **Leave game** is on every team page. The only owner cannot leave: make someone else the owner first.

If you are invited to a game, you see it in **Invitations** in the account menu, and a note on
[Your games](/games). Accept to join as a member, or decline.
