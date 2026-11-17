# The widget in your page

The widget draws itself inside a container you give it. Your game decides where that container
sits, when it is visible and what opens it. This page covers showing and hiding it, removing it,
and the events it sends your page.

## Your game owns the button

The widget has no launcher of its own. It draws the panel, always open, inside your container;
your own button shows and hides that container:

```html
<button id="social-toggle" type="button">Social</button>
<div id="social-widget" hidden></div>
```

```js
const container = document.querySelector('#social-widget');

document.querySelector('#social-toggle').addEventListener('click', () => {
  container.hidden = !container.hidden;
});

const widget = sdk.mountExperience({ container });
```

This way the button looks like the rest of your game, and you choose where it goes.

## Hide it or remove it

There are two ways to close the widget, and they behave differently:

| | Hide the container | `widget.destroy()` |
| --- | --- | --- |
| What it does | The widget stays loaded, out of sight | The widget is removed from the page |
| Opening again | Instant, where the player left off | Loads again from the start |
| New messages while closed | Still counted, so your button can show a badge | Not counted |
| Use it when | The player closes the panel | The player signs out, or leaves the part of your game that has the widget |

For an ordinary open and close, hide the container (`hidden` or `display: none`). Nothing is
marked as read while it is hidden or while the browser tab is in the background.

`destroy()` is safe to call more than once, and you can mount again afterwards.

## Wait until it is ready

`mountExperience` returns at once and loads your published widget in the background. `ready` is
a promise that settles when it has:

```js
const widget = sdk.mountExperience({ container });

widget.ready
  .then(() => console.log('Widget loaded'))
  .catch((error) => console.error('Widget failed to load', error));
```

If your published widget cannot be loaded, the widget still appears, with a built-in default
look, so players are not left with an empty box.

## When you publish a new version

Players who load the page after you publish get the new version. Players who already have the
widget open are told a new version exists and pick it up by themselves a moment later; you do
not need to do anything. To check for a new version yourself:

```js
await widget.refreshConfig();
```

If that fails, the widget keeps the version it had.

## Events

The widget tells your page what happens by sending events from the container. Listen on the
container you mounted into:

```js
container.addEventListener('clan-sdk:joined', (event) => {
  console.log('Joined clan', event.detail.clanId);
});
```

| Event | When | `event.detail` |
| --- | --- | --- |
| `clan-sdk:unread` | The number of unread things changed, also when it drops to 0 | `{ total, requests, clan, direct }` |
| `clan-sdk:joined` | The player joined a clan | `{ clanId }` |
| `clan-sdk:created` | The player created a clan | `{ clanId }` |
| `clan-sdk:left` | The player left their clan | `{ clanId }` |
| `clan-sdk:member-role-changed` | A member was promoted or demoted | `{ clanId, playerId, role }` |
| `clan-sdk:member-kicked` | A member was removed from the clan | `{ clanId, playerId }` |
| `clan-sdk:tab` | The player switched tab | `{ tab }` |
| `clan-sdk:navigate` | The player moved to another screen | `{ screen, previousScreen }` |
| `clan-sdk:config-updated` | A new published version is available | `{ version }` |
| `clan-sdk:suspended` | The game was switched off; the widget has removed itself | `{ code }` |

The events are for your page to react to, for example to give a reward for joining a clan. The
widget has already done the action itself; you do not need to confirm anything.

Do not trust these events for anything that matters, such as granting items: they run in the
player's browser and can be faked. Check on your server instead.

### A badge on your button

`clan-sdk:unread` is what you need to show a count on your own button while the panel is closed:

```js
const button = document.querySelector('#social-toggle');

container.addEventListener('clan-sdk:unread', (event) => {
  const { total } = event.detail;
  button.dataset.badge = total > 0 ? (total > 9 ? '9+' : String(total)) : '';
});
```

`total` is everything unread. `requests` is the friend requests the player received, `clan` the
unread clan messages, and `direct` the unread direct messages per friend. The counts are kept on
our side, so they are right after a reload and on another device.

For the badge to keep counting while the panel is closed, hide the container; do not destroy
the widget.

### If the game is suspended

When an administrator switches a game off, the widget removes itself and sends
`clan-sdk:suspended`. Hide your button when that happens, and do not mount the widget again in a
loop: it will work again on a later page load once the game is resumed.

## Styling and layout

- The widget keeps its own styles apart from your page, so your CSS does not change how it
  looks, and its CSS does not leak into your game. Its look comes from what you publish in Studio.
- Give the container a position and a size that suit your game. The widget fills it.
- The container needs no stylesheet from us.
