import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { InfoTip } from './InfoTip';

function setup() {
  const user = userEvent.setup();
  render(
    <>
      <InfoTip label="About the preview">The clans here are made up.</InfoTip>
      <button type="button">Somewhere else</button>
    </>,
  );
  const button = screen.getByRole('button', { name: 'About the preview' });
  return { user, button, text: () => screen.getByText('The clans here are made up.') };
}

describe('InfoTip', () => {
  it('starts closed, with the explanation hidden', () => {
    const { button, text } = setup();

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(text()).not.toBeVisible();
  });

  it('opens on click and closes on a second click', async () => {
    const { user, button, text } = setup();

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(text()).toBeVisible();

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(text()).not.toBeVisible();
  });

  it('closes on Escape and gives focus back to the button', async () => {
    const { user, button, text } = setup();

    await user.click(button);
    await user.keyboard('{Escape}');

    expect(text()).not.toBeVisible();
    expect(button).toHaveFocus();
  });

  it('closes when something else on the page is clicked', async () => {
    const { user, button, text } = setup();

    await user.click(button);
    await user.click(screen.getByRole('button', { name: 'Somewhere else' }));

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(text()).not.toBeVisible();
  });

  it('points the button at the text it shows', () => {
    const { button, text } = setup();

    expect(text().closest('.info-tip-bubble')).toHaveAttribute('id', button.getAttribute('aria-controls'));
  });
});
