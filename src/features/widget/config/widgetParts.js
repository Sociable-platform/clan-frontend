/**
 * The parts of the widget the developer can style one by one (`theme.components`, docs/config-v1/README.md,
 * "Component styles"). The keys are the schema's; each part has its own border, corner radius and colors.
 */
export const PARTS = [
  { key: 'bubbleMine', label: 'My messages', description: 'The chat bubbles the player sends', view: 'home' },
  { key: 'bubbleTheirs', label: "Other players' messages", description: 'The chat bubbles the player receives', view: 'home' },
  { key: 'button', label: 'Main buttons', description: 'Join, Send and Create', view: 'home' },
  { key: 'buttonSecondary', label: 'Outline buttons', description: 'Cancel, View members, Leave and Chat', view: 'friends' },
  { key: 'tab', label: 'Tab bar', description: 'The tabs under the title', view: 'home' },
  { key: 'tabSelected', label: 'Selected tab', description: 'The tab that is open', view: 'home' },
  { key: 'row', label: 'Rows and cards', description: 'Clans, members, requests and the clan header', view: 'members' },
];
// `view` is the preview view (config/widgetPreview.js) where the part can be seen: switching a part on, or
// pressing "Show in preview", takes the preview there, because most parts are on only some screens.

// The corner radius each global corner style gives parts, and the theme's border color per mode; a part starts from these.
export const CORNER_RADIUS = { square: 0, soft: 8, round: 16, chamfer: 0 };
export const PART_RADIUS_INSET = 2;
export const THEME_BORDER = { dark: '#2C3B3E', light: '#D9DBD5' };

export const PART_MESSAGES = {
  CONTRAST_LABEL: 'Text on background',
};
