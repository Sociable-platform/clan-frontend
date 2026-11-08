// The editor's sections and which parts of the config each one edits. `prefixes` route a
// server error path to the section that shows it; '' is the document root (the tab rule).
export const WIDGET_SECTIONS = [
  { id: 'style', label: 'Style', prefixes: ['/theme'] },
  { id: 'layout', label: 'Layout', prefixes: ['', '/layout', '/friends'] },
  { id: 'clan', label: 'Clan', prefixes: ['/clan'] },
  { id: 'chat', label: 'Chat', prefixes: ['/chat'] },
  { id: 'texts', label: 'Texts', prefixes: ['/texts'] },
];

// Read-only view of the whole document; it has no fields, so no error path points here.
export const ADVANCED_SECTION = { id: 'advanced', label: 'Advanced' };

export const DEFAULT_SECTION_ID = WIDGET_SECTIONS[0].id;
