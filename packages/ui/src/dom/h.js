const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Only these attributes can be set. Event handler attributes, `href`, `src`, `style` and the like
 * are not on the list, so a value that ends up in an attribute cannot start script or load anything.
 */
const ATTRIBUTE_PATTERN = /^(aria-[a-z]+|role|tabindex|type|disabled|placeholder|maxlength|value|autocomplete|id|for|name|rows|datetime|title|data-[a-z-]+)$/;

function setAttribute(element, name, value) {
  if (!ATTRIBUTE_PATTERN.test(name)) throw new Error(`Attribute "${name}" is not allowed`);
  if (value == null) return;
  const isState = name.startsWith('aria-') || name.startsWith('data-');
  if (typeof value === 'boolean' && !isState) {
    if (value) element.setAttribute(name, '');
    return;
  }
  element.setAttribute(name, String(value));
}

/**
 * Build an element. Text is always set through `textContent`, never parsed as HTML.
 * props: class, text, attrs, vars (CSS custom properties), on (event listeners).
 */
export function h(tag, props = {}, children = []) {
  const element = document.createElement(tag);
  if (props.class) element.className = props.class;
  if (props.text != null) element.textContent = String(props.text);
  Object.entries(props.attrs ?? {}).forEach(([name, value]) => setAttribute(element, name, value));
  Object.entries(props.vars ?? {}).forEach(([name, value]) => element.style.setProperty(name, String(value)));
  Object.entries(props.on ?? {}).forEach(([type, listener]) => element.addEventListener(type, listener));
  element.append(...children.filter((child) => child != null && child !== false));
  return element;
}

const ICON_PATHS = {
  chevronDown: ['M6 9l6 6 6-6'],
  chevronUp: ['M18 15l-6-6-6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  check: ['M20 6L9 17l-5-5'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  back: ['M15 18l-6-6 6-6'],
  leave: ['M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3', 'M10 17l-5-5 5-5', 'M5 12h11'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
  chat: ['M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.7 8.7 0 0 1-3.8-.9L3 20.5l1.6-4.8a8.1 8.1 0 0 1-1.1-4.2A8.4 8.4 0 0 1 12.5 3.2a8.4 8.4 0 0 1 8.5 8.3z'],
};

/** A small decorative icon. The path data is a constant, never taken from the config. */
export function icon(name, size = 14) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'sk-icon');
  ICON_PATHS[name].forEach((d) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  });
  return svg;
}
