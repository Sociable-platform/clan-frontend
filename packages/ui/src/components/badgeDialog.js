import { allowedBadges, selectedBadge } from '../data/badges.js';
import { h } from '../dom/h.js';
import { badgeTile } from './badge.js';
import { button } from './button.js';

/** Where focus goes when the popup closes: the button that opened it. */
export const BADGE_TRIGGER_KEY = 'badge-trigger';

/**
 * The badge choice is a radio group: exactly one badge is selected, only that one is highlighted and
 * reachable with Tab, and the arrow keys move the choice (and the focus) to the next badge. Clicking
 * (or pressing Enter or Space on) a badge picks it and closes the popup.
 */
function badgeGrid({ badges, picked, assets, ui, act }) {
  const choose = (badge) => {
    ui.form.badge = badge.id;
    ui.badgePickerOpen = false;
    ui.focusKey = BADGE_TRIGGER_KEY;
    act.repaint();
  };
  const move = (badge) => {
    ui.form.badge = badge.id;
    ui.focusKey = `badge-${badge.id}`;
    act.repaint();
  };

  return h(
    'div',
    { class: 'sk-badges', attrs: { role: 'radiogroup', 'aria-label': 'Badge' } },
    badges.map((badge, index) =>
      h(
        'button',
        {
          class: 'sk-badge-pick',
          attrs: {
            type: 'button',
            role: 'radio',
            'aria-checked': badge.id === picked?.id,
            'aria-label': badge.custom ? badge.name : `${badge.name} badge`,
            tabindex: badge.id === picked?.id ? 0 : -1,
            'data-key': `badge-${badge.id}`,
          },
          on: {
            click: () => choose(badge),
            keydown: (event) => {
              const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
              if (!step) return;
              event.preventDefault();
              move(badges[(index + step + badges.length) % badges.length]);
            },
          },
        },
        [badgeTile(badge, { assets })],
      ),
    ),
  );
}

/**
 * The "choose a badge" popup of the create screen: a modal dialog laid over the whole panel. Escape,
 * Close and a click on the backdrop close it; Tab stays inside it; focus goes back to the button that opened it.
 */
export function badgeDialog({ config, ui, act, assets }) {
  const badges = allowedBadges(config);
  const picked = selectedBadge(config, ui.form.badge);

  const close = () => {
    ui.badgePickerOpen = false;
    ui.focusKey = BADGE_TRIGGER_KEY;
    act.repaint();
  };

  const dialog = h(
    'div',
    { class: 'sk-dialog', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Choose a badge' } },
    [
      h('div', { class: 'sk-bar' }, [h('span', { class: 'sk-title', text: 'Choose a badge' })]),
      badgeGrid({ badges, picked, assets, ui, act }),
      button({ text: 'Close', variant: 'ghost', size: 'lg', fill: true, onClick: close }),
    ],
  );

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const stops = [...dialog.querySelectorAll('button')].filter((element) => element.tabIndex >= 0 && !element.disabled);
    if (stops.length === 0) return;
    const root = dialog.getRootNode();
    const index = stops.indexOf(root.activeElement);
    const next = event.shiftKey ? (index <= 0 ? stops.length - 1 : index - 1) : (index === stops.length - 1 ? 0 : index + 1);
    event.preventDefault();
    stops[next].focus();
  });

  const backdrop = h('div', { class: 'sk-dialog-backdrop' }, [dialog]);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  return backdrop;
}
