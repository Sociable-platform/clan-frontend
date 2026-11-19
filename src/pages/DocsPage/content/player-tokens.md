# Player tokens

A player token tells us who is playing. Your game server asks for one with your API key, hands it
to the page, and the SDK sends it with every request. This page explains why it works this way
and how to get it right.

## Why two secrets

Your players have an account with you, not with us. We never see their passwords and have no
login screen. Instead, your server vouches for them:

| | API key | Player token |
| --- | --- | --- |
| Who holds it | Your game server only | The player's browser |
| What it can do | Get a token for **any** player of your game | Act as **one** player |
| How long it lasts | Until you revoke it | One hour |
| If it leaks | Revoke it in Studio and create a new one | It stops working within the hour |

That is the reason the API key must never reach the page: anyone who reads it could sign in as
any of your players. The token is safe to give to the browser because it is one player's, and
short-lived.

Only a game's **owner** can create and revoke its API keys, on the game's **API keys** page in
Studio. If you are a member of the game, ask its owner for a key, passed through your own secrets
store.

## The request

Your server calls the platform:

```http
POST {{PLATFORM_URL}}/api/v1/players/auth
X-API-Key: <your API key>
Content-Type: application/json

{ "externalPlayerId": "u_42", "displayName": "Rashad" }
```

| Field | Rules |
| --- | --- |
| `externalPlayerId` | Your own ID for the player. 1 to 128 characters. |
| `displayName` | The name other players see. 1 to 50 characters, no control characters. |

The game is not in the body: it is always the game the API key belongs to. No other fields are
accepted.

It answers with the token and its lifetime in seconds:

```json
{ "token": "eyJhbGciOiJFZERTQSIs...", "expiresIn": 3600 }
```

## Choosing the player ID

`externalPlayerId` is how we recognise a player from one visit to the next. Their friends, clan
and messages hang on it.

- **Use an ID that never changes**, such as your database's user ID. Do not use an email address
  or a nickname the player can edit: a changed ID is a new player with no friends and no clan.
- **Send the ID your server knows**, taken from the player's session on your side. Never accept
  it from the page, or one player could ask for a token as another.
- **A player is created the first time** you ask for their token. There is nothing to register in
  advance.

## When it fails

| Status | `code` | What to do |
| --- | --- | --- |
| 400 | `invalid_external_player_id`, `invalid_display_name`, `invalid_json` | Fix the body. Check the lengths above, and that you send no extra fields. |
| 401 | `invalid_api_key` | The `X-API-Key` header is missing, or the key is wrong or revoked. Create a new key in Studio. |
| 403 | `game_suspended` | This game was switched off by an administrator. Every key of the game is refused until it is resumed. |
| 403 | `account_suspended` | Your developer account is suspended, and with it all your games. |

When your endpoint cannot get a token, answer the page with an error status. The SDK treats that
as "not signed in" and does not send requests without a token.

## How the SDK uses your endpoint

You give the SDK a function, `getPlayerToken`, that fetches the token from your server:

```js
getPlayerToken: async ({ forceRefresh }) => {
  const response = await fetch(`/api/player-token?forceRefresh=${forceRefresh}`, {
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error('Player authentication failed');
  return (await response.json()).token;
},
```

- It must return the **token string only**, without a `Bearer` prefix.
- The SDK calls it when it first needs a token, and again with `forceRefresh: true` after a
  request was refused as unauthorised. A forced call must return a new token, not a cached one.
- The SDK does not look inside the token and does not save it anywhere that outlives the page.

### Caching, if you want it

Asking for a new token on every call is correct and simple. If you would rather not call the
platform that often, cache the token in the page's memory and reuse it until shortly before it
expires. Pass `expiresIn` through from your server so the page knows when that is, and skip the
cache whenever `forceRefresh` is `true`. Do not keep tokens in `localStorage`.

## When the player signs out or changes

A token belongs to one player, so the widget must not outlive that player's session.

- **Sign out:** remove the widget (`widget.destroy()`), and make your endpoint answer 401.
- **Switching accounts in the same page:** point your token function at the new player, then call
  `sdk.resetPlayerSession()` straight away. It discards what belonged to the previous player and
  starts again with the new one.

## Checklist

- The API key is in your server's secrets, not in the page, the game's code or the repository.
- The player ID comes from your server's session, and never changes for a player.
- Your endpoint requires the player to be signed in to your game.
- Its answer is not cached by the browser (`Cache-Control: no-store`).
- A forced refresh returns a new token.
