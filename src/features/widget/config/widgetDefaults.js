// What a game's widget looks like before anyone edits it: the Studio design's starting state.
// The server's default for a game with no draft is still the bare `{ "schemaVersion": 1 }`
// (platform widget service, "placeholder until W1"), so the editor fills what is missing from
// here. `game_id` is not part of it: it comes from the game being edited.
export const DEFAULT_WIDGET_CONFIG = {
  schemaVersion: 1,
  theme: {
    mode: 'dark',
    fonts: {
      heading: { family: 'Unbounded', source: 'google' },
      body: { family: 'Inter', source: 'google' },
    },
    frame: { style: 'solid', width: 1, color: '#2C3B3E', corners: 'soft' },
    buttons: { style: 'filled', case: 'normal' },
    panel: { opacity: 1, blur: false },
    colors: {
      brand: '#80EAFF',
      background: '#141D1F',
      surface: '#1B2628',
      text: '#E8ECED',
      muted: '#B7C5C8',
    },
    textures: {},
  },
  layout: { position: 'bottom-right', startCollapsed: true },
  friends: { enabled: true },
  clan: {
    enabled: true,
    maxMembers: 30,
    tags: true,
    descriptionMax: 140,
    badges: { source: 'developer', allowed: ['star', 'diamond', 'peak', 'spark', 'moon', 'cross'] },
    screens: {
      discover: { enabled: true },
      create: { enabled: true },
      home: { enabled: true, header: 'compact', showStats: true },
      members: { enabled: true },
    },
  },
  chat: {
    enabled: true,
    layout: 'bubbles',
    directMessages: true,
    clanChat: true,
    maxMessageLength: 300,
    slowModeSeconds: 2,
    profanityFilter: true,
    historyLimit: 50,
  },
  texts: { terms: { clan: 'Clan', clans: 'Clans' }, labels: {} },
};
