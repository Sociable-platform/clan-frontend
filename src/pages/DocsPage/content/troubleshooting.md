# Troubleshooting

What to check when the widget does not behave. Start with your browser's developer tools: the
**Console** tab shows errors from the SDK, and the **Network** tab shows which request failed
and with what status.

## The widget does not appear

| What you see | Cause | What to do |
|---|---|---|
| Nothing at all, no errors | The container is hidden, or has no size | Check that your button removes `hidden`, and that the container has a width and height |
| `ClanSDK is not defined` | The SDK script did not load | Check the script's address, and that it comes before your own script |
| The widget appears with a plain default look | Your published widget could not be loaded | See "404 for `widget-config`" below |
| An error panel inside the widget | A request failed | Open the Network tab and find the request in red |

## Requests that fail

| Request | Status | Cause | What to do |
|---|---|---|---|
| `widget-config` | 404 | The game has no published version, or the Game ID is wrong | Publish the widget in Studio once; compare the Game ID with the one on [Your games](/games) |
| `widget-config` | 403 `game_suspended` | The game or your account was switched off | Contact us |
| Your `/api/player-token` | anything but 200 | Your own server did not return a token | Open that address in the browser while signed in to your game and read its answer |
| `players/auth` (in your server's log) | 401 `invalid_api_key` | The key is missing, wrong or revoked | Check the `X-API-Key` header; create a new key on the game's **API keys** page in Studio (owners only) |
| `players/auth` | 400 | The body is not what we expect | `externalPlayerId` 1 to 128 characters, `displayName` 1 to 50, no other fields |
| Any request to social or realtime | 401 | The player token is missing, expired or not a player token | Your token function must return the token string only, and a fresh one when `forceRefresh` is true |
| Any request | 403 `origin_not_allowed`, or a CORS error in the console | Your game's address is not allowed to call us | See the next section |

## CORS errors and `origin_not_allowed`

Browsers only let a page call another site when that site allows the page's address. We keep a
list of the addresses each game is served from.

If you see a CORS error, or a 403 with `origin_not_allowed`:

1. Find your game's **origin**: the scheme, the host and, if it is not the default, the port.
   For example `https://play.example.com` or `http://localhost:5174`. No path and no trailing
   slash.
2. Send us that origin, for each address your game is served from (production, staging, your
   local machine).

`http://localhost:3000` and `http://127.0.0.1:3000` are different origins, and so are `http://`
and `https://`. The address in the browser's address bar is the one that counts.

Your game server is not affected by this: a server is not a browser, so its call for a player
token works from anywhere.

## Chat problems

The widget shows these to the player. They are the rules you set in Studio doing their job:

| The player sees | Rule | Where to change it |
|---|---|---|
| Send is off for a few seconds after each message | Slow mode | Studio, Chat, **Slow mode** (0 turns it off) |
| A message is refused as too long | Max message length | Studio, Chat, **Max message length** |
| Words replaced with `***` | Profanity filter | Studio, Chat, **Profanity filter** |
| No clan chat, or no direct messages | That kind of chat is off | Studio, Chat |
| "You can't message this player" | One of the two blocked the other | Nothing to change |
| A direct message thread that cannot be written in | The two are no longer friends | They become friends again |

Separately from your settings, a connection may send at most 5 messages in 5 seconds. A player
who keeps going past that is disconnected for a short while. Normal typing never reaches it.

If messages arrive late or not at all for everyone, check your page's Content Security Policy:
it must allow connections to the realtime address over both `https:` and `wss:`.

## Changes in Studio do not show

| Situation | Cause |
|---|---|
| You changed something and players do not see it | Saving is not publishing. Press **Publish** |
| You published and one player still sees the old version | They pick it up within a moment, or on their next page load |
| A clan size or chat limit you lowered still seems to apply | Rules are picked up within about half a minute of publishing |
| A custom badge or texture is missing in your game | The image is not saved with the widget. Your game must serve the file and pass it in the SDK's `assets` option. See [Designing the widget in Studio](/docs/studio) |
| A custom image is missing in Studio's preview on another computer | Images are kept in the browser you imported them in. Import the file again |

## The widget disappears

If the widget removes itself and your page receives `clan-sdk:suspended`, the game was switched
off by an administrator. Hide your button, do not mount the widget again in a loop, and contact
us. When the game is resumed, everything works again on the next page load; nothing is deleted
while a game is suspended.

## A player sees someone else's data

This should never happen, and when it does the cause is almost always the player ID:

- Your endpoint must take the player from **your server's session**, never from the page.
- When a player signs out or another signs in on the same page, remove the widget or call
  `sdk.resetPlayerSession()`. See [Player tokens](/docs/player-tokens).

## Still stuck

Collect these before you write to us, and leave out your API key and any player token:

- your Game ID;
- the address your game is served from;
- the failing request from the Network tab: its address, its status and the `code` in its answer;
- what the Console shows.
