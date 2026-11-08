import { allowedBadges } from '../data/badges.js';
import { descriptionMax, maxMembers } from '../data/limits.js';
import { h } from '../dom/h.js';
import { badgeTile } from './badge.js';
import { button } from './button.js';

const NAME_MIN = 3;
const NAME_MAX = 20;
const TAG_MAX = 4;

const field = (label, control) => h('label', { class: 'sk-field' }, [h('span', { class: 'sk-label', text: label }), control]);

/**
 * The badge choice is a radio group: exactly one badge is selected, only that one is highlighted and
 * reachable with Tab, and the arrow keys move the choice (and the focus) to the next badge.
 */
function badgePicker({ badges, picked, assets, ui, act }) {
  const choose = (badge) => {
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
              choose(badges[(index + step + badges.length) % badges.length]);
            },
          },
        },
        [badgeTile(badge, { assets })],
      ),
    ),
  );
}

/** Create: badge, name, tag and description. The form keeps its values while the panel repaints. */
export function createScreen({ config, L, ui, act, assets }) {
  const badges = allowedBadges(config);
  const showTags = config?.clan?.tags === true;
  const max = maxMembers(config);
  const picked = badges.find((badge) => badge.id === ui.form.badge) ?? badges[0];

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
      h('span', { class: 'sk-label', text: 'Badge · pick one' }),
      badgePicker({ badges, picked, assets, ui, act }),
      badges.length === 0 ? h('span', { class: 'sk-label', text: 'No badges enabled · the tag initial is used instead' }) : null,
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
