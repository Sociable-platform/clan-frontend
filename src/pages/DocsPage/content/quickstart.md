# Quickstart

Add clans, friends and chat to your game. You design the widget in your browser, add the SDK to
your game's page, and give it one endpoint on your own server. We run the rest.

It takes four steps:

1. Register your game and create an API key.
2. Design the widget and publish it.
3. Add a player-token endpoint to your game server.
4. Add the SDK to your game's page.

## Before you start

You need:

- a game that runs in a web page;
- a server of your own behind that game, where your players are already signed in;
- an account here. [Create one](/register) if you have not yet.

## 1. Register your game and create an API key

1. Open [Your games](/games) and press **Register game**. Give it your game's name.
2. Copy the **Game ID** from the game's row. The SDK needs it.
3. Press **API keys** on that row, then **Create API key**.
4. Copy the key and store it with your server's other secrets. It is shown only this once.

The API key is a secret. It lets a server speak for any of your players, so it belongs on your
game server and never in the page, the game's code or a public repository. If it leaks, revoke it
on the same screen and create a new one.

## 2. Design the widget and publish it

1. On your game's row, press **Customize widget**.
2. Choose what your players get (friends, clans, chat) and how it looks. The preview is drawn by
   the same code your players load.
3. Press **Publish**.

Players only ever see a published version. Until you publish once, the SDK has nothing to show.
You can change the widget and publish again at any time: players get the new version on their
next page load, with no update to your game.

## 3. Add a player-token endpoint to your game server

Your players are signed in to your game, not to us. So your server vouches for each player: it
sends us your API key and who the player is, and gets back a short-lived **player token** to hand
to the page.

Request, from your server:

```http
POST {{PLATFORM_URL}}/api/v1/players/auth
X-API-Key: <your API key>
Content-Type: application/json

{ "externalPlayerId": "u_42", "displayName": "Rashad" }
```

| Field | What it is |
| --- | --- |
| `externalPlayerId` | Your own ID for the player, 1 to 128 characters. Use one that never changes. |
| `displayName` | The name other players see, 1 to 50 characters. |

Answer:

```json
{ "token": "eyJhbGciOiJFZERTQSIs...", "expiresIn": 3600 }
```

The token is valid for one hour (`expiresIn` is in seconds). A player is created the first time
you ask for their token, so there is nothing to register in advance.

Here is the endpoint in Node.js with Express. `req.user` stands for however your server knows
who is signed in:

```js
// GET /api/player-token: called by the game's page, answered by your server.
app.get('/api/player-token', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'not signed in' });

  const response = await fetch('{{PLATFORM_URL}}/api/v1/players/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.SOCIABLE_API_KEY, // from your server's secrets
    },
    body: JSON.stringify({
      externalPlayerId: String(req.user.id),
      displayName: req.user.name,
    }),
  });

  if (!response.ok) return res.status(502).json({ error: 'could not get a player token' });

  const { token } = await response.json();
  res.set('Cache-Control', 'no-store').json({ token });
});
```

## 4. Add the SDK to your game's page

The SDK is hosted: one script tag, nothing to install or build. The widget draws inside a
container you give it, and **your game owns the button** that shows and hides that container.

```html
<button id="social-toggle" type="button">Social</button>
<div id="social-widget" hidden></div>

<script src="{{SDK_URL}}/v1/clan-sdk.js"></script>
<script>
  const container = document.querySelector('#social-widget');

  // Your own button opens and closes the widget.
  document.querySelector('#social-toggle').addEventListener('click', () => {
    container.hidden = !container.hidden;
  });

  const sdk = ClanSDK.init({
    gameId: '<your Game ID>',
    platformUrl: '{{PLATFORM_URL}}',
    socialUrl: '{{SOCIAL_URL}}',
    realtimeUrl: '{{REALTIME_URL}}',
    // Asks your server (step 3) for the signed-in player's token.
    getPlayerToken: async ({ forceRefresh }) => {
      const response = await fetch(`/api/player-token?forceRefresh=${forceRefresh}`, {
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('Player authentication failed');
      return (await response.json()).token;
    },
  });

  const widget = sdk.mountExperience({ container });
  widget.ready.catch(console.error);
</script>
```

Replace `<your Game ID>` with the ID from step 1. `getPlayerToken` must return the token string
only, without a `Bearer` prefix. The SDK calls it when it needs a token, and again with
`forceRefresh: true` if a token is refused, so your endpoint should always return a fresh one.

## Check that it works

Open your game's page signed in as a player and press your button. You should see the widget you
published, with that player's name.

If nothing appears, open the browser's console:

| What you see | What it means |
| --- | --- |
| `Player authentication failed` | Your `/api/player-token` endpoint did not answer with a token. Open it in the browser while signed in to see its answer. |
| A 401 from `players/auth` in your server's log | The API key is wrong or was revoked. Create a new key. |
| A 404 for `widget-config` | The widget has not been published yet (step 2), or the Game ID is not the one from step 1. |
| A CORS error | The address your game is served from is not allowed to call the services yet. Send us that address. |

## Next

- [Player tokens](/docs/player-tokens): choosing player IDs, errors, signing out.
- [The widget in your page](/docs/widget): showing and hiding it, a badge on your button, events.
- [Designing the widget in Studio](/docs/studio): settings, style, publishing and rolling back.

Change the widget in Studio and publish again whenever you like. Your players see it on their
next page load.
