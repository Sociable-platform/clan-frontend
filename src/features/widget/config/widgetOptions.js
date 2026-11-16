// Allowed values for every choice in the config (docs/config-v1/config.v1.schema.json).
const option = (value, label) => ({ value, label });
const fromValues = (values) => values.map((value) => option(value, value));

const FONT_FAMILIES_BY_GROUP = [
  ['Sans', ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito', 'Rubik', 'Space Grotesk', 'Kanit', 'Titillium Web', 'Quicksand']],
  ['Display', ['Unbounded', 'Oswald', 'Bebas Neue', 'Anton', 'Teko', 'Righteous', 'Bungee', 'Black Ops One']],
  ['Sci-fi', ['Orbitron', 'Exo 2', 'Rajdhani', 'Audiowide', 'Chakra Petch', 'Saira', 'Russo One']],
  ['Pixel', ['Press Start 2P', 'VT323', 'Silkscreen', 'Pixelify Sans']],
  ['Fantasy', ['Cinzel', 'MedievalSharp', 'Uncial Antiqua', 'Pirata One', 'Metamorphous']],
  ['Cartoon', ['Fredoka', 'Baloo 2', 'Luckiest Guy', 'Bangers', 'Comfortaa']],
  ['Mono', ['JetBrains Mono', 'Share Tech Mono']],
];

export const FONT_GROUPS = FONT_FAMILIES_BY_GROUP.map(([label, families]) => ({
  label,
  options: fromValues(families),
}));

export const FONT_CATEGORIES = FONT_FAMILIES_BY_GROUP.map(([label]) => label);
export const FONT_LIST = FONT_FAMILIES_BY_GROUP.flatMap(([category, families]) =>
  families.map((family) => ({ family, category })),
);

// The colours a mode starts from; the editor swaps them when the mode changes unless the
// developer already picked their own.
export const THEME_PALETTES = {
  dark: { background: '#141D1F', surface: '#1B2628', text: '#E8ECED', muted: '#B7C5C8' },
  light: { background: '#FFFFFF', surface: '#F2F3F1', text: '#000000', muted: '#5B5D56' },
};

export const THEME_MODES = [option('dark', 'Dark'), option('light', 'Light')];
export const FRAME_STYLES = [
  option('none', 'None'),
  option('solid', 'Solid'),
  option('double', 'Double'),
  option('bevel', 'Bevel'),
  option('inset', 'Inset'),
];
export const CORNERS = [option('square', 'Square'), option('soft', 'Soft'), option('round', 'Round'), option('chamfer', 'Chamfer')];
export const BUTTON_STYLES = [option('filled', 'Filled'), option('outline', 'Outline'), option('bevel', 'Bevel')];
export const CHAT_LAYOUT_DESCRIPTIONS = { bubbles: 'Messenger style', log: 'Name: text, MMO style' };
export const POSITIONS = [option('bottom-left', 'Bottom left'), option('bottom-right', 'Bottom right')];
export const CHAT_LAYOUTS = [option('bubbles', 'Bubbles'), option('log', 'Log')];

// `none` is not a config value: it means "no texture in this slot" and removes the slot.
export const NO_TEXTURE = 'none';
export const TEXTURES = [
  option(NO_TEXTURE, 'None'),
  option('tex_stone', 'Stone'),
  option('tex_grid', 'Sci-fi grid'),
  option('tex_wood', 'Wood grain'),
  option('tex_carbon', 'Carbon'),
];
export const TEXTURE_SLOTS = [
  { key: 'panel', label: 'Panel frame' },
  { key: 'content', label: 'Content area' },
  { key: 'button', label: 'Buttons' },
  { key: 'bubble', label: 'Chat bubbles' },
];

export const BADGES = [
  { id: 'star', label: 'Star', glyph: '★' },
  { id: 'diamond', label: 'Diamond', glyph: '◆' },
  { id: 'peak', label: 'Peak', glyph: '▲' },
  { id: 'spark', label: 'Spark', glyph: '✦' },
  { id: 'moon', label: 'Moon', glyph: '☾' },
  { id: 'cross', label: 'Cross', glyph: '✚' },
];

export const TABS = [
  { key: 'friends', label: 'Friends', description: 'Search, requests, online list' },
  { key: 'clan', label: 'Clan', description: 'Discover, create, home, members' },
  { key: 'chat', label: 'Chat', description: 'Direct messages between friends' },
];

// `audience` says who sees the screen: the Studio design numbers them in this order.
export const CLAN_SCREENS = [
  { key: 'home', label: 'Home & chat', audience: 'In a clan', description: 'Compact header, clan chat' },
  { key: 'members', label: 'Members', audience: 'In a clan', description: 'Roster with roles' },
  { key: 'discover', label: 'Discover', audience: 'No clan', description: 'Search and join open clans' },
  { key: 'create', label: 'Create', audience: 'No clan', description: 'Badge, name, description' },
];

// Label keys config v1 still accepts but the widget no longer draws, so the form does not offer them:
// `launcher` was the text of the built-in launcher button, which is gone (the game owns that button);
// `info` was the "Info" word on the clan header, which now opens from the whole row with only an arrow.
export const RETIRED_LABEL_KEYS = ['launcher', 'info'];

// Default wording. {Clan}, {clan}, {Clans}, {clans} follow the clan term the developer sets.
export const LABEL_GROUPS = [
  {
    title: 'Panel',
    labels: [
      { key: 'panelTitle', name: 'Panel title', fallback: 'Social' },
    ],
  },
  {
    title: 'Tabs',
    labels: [
      { key: 'tabFriends', name: 'Friends tab', fallback: 'Friends' },
      { key: 'tabClan', name: 'Clan tab', fallback: '{Clan}' },
      { key: 'tabChat', name: 'Chat tab', fallback: 'Chat' },
    ],
  },
  {
    title: 'Buttons',
    labels: [
      { key: 'accept', name: 'Accept request', fallback: 'Accept' },
      // Read out by screen readers on the chat icon of each friend (the icon has no visible text).
      { key: 'chatBtn', name: 'Chat with friend', fallback: 'Chat' },
      { key: 'join', name: 'Join', fallback: 'Join' },
      { key: 'full', name: 'Full', fallback: 'Full' },
      { key: 'createCta', name: 'Create link', fallback: '+ Create a {clan}' },
      { key: 'createBtn', name: 'Create button', fallback: 'Create {clan}' },
      { key: 'cancel', name: 'Cancel', fallback: 'Cancel' },
      { key: 'viewMembers', name: 'View members', fallback: 'View members' },
      { key: 'leave', name: 'Leave', fallback: 'Leave {clan}' },
      { key: 'send', name: 'Send', fallback: 'Send' },
    ],
  },
  {
    title: 'Titles and hints',
    labels: [
      { key: 'createTitle', name: 'Create screen title', fallback: 'Create a {clan}' },
      { key: 'membersTitle', name: 'Members title', fallback: 'Members' },
      { key: 'searchPlayers', name: 'Player search hint', fallback: 'Search players…' },
      { key: 'searchClans', name: 'Clan search hint', fallback: 'Search {clans}…' },
      { key: 'messagePh', name: 'Message box hint', fallback: 'Message…' },
      { key: 'clanChatOff', name: 'Clan chat off notice', fallback: '{Clan} chat is off for this game.' },
    ],
  },
  {
    // Lines in the clan chat when the members change. {player} is the player's name, filled in by the widget.
    title: 'Clan chat member lines',
    labels: [
      { key: 'memberJoined', name: 'Player joined', fallback: '{player} joined the {clan}' },
      { key: 'memberLeft', name: 'Player left', fallback: '{player} left the {clan}' },
      { key: 'memberKicked', name: 'Player removed', fallback: '{player} was removed from the {clan}' },
    ],
  },
];

export const DEFAULT_TERMS = { clan: 'Clan', clans: 'Clans' };
