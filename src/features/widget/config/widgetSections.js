// The editor's two tab sets and which parts of the config each tab edits. `prefixes` route a
// server error path to the tab that shows it; '' is the document root (the "one tab on" rule).
// A path goes to the first tab that claims it, so `/chat/layout` (shown under Shape) is listed
// before the Chat tab's `/chat`.
export const STYLE_TABS = [
  { id: 'colors', label: 'Colors', prefixes: ['/theme/mode', '/theme/colors'] },
  { id: 'type', label: 'Type', prefixes: ['/theme/fonts'] },
  { id: 'shape', label: 'Shape', prefixes: ['/theme/frame', '/theme/buttons', '/theme/panel', '/chat/layout'] },
  { id: 'textures', label: 'Textures', prefixes: ['/theme/textures'] },
];

export const LAYOUT_TABS = [
  { id: 'layout', label: 'Layout', prefixes: ['', '/layout', '/friends'] },
  { id: 'clan', label: 'Clan', prefixes: ['/clan'] },
  { id: 'chat', label: 'Chat', prefixes: ['/chat'] },
  { id: 'texts', label: 'Texts', prefixes: ['/texts'] },
];

export const WIDGET_SECTIONS = [...STYLE_TABS, ...LAYOUT_TABS];
