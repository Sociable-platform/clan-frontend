// The words of the landing page, kept apart from its layout so they are easy to review and change.

// The strip at the top of the page. Set to null to leave the strip out.
export const ANNOUNCEMENT = {
  label: 'New',
  text: 'restyle your widget and publish. Players see it without a game update.',
};

export const HERO = {
  eyebrow: 'Social layer for games',
  titleStart: 'Clans, friends and chat.',
  titleMarked: 'Ready to embed.',
  lead: 'Design the widget in your browser, publish, and add two lines to your game. We run the backend.',
};

// The try-it block under the hero: a few editor controls and the live widget (HomeDemo).
// `key` is the config section a switch turns on and off; the colours are the brand's own.
export const DEMO = {
  editorEyebrow: 'Studio · widget editor',
  title: 'Change it here',
  gameEyebrow: 'Your game · what players see',
  tabs: [
    { key: 'friends', label: 'Friends', description: 'Search, requests, online list' },
    { key: 'clan', label: 'Clan', description: 'Discover, create, home, members' },
    { key: 'chat', label: 'Chat', description: 'Direct messages between friends' },
  ],
  lastTabHint: 'A widget needs at least one tab, so the last one stays on.',
  colorLabel: 'Brand colour',
  colors: [
    { name: 'Blue', value: '#80EAFF' },
    { name: 'Violet', value: '#9580FF' },
    { name: 'Lime', value: '#D9FF66' },
  ],
  publishNote: 'In Studio you then press Publish, and players load the new version the next time they open the widget.',
};

// What the developer pastes into the game page (step 3). Shortened: the full options are in the SDK's README.
export const SDK_SNIPPET = `<script src="…/v1/clan-sdk.js"></script>
ClanSDK.init({ gameId, … })
       .mountExperience({ container })`;

export const STEPS = [
  {
    id: 'register',
    title: 'Register your game',
    text: 'Create an account, add your game and get its API key. The key stays on your game server.',
  },
  {
    id: 'design',
    title: 'Design the widget',
    text: 'Pick tabs, colours, clan size, roles and badges. The preview is drawn by the same code your players load.',
  },
  {
    id: 'embed',
    title: 'Add the SDK',
    text: 'Two lines in your game page. Players get clans, friends and chat.',
    snippet: SDK_SNIPPET,
  },
];

export const FEATURES = [
  {
    id: 'clans',
    title: 'Clans',
    text: 'Create, discover and join. Roles you name yourself, with kick and promote permissions per role.',
  },
  {
    id: 'friends',
    title: 'Friends',
    text: 'Search, requests, blocking and an online list, shared across the whole game.',
  },
  {
    id: 'chat',
    title: 'Chat',
    text: 'Clan chat and direct messages in real time, with slow mode and message limits.',
  },
  {
    id: 'publish',
    title: 'Publish without a release',
    text: 'Change the look or switch a tab off, press Publish, and it is live. Roll back to any earlier version.',
  },
  {
    id: 'rules',
    title: 'Rules enforced on the server',
    text: 'Clan size and role permissions come from your published config and are checked by our backend, not the browser.',
  },
  {
    id: 'login',
    title: 'Your players, your login',
    text: 'Players sign in to your game as they do today. Your server exchanges its API key for a player token.',
  },
];

export const NUMBERS = [
  { id: 'features', value: '3', label: 'features: clans, friends, chat' },
  { id: 'lines', value: '2', label: 'lines to embed the SDK' },
  { id: 'updates', value: '0', label: 'game updates to restyle' },
  { id: 'dashboard', value: '1', label: 'dashboard to run it all' },
];

// Section ids, so the header can link to them (#how-it-works, #features).
export const HOME_SECTIONS = { steps: 'how-it-works', features: 'features' };
