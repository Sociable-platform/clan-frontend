import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('says what the product is in the main heading', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Clans, friends and chat. Ready to embed.');
    expect(screen.getByText(/We run the backend/)).toBeInTheDocument();
  });

  it('explains how it works in three numbered steps, the last with the SDK lines', () => {
    render(<HomePage />);

    const section = screen.getByRole('region', { name: 'Three steps to social.' });
    const steps = within(section).getAllByRole('listitem');

    expect(steps.map((step) => within(step).getByRole('heading').textContent)).toEqual([
      'Register your game',
      'Design the widget',
      'Add the SDK',
    ]);
    expect(steps[0]).toHaveTextContent('Step 01');
    expect(steps[2]).toHaveTextContent('ClanSDK.init');
  });

  it('lists the six things the product includes', () => {
    render(<HomePage />);

    const section = screen.getByRole('region', { name: 'Everything a clan needs.' });

    expect(within(section).getAllByRole('listitem')).toHaveLength(6);
    expect(within(section).getByRole('heading', { name: 'Publish without a release' })).toBeInTheDocument();
  });

  it('gives the two sections the ids the header links point at', () => {
    render(<HomePage />);

    expect(screen.getByRole('region', { name: 'Three steps to social.' })).toHaveAttribute('id', 'how-it-works');
    expect(screen.getByRole('region', { name: 'Everything a clan needs.' })).toHaveAttribute('id', 'features');
  });

  it('shows the four numbers with what each one counts', () => {
    render(<HomePage />);

    const numbers = screen.getByRole('region', { name: 'In numbers' });

    expect(within(numbers).getAllByRole('term')).toHaveLength(4);
    expect(within(numbers).getByText('lines to embed the SDK')).toBeInTheDocument();
  });
});
