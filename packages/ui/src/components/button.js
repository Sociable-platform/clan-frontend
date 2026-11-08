import { h } from '../dom/h.js';

/** A button. `variant` picks the look: primary (the game's button style) or ghost, dashed, danger, plain. */
export function button({ text, variant = 'primary', size = 'sm', fill = false, strong = false, onClick, disabled = false, attrs = {}, children = [] }) {
  const classes = ['sk-btn', size !== 'sm' && `sk-btn-${size}`, variant !== 'primary' && `sk-btn-${variant}`, fill && 'sk-btn-fill', strong && 'sk-btn-strong']
    .filter(Boolean)
    .join(' ');
  return h('button', { class: classes, text, attrs: { type: 'button', disabled, ...attrs }, on: onClick ? { click: onClick } : {} }, children);
}
