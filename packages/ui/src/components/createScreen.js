import { allowedBadges, selectedBadge } from '../data/badges.js';
import { descriptionMax, maxMembers } from '../data/limits.js';
import { h } from '../dom/h.js';
import { badgeTile } from './badge.js';
import { BADGE_TRIGGER_KEY } from './badgeDialog.js';
import { button } from './button.js';

const NAME_MIN = 3;
const NAME_MAX = 20;
const TAG_MAX = 4;

const field = (label, control) => h('label', { class: 'sk-field' }, [h('span', { class: 'sk-label', text: label }), control]);

/**
 * The current badge and a button that opens the badge popup (`badgeDialog`, drawn by the panel). With one
 * badge allowed there is nothing to choose, so it is shown without the button.
 */
function badgeField({ badges, picked, assets, ui, act }) {
  if (badges.length === 0) return h('span', { class: 'sk-label', text: 'No badges enabled · the tag initial is used instead' });
  const name = picked.custom ? picked.name : `${picked.name} badge`;
  if (badges.length === 1) return h('div', { class: 'sk-badge-current' }, [badgeTile(picked, { assets }), h('span', { class: 'sk-name', text: picked.name })]);

  return h(
    'button',
    {
      class: 'sk-badge-trigger',
      attrs: { type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': ui.badgePickerOpen === true, 'aria-label': `Badge: ${name}. Change`, 'data-key': BADGE_TRIGGER_KEY },
      on: {
        click: () => {
          ui.badgePickerOpen = true;
          ui.focusKey = `badge-${picked.id}`;
          act.repaint();
        },
      },
    },
    [badgeTile(picked, { assets }), h('span', { class: 'sk-name sk-row-main', text: picked.name }), h('span', { class: 'sk-tag', text: 'Change' })],
  );
}

/** Create: badge (chosen in a popup), name, tag and description. The form keeps its values while the panel repaints. */
export function createScreen({ config, L, ui, act, assets }) {
  const badges = allowedBadges(config);
  const showTags = config?.clan?.tags === true;
  const max = maxMembers(config);
  const picked = selectedBadge(config, ui.form.badge);

  const isNameValid = () => ui.form.name.trim().length >= NAME_MIN;
  const submit = button({
    text: L.createBtn,
    size: 'lg',
    fill: true,
    disabled: !isNameValid(),
    onClick: () => act.create({ name: ui.form.name.trim(), tag: showTags ? ui.form.tag : '', description: ui.form.description.trim(), badge: picked?.id ?? null }),
  });

  const text = (key, props) => {
    const element = h(props.tag ?? 'input', {
      class: `sk-input${props.mono ? ' sk-input-mono' : ''}`,
      attrs: { type: props.tag ? null : 'text', maxlength: props.maxlength, 'data-key': key, autocomplete: 'off' },
      on: {
        input: (event) => {
          ui.form[key] = props.upper ? event.target.value.toUpperCase() : event.target.value;
          if (props.upper) event.target.value = ui.form[key];
          submit.disabled = !isNameValid();
        },
      },
    });
    element.value = ui.form[key];
    return element;
  };

  return [
    h('div', { class: 'sk-title', text: L.createTitle }),
    h('div', { class: 'sk-field' }, [
      h('span', { class: 'sk-label', text: 'Badge' }),
      badgeField({ badges, picked, assets, ui, act }),
    ]),
    field(`Name · ${NAME_MIN}–${NAME_MAX} characters`, text('name', { maxlength: NAME_MAX })),
    showTags ? field('Tag · shown above your player', text('tag', { maxlength: TAG_MAX, mono: true, upper: true })) : null,
    field('Description', text('description', { tag: 'textarea', maxlength: descriptionMax(config) })),
    h('div', { class: 'sk-label', text: `Up to ${max} members · open to join` }),
    h('div', { class: 'sk-spacer sk-actions' }, [
      button({ text: L.cancel, variant: 'ghost', size: 'lg', onClick: () => act.navigate('discover') }),
      submit,
    ]),
  ];
}
