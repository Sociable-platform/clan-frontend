import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { clearToasts, showToast } from '@/shared/notifications';

import { Toaster } from './Toaster';

describe('Toaster', () => {
  afterEach(() => {
    clearToasts();
  });

  it('renders nothing visible while there are no toasts', () => {
    render(<Toaster />);

    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('announces a success toast politely', () => {
    render(<Toaster />);

    act(() => {
      showToast({ message: 'Developer suspended' });
    });

    expect(screen.getByRole('status')).toHaveTextContent('Developer suspended');
  });

  it('announces an error toast as an alert', () => {
    render(<Toaster />);

    act(() => {
      showToast({ message: 'Something broke', tone: 'error' });
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Something broke');
  });

  it('closes a toast with its dismiss button', async () => {
    const user = userEvent.setup();
    render(<Toaster />);
    act(() => {
      showToast({ message: 'Developer resumed' });
    });

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(screen.queryByText('Developer resumed')).not.toBeInTheDocument();
  });
});
