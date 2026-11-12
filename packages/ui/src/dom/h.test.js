import { describe, expect, it } from 'vitest';

import { h, icon } from './h.js';

describe('h', () => {
  it('sets text with textContent so markup stays text', () => {
    const element = h('span', { text: '<b>bold</b>' });

    expect(element.textContent).toBe('<b>bold</b>');
    expect(element.children).toHaveLength(0);
  });

  it('adds string children as text nodes and skips empty ones', () => {
    const element = h('p', {}, ['a ', null, false, h('i', { text: 'b' }), ' <c>']);

    expect(element.childNodes).toHaveLength(3);
    expect(element.textContent).toBe('a b <c>');
  });

  it.each(['onclick', 'onerror', 'href', 'src', 'style', 'srcdoc', 'formaction', 'class'])('rejects the "%s" attribute', (name) => {
    expect(() => h('div', { attrs: { [name]: 'x' } })).toThrow(`Attribute "${name}" is not allowed`);
  });

  it('writes states as strings and plain booleans as present or absent', () => {
    const element = h('button', { attrs: { 'aria-pressed': false, 'data-mine': true, disabled: true, maxlength: 5, type: null } });

    expect(element).toHaveAttribute('aria-pressed', 'false');
    expect(element).toHaveAttribute('data-mine', 'true');
    expect(element).toBeDisabled();
    expect(element).toHaveAttribute('maxlength', '5');
    expect(element).not.toHaveAttribute('type');
    expect(h('button', { attrs: { disabled: false } })).not.toBeDisabled();
  });

  it('sets CSS custom properties and listeners', () => {
    let clicks = 0;
    const element = h('button', { vars: { '--sk-brand': '#FFFFFF' }, on: { click: () => (clicks += 1) } });

    element.click();

    expect(element.style.getPropertyValue('--sk-brand')).toBe('#FFFFFF');
    expect(clicks).toBe(1);
  });
});

describe('icon', () => {
  it('draws a hidden svg from constant path data', () => {
    const svg = icon('leave', 16);

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg.querySelectorAll('path')).toHaveLength(3);
  });
});
