import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { TabList, TabPanel } from './TabList';

const TABS = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two', problemCount: 2 },
  { id: 'three', label: 'Three' },
];

function Harness() {
  const [activeId, setActiveId] = useState('one');
  return (
    <>
      <TabList label="Demo" idPrefix="demo" tabs={TABS} activeId={activeId} onChange={setActiveId} />
      <TabPanel idPrefix="demo" id={activeId}>
        Content of {activeId}
      </TabPanel>
    </>
  );
}

describe('TabList', () => {
  it('marks the active tab and links it to its panel', () => {
    render(<Harness />);

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: 'One' })).toHaveTextContent('Content of one');
  });

  it('switches tab on click', async () => {
    render(<Harness />);

    await userEvent.setup().click(screen.getByRole('tab', { name: /Two/ }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Content of two');
  });

  it('moves with the arrow keys, wrapping around, and with Home and End', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    screen.getByRole('tab', { name: 'One' }).focus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Content of three');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
  });

  it('keeps only the active tab in the tab order', () => {
    render(<Harness />);

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('tabindex', '-1');
  });

  it('says how many problems a tab holds', () => {
    render(<Harness />);

    expect(screen.getByRole('tab', { name: 'Two, 2 problems' })).toBeInTheDocument();
  });
});
