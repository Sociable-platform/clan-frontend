/**
 * The panel's stylesheet. It is a constant: no config value is ever added to it. The theme reaches it
 * only through the `--sk-*` custom properties set on the root element (see theme/theme.js).
 */
export const PANEL_CSS = `
:host { all: initial; display: block; }
.sk-root { position: absolute; inset: 0; pointer-events: none; font-family: var(--sk-font-body); font-size: 13px; color: var(--sk-text); }
.sk-root *, .sk-root *::before, .sk-root *::after { box-sizing: border-box; }
:where(.sk-root button, .sk-root input, .sk-root textarea) { font: inherit; color: inherit; }
:where(.sk-root button) { cursor: pointer; }
.sk-root [hidden] { display: none !important; }
/* Scrollbars in the widget's own colours, not the browser's default light bar on a dark panel. */
.sk-root * { scrollbar-width: thin; scrollbar-color: var(--sk-border) transparent; }

/* Sizes follow the container (percentages), never the window, so the widget always fits the box it is mounted in. */
.sk-dock { position: absolute; bottom: 16px; display: flex; flex-direction: column; gap: 8px; width: 360px; max-width: calc(100% - 32px); max-height: calc(100% - 32px); pointer-events: auto; }
.sk-dock[data-position='bottom-left'] { left: 16px; align-items: flex-start; }
.sk-dock[data-position='bottom-right'] { right: 16px; align-items: flex-end; }

.sk-panel { position: relative; display: flex; flex: 0 1 520px; flex-direction: column; width: 100%; min-height: 0; overflow: hidden;
  background: var(--sk-panel-bg); background-image: var(--sk-tex-panel); backdrop-filter: var(--sk-panel-blur); -webkit-backdrop-filter: var(--sk-panel-blur);
  color: var(--sk-text); border-style: var(--sk-frame-style); border-width: var(--sk-frame-width); border-color: var(--sk-frame-color);
  border-radius: var(--sk-radius); clip-path: var(--sk-frame-clip); }
.sk-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--sk-border); }
.sk-title { flex: 1; margin: 0; font-family: var(--sk-font-head); font-size: 15px; font-weight: 600; }
.sk-status { font-size: 12px; color: var(--sk-muted); }

.sk-tabs { display: flex; gap: 4px; padding: 8px 10px; border-bottom: 1px solid var(--sk-border); }
.sk-tab { display: inline-flex; flex: 1; align-items: center; justify-content: center; gap: 6px; height: 32px; font-size: 13px; font-weight: 500; background: var(--sk-tab-bg, transparent); color: var(--sk-tab-fg, var(--sk-muted));
  border-style: var(--sk-tab-border-style, none); border-width: var(--sk-tab-border-width, 0); border-color: var(--sk-tab-border-color, transparent); border-radius: var(--sk-tab-radius, var(--sk-radius-sm)); }
.sk-tab[aria-selected='true'] { background: var(--sk-tab-on-bg, var(--sk-brand)); color: var(--sk-tab-on-fg, var(--sk-on-brand));
  border-style: var(--sk-tab-on-border-style, var(--sk-tab-border-style, none)); border-width: var(--sk-tab-on-border-width, var(--sk-tab-border-width, 0)); border-color: var(--sk-tab-on-border-color, var(--sk-tab-border-color, transparent));
  border-radius: var(--sk-tab-on-radius, var(--sk-tab-radius, var(--sk-radius-sm))); }

.sk-tab-group { position: relative; display: flex; flex: 1; }
.sk-tab-group .sk-tab { padding-right: 26px; }
.sk-tab-search { position: absolute; top: 4px; right: 4px; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; background: transparent; border: 0; border-radius: 50%;
  color: var(--sk-tab-fg, var(--sk-muted)); opacity: 0.85; }
.sk-tab-group[data-selected='true'] .sk-tab-search { color: var(--sk-tab-on-fg, var(--sk-on-brand)); }
.sk-tab-search:hover, .sk-tab-search[aria-pressed='true'] { opacity: 1; background: color-mix(in srgb, currentColor 18%, transparent); }
.sk-tab-search:focus-visible { outline: 2px solid var(--sk-brand); outline-offset: 1px; }
.sk-content { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 12px; overflow: auto; background-image: var(--sk-tex-content); }
.sk-spacer { margin-top: auto; }
/* A screen's own title sits in the column of content: it must not stretch to fill the free height the way the header title fills its row. */
.sk-content > .sk-title { flex: none; }

.sk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 12px; font-size: 12px; font-weight: 600;
  border-radius: var(--sk-btn-radius, var(--sk-radius-sm)); border-style: var(--sk-btn-border-style, solid); border-width: var(--sk-btn-border-width); border-color: var(--sk-btn-border-color);
  background: var(--sk-btn-bg); background-image: var(--sk-btn-image); color: var(--sk-btn-fg);
  text-transform: var(--sk-btn-case); letter-spacing: var(--sk-btn-spacing); clip-path: var(--sk-btn-clip); }
.sk-btn:disabled { cursor: default; background: var(--sk-surface2); background-image: none; color: var(--sk-muted); border-width: 0; }
.sk-btn-md { height: 38px; padding: 0 14px; font-size: 13px; }
.sk-btn-lg { height: 40px; padding: 0 14px; font-size: 13px; }
.sk-btn-fill { flex: 1; }
.sk-btn-ghost { background: var(--sk-btn2-bg, transparent); background-image: none; color: var(--sk-btn2-fg, var(--sk-text)); clip-path: none; text-transform: none; letter-spacing: normal; font-weight: 500;
  border-style: var(--sk-btn2-border-style, solid); border-width: var(--sk-btn2-border-width, 1px); border-color: var(--sk-btn2-border-color, var(--sk-border)); border-radius: var(--sk-btn2-radius, var(--sk-radius-sm)); }
.sk-btn-ghost.sk-btn-strong { font-weight: 600; }
.sk-btn-dashed { height: 40px; background: var(--sk-btn2-bg, transparent); background-image: none; color: var(--sk-btn2-fg, var(--sk-text)); clip-path: none; text-transform: none; letter-spacing: normal; font-size: 13px; font-weight: 500;
  border-style: var(--sk-btn2-border-style, dashed); border-width: var(--sk-btn2-border-width, 1px); border-color: var(--sk-btn2-border-color, var(--sk-border)); border-radius: var(--sk-btn2-radius, var(--sk-radius-sm)); }
.sk-btn-danger { background: #E5484D; background-image: none; color: #FFFFFF; border-width: 0; clip-path: none; text-transform: none; letter-spacing: normal; }
.sk-btn-plain { background: transparent; background-image: none; color: var(--sk-text); border-width: 0; clip-path: none; text-transform: none; letter-spacing: normal; padding: 0 8px; }
.sk-btn-icon { width: 32px; padding: 0; background: var(--sk-surface); background-image: none; color: var(--sk-text); border-width: 0; clip-path: none; }
.sk-btn:focus-visible, .sk-tab:focus-visible, .sk-badge-pick:focus-visible { outline: 2px solid var(--sk-brand); outline-offset: 2px; }


.sk-field { display: flex; flex-direction: column; gap: 4px; }
.sk-label { font-size: 12px; color: var(--sk-muted); }
.sk-input { width: 100%; height: 38px; padding: 0 10px; font-size: 13px; background: var(--sk-surface); color: var(--sk-text); border: 1px solid transparent; border-radius: var(--sk-radius-sm); }
.sk-input::placeholder { color: var(--sk-muted); }
.sk-input:focus-visible { outline: none; border-color: var(--sk-brand); }
.sk-search-row { display: flex; align-items: center; gap: 8px; }
.sk-search-row > .sk-input { flex: 1; min-width: 0; }
.sk-search-row > .sk-btn { flex: none; white-space: nowrap; }
textarea.sk-input { height: 64px; padding: 10px; resize: none; }
.sk-hint { font-size: 12px; color: var(--sk-muted); }
.sk-meta { display: flex; justify-content: flex-end; gap: 8px; font-size: 11px; color: var(--sk-muted); }

.sk-row { display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--sk-row-bg, var(--sk-surface)); color: var(--sk-row-fg, var(--sk-text));
  border-style: var(--sk-row-border-style, none); border-width: var(--sk-row-border-width, 0); border-color: var(--sk-row-border-color, transparent); border-radius: var(--sk-row-radius, var(--sk-radius-sm)); }
.sk-row-compact { padding: 8px; }
.sk-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.sk-name { font-size: 13px; font-weight: 600; }
.sk-tag { font-family: ui-monospace, 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; color: var(--sk-muted); }
.sk-desc { font-size: 12px; color: var(--sk-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sk-small { font-size: 11px; color: var(--sk-muted); }

.sk-badge { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; font-size: 17px; background: var(--sk-badge-bg); color: var(--sk-badge-fg); border-radius: var(--sk-badge-shape); }
.sk-badge-sm { width: 36px; height: 36px; font-size: 16px; }
.sk-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.sk-badge-name { display: flex; align-items: center; gap: 8px; }
.sk-badge-name .sk-input { flex: 1; min-width: 0; }
.sk-badge-trigger { flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 3px; background: var(--sk-row-bg, var(--sk-surface)); border: 1px solid var(--sk-border); border-radius: var(--sk-row-radius, var(--sk-radius-sm)); }
.sk-badge-trigger:hover { background: var(--sk-surface2); border-color: var(--sk-brand); }
.sk-badge-trigger:focus-visible { outline: 2px solid var(--sk-brand); outline-offset: 2px; }
.sk-badge-static { flex-shrink: 0; display: flex; padding: 3px; }
.sk-dialog-backdrop { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0, 0, 0, 0.55); }
.sk-dialog { display: flex; flex-direction: column; gap: 12px; width: 100%; max-height: 100%; overflow-y: auto; padding: 14px; background: var(--sk-surface); color: var(--sk-text); border: 1px solid var(--sk-border); border-radius: var(--sk-radius-sm); }
.sk-badge-pick { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 2px; background: transparent; border: 2px solid transparent; border-radius: 12px; }
.sk-badge-pick[aria-checked='true'] { border-color: var(--sk-brand); }
.sk-badge-image { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.sk-badge { overflow: hidden; }
.sk-badge-pick .sk-badge { width: 34px; height: 34px; font-size: 15px; }

.sk-card { display: flex; flex-direction: column; gap: 10px; padding: 8px 10px; background: var(--sk-row-bg, var(--sk-surface)); color: var(--sk-row-fg, var(--sk-text));
  border-style: var(--sk-row-border-style, none); border-width: var(--sk-row-border-width, 0); border-color: var(--sk-row-border-color, transparent); border-radius: var(--sk-row-radius, var(--sk-radius-sm)); }
.sk-card-head { display: flex; align-items: center; gap: 10px; }
.sk-card-title { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sk-card-text { font-size: 13px; line-height: 1.45; }
.sk-icon { flex-shrink: 0; }
.sk-chevron[data-open='true'] { transform: rotate(180deg); }
/* The clan header row is one button: it fills the card's top edge so the whole row can be tapped. */
.sk-card-toggle { width: calc(100% + 20px); margin: -8px -10px; padding: 8px 10px; font: inherit; color: inherit; text-align: left; background: none; border: 0; border-radius: inherit; cursor: pointer; }
.sk-card-toggle:hover { background: var(--sk-surface2); }
.sk-card-toggle:focus-visible { outline: 2px solid var(--sk-brand); outline-offset: -2px; }
.sk-info-hint { display: inline-flex; flex-shrink: 0; align-items: center; padding: 0 8px; }
.sk-actions { display: flex; gap: 8px; }
.sk-confirm { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: var(--sk-radius-sm); background: var(--sk-bg); border: 1px solid var(--sk-border); }
.sk-confirm-title { font-size: 13px; font-weight: 600; }

.sk-bar { display: flex; align-items: center; gap: 8px; }
.sk-bar .sk-title { font-size: 15px; }
.sk-avatar-lg { position: relative; width: 32px; height: 32px; }
.sk-presence { position: absolute; right: -1px; bottom: -1px; width: 10px; height: 10px; border: 2px solid var(--sk-bg); border-radius: 50%; background: #6B7080; }
.sk-presence[data-online='true'] { background: #3DD68C; }
.sk-friend { display: flex; flex-direction: column; gap: 6px; }
.sk-friend-row { display: flex; align-items: center; gap: 10px; padding: 6px 2px; }
.sk-friend-select { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 0; text-align: left; background: none; border: 0; border-radius: var(--sk-radius-sm); }
.sk-friend-select:hover .sk-friend-name { text-decoration: underline; }
.sk-friend-select:focus-visible { outline: 2px solid var(--sk-brand); outline-offset: 2px; }
.sk-friend-name { font-size: 13px; font-weight: 500; }
/* A friend request: one row, with Accept (the brand colour) and Decline (quiet, red on hover) as small rectangles on the right. */
.sk-request { padding: 8px 10px; }
.sk-request .sk-friend-name { font-weight: 600; }
.sk-request-actions { display: flex; flex-shrink: 0; gap: 6px; }
.sk-btn-accept, .sk-btn-decline { height: 28px; padding: 0 10px; border-radius: var(--sk-radius-sm); background-image: none; clip-path: none; text-transform: none; letter-spacing: normal; }
.sk-btn-accept { background: var(--sk-brand); color: var(--sk-on-brand); border-width: 0; }
.sk-btn-accept:hover { filter: brightness(1.08); }
.sk-btn-decline { background: transparent; color: var(--sk-muted); border: 1px solid var(--sk-border); }
.sk-btn-decline:hover { color: #E5484D; border-color: rgba(229, 72, 77, 0.5); background: rgba(229, 72, 77, 0.12); }
/* A player found by the search: picture and name on the left, Add friend or Cancel on the right, the same width either way. */
.sk-player .sk-btn { flex-shrink: 0; min-width: 96px; }
.sk-section { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--sk-muted); }
.sk-collapse { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 4px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--sk-muted); background: none; border: 0; }
.sk-collapse:hover { color: var(--sk-text); }
.sk-collapse:focus-visible { outline: 2px solid var(--sk-brand); outline-offset: 2px; }
.sk-collapse .sk-icon { transition: transform 0.15s; }
.sk-collapse[aria-expanded='true'] .sk-icon { transform: rotate(180deg); }
.sk-blocked-list { display: flex; flex-direction: column; gap: 6px; }
/* Unread news: a count (friend requests, direct messages) or a small dot (clan chat) in the game's brand colour, so
   it looks part of the widget rather than an alarm. On the selected tab, already filled with the brand colour,
   the badge swaps colours with the tab so it stays visible. The digits are centred on their own height:
   text-box trims the line to cap height and baseline, so the number sits in the middle whatever the font. */
.sk-badge-count { display: inline-flex; flex: none; align-items: center; justify-content: center; box-sizing: border-box; min-width: 18px; height: 18px; padding: 0 5px;
  font-size: 11px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: 0; text-transform: none; text-box: trim-both cap alphabetic;
  color: var(--sk-on-brand); background: var(--sk-brand); border-radius: 999px; }
.sk-badge-dot { flex: none; width: 6px; height: 6px; background: var(--sk-brand); border-radius: 50%; }
.sk-tab[aria-selected='true'] .sk-badge-count { color: var(--sk-tab-on-bg, var(--sk-brand)); background: var(--sk-tab-on-fg, var(--sk-on-brand)); }
.sk-tab[aria-selected='true'] .sk-badge-dot { background: var(--sk-tab-on-fg, var(--sk-on-brand)); }
.sk-sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.sk-convo[data-unread='true'] .sk-friend-name { font-weight: 700; }
.sk-convo[data-unread='true'] .sk-desc { color: var(--sk-text); font-weight: 600; }
/* The line above the first message the player had not read when the conversation opened: a quiet grey pill, like a chat app's date chip. */
.sk-new-line { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 500; color: var(--sk-muted); }
.sk-new-line span { padding: 2px 10px; background: var(--sk-surface2); border-radius: 999px; }
.sk-new-line::before, .sk-new-line::after { content: ''; flex: 1; height: 1px; background: var(--sk-border); }

/* Chat tab: the conversation list, one full-width row per friend (picture, name, last message). */
.sk-convo-list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.sk-convo { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 6px; text-align: left; color: var(--sk-text); background: none; border: 0; border-bottom: 1px solid var(--sk-border); border-radius: 0; }
.sk-convo-list li:last-child .sk-convo { border-bottom: 0; }
.sk-convo:hover { background: var(--sk-surface2); }
.sk-convo:focus-visible { outline: 2px solid var(--sk-brand); outline-offset: -2px; }
.sk-bar-divided { padding-bottom: 8px; border-bottom: 1px solid var(--sk-border); }
.sk-avatar { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; font-size: 12px; font-weight: 600; border-radius: 50%; background: var(--sk-surface2); }
.sk-role { padding: 3px 8px; font-size: 11px; font-weight: 600; border-radius: 999px; background: var(--sk-surface2); color: var(--sk-text); }
.sk-role[data-top='true'] { background: var(--sk-brand); color: var(--sk-on-brand); }
.sk-row-button { width: 100%; text-align: left; }
.sk-row-button:hover { background: var(--sk-surface2); }
.sk-row-button:focus-visible { outline: 2px solid var(--sk-brand); outline-offset: 2px; }
.sk-row-button[aria-expanded='true'] { border-radius: var(--sk-row-radius, var(--sk-radius-sm)) var(--sk-row-radius, var(--sk-radius-sm)) 0 0; box-shadow: inset 0 -2px 0 var(--sk-brand); }
.sk-member { display: flex; flex-direction: column; }
.sk-member-panel { display: flex; flex-direction: column; gap: 8px; padding: 8px; background: var(--sk-row-bg, var(--sk-surface)); border-radius: 0 0 var(--sk-row-radius, var(--sk-radius-sm)) var(--sk-row-radius, var(--sk-radius-sm)); }
.sk-actions-wrap { flex-wrap: wrap; }
/* Member panel: the friend line on top, the role line under a thin rule, Kick pushed to the right in red. */
.sk-friend-state { display: flex; align-items: center; gap: 6px; min-height: 32px; padding-left: 4px; font-size: 12px; color: var(--sk-muted); }
.sk-member-panel > .sk-btn { flex: none; }
.sk-member-roles { display: flex; align-items: center; gap: 8px; }
.sk-member-panel > * + .sk-member-roles { padding-top: 8px; border-top: 1px solid var(--sk-border); }
.sk-member-roles .sk-btn-danger-text { margin-left: auto; }
.sk-btn-danger-text { background: transparent; background-image: none; color: #E5484D; border-width: 0; clip-path: none; text-transform: none; letter-spacing: normal; padding: 0 8px; }
.sk-btn-danger-text:hover { background: rgba(229, 72, 77, 0.12); }

/* Only the messages scroll: what is above them (the conversation's name, the clan card) and the message box
   below stay where they are. The list takes the room that is left and never gets shorter than a few messages;
   in a box too short even for that, the whole content scrolls as before. Scrolled to the end, the newest
   message keeps a little room under it instead of touching the message box. */
.sk-chat { position: relative; display: flex; flex: 1 1 0; flex-direction: column; gap: 10px; min-height: 120px; padding-right: 4px; padding-bottom: 12px; overflow-y: auto; }
.sk-chat > * { flex: none; }
.sk-msg { display: flex; flex-direction: column; gap: 2px; }
/* Bubbles of one group sit close together (3px); a new group keeps the list's full gap. */
.sk-msg[data-group-start='false'] { margin-top: -7px; }
.sk-msg[data-mine='true'] { align-items: flex-end; }
.sk-msg[data-mine='false'] { align-items: flex-start; }
.sk-bubble { max-width: 80%; padding: 8px 10px; font-size: 13px; overflow-wrap: anywhere; background: var(--sk-bubble-theirs-bg, var(--sk-surface)); background-image: var(--sk-tex-bubble-theirs); color: var(--sk-bubble-theirs-fg, var(--sk-text));
  border-style: var(--sk-bubble-theirs-border-style, none); border-width: var(--sk-bubble-theirs-border-width, 0); border-color: var(--sk-bubble-theirs-border-color, transparent); border-radius: var(--sk-bubble-theirs-radius, var(--sk-radius-sm)); }
.sk-msg[data-mine='true'] .sk-bubble { background: var(--sk-bubble-mine-bg, var(--sk-brand)); background-image: var(--sk-tex-bubble-mine); color: var(--sk-bubble-mine-fg, var(--sk-on-brand));
  border-style: var(--sk-bubble-mine-border-style, none); border-width: var(--sk-bubble-mine-border-width, 0); border-color: var(--sk-bubble-mine-border-color, transparent); border-radius: var(--sk-bubble-mine-radius, var(--sk-radius-sm)); }
.sk-log { padding: 1px 2px; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
.sk-log-name { font-weight: 600; color: var(--sk-muted); }
/* Message times: under the last bubble of a group, and at the start of every log line. Small and muted. */
.sk-msg-time { padding: 0 2px; font-size: 11px; color: var(--sk-muted); font-variant-numeric: tabular-nums; }
.sk-log-time { font-size: 11px; color: var(--sk-muted); font-variant-numeric: tabular-nums; }
.sk-log[data-mine='true'] .sk-log-name { color: var(--sk-name-mine); }
.sk-composer { display: flex; gap: 8px; }
/* The character counter sits under the message box, not against it. */
.sk-composer + .sk-meta { margin-top: 8px; }
`;
