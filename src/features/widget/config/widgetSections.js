// The editor's two tab sets and which parts of the config each tab edits. `prefixes` route a
// server error path to the tab that shows it (the most specific prefix wins, so `/theme/frame/corners`
// goes to General while the rest of `/theme/frame` goes to Panel); '' is the document root (the "one tab
// on" rule). A Style tab's `view` is the preview view where its parts can be seen: opening the tab
// takes the preview there (config/widgetPreview.js).
export const STYLE_TABS = [
  {
    id: 'general',
    label: 'General',
    view: 'home',
    prefixes: ['/theme/mode', '/theme/colors', '/theme/fonts', '/theme/frame/corners', '/theme/textures', '/theme/components'],
  },
  {
    id: 'panel',
    label: 'Panel',
    view: 'home',
    prefixes: ['/theme/frame', '/theme/panel', '/theme/textures/panel', '/theme/textures/content'],
  },
  {
    id: 'messages',
    label: 'Messages',
    view: 'home',
    prefixes: ['/chat/layout', '/theme/components/bubbleMine', '/theme/components/bubbleTheirs', '/theme/textures/bubble'],
  },
  {
    id: 'buttons',
    label: 'Buttons',
    view: 'home',
    prefixes: ['/theme/buttons', '/theme/components/button', '/theme/components/buttonSecondary', '/theme/textures/button'],
  },
  { id: 'tabs', label: 'Tabs', view: 'home', prefixes: ['/theme/components/tab', '/theme/components/tabSelected'] },
  { id: 'lists', label: 'Lists', view: 'members', prefixes: ['/theme/components/row'] },
];

export const LAYOUT_TABS = [
  { id: 'layout', label: 'Layout', prefixes: ['', '/layout', '/friends'] },
  { id: 'clan', label: 'Clan', prefixes: ['/clan'] },
  { id: 'chat', label: 'Chat', prefixes: ['/chat'] },
  { id: 'texts', label: 'Texts', prefixes: ['/texts'] },
];

export const WIDGET_SECTIONS = [...STYLE_TABS, ...LAYOUT_TABS];
