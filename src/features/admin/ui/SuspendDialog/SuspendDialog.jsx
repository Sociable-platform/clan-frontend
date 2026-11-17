import { useState } from 'react';

import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { SelectField } from '@/shared/ui/SelectField';
import { TextAreaField } from '@/shared/ui/TextAreaField';

import { ADMIN_LIMITS, REASON_OPTIONS } from '../../config/adminConfig';

const COPY = {
  developer: {
    title: () => 'Suspend this developer?',
    description:
      'Every game this developer owns stops being served and their dashboard becomes read-only. Nothing is deleted, and you can resume at any time.',
    confirmLabel: 'Suspend developer',
  },
  game: {
    title: (name) => `Suspend ${name}?`,
    description:
      "Only this game stops being served. The developer's other games keep working. Nothing is deleted, and you can resume at any time.",
    confirmLabel: 'Suspend game',
  },
};

// Radix focuses Cancel first. Here the first thing to do is pick a reason, so start there.
function focusReasonSelect(event) {
  const select = event.currentTarget.querySelector('.field-select');
  if (select) {
    event.preventDefault();
    select.focus();
  }
}

// Mounted only while open, so the reason and note start empty every time the dialog opens.
function SuspendDialogForm({ kind, subjectName, developerEmail, isPending, errorMessage, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const copy = COPY[kind];

  const handleConfirm = () => onConfirm({ reason, note });
  const handleOpenChange = (isOpen) => {
    if (!isOpen) onCancel();
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={handleOpenChange}
      title={copy.title(subjectName)}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      isPending={isPending}
      confirmDisabled={reason === ''}
      errorMessage={errorMessage}
      onOpenAutoFocus={focusReasonSelect}
      onConfirm={handleConfirm}
    >
      <p className="dialog-target">
        Developer: <strong>{developerEmail}</strong>
      </p>
      <SelectField label="Reason" value={reason} onValueChange={setReason} options={REASON_OPTIONS} />
      <TextAreaField
        label="Internal note (optional)"
        aside={`${note.length}/${ADMIN_LIMITS.NOTE_MAX}`}
        rows={3}
        maxLength={ADMIN_LIMITS.NOTE_MAX}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <p className="item-meta">The developer sees the reason. Only admins see the note.</p>
    </ConfirmDialog>
  );
}

/**
 * Confirmation for suspending a developer (`kind="developer"`) or one game (`kind="game"`). The
 * admin must pick a reason before Suspend is enabled; the note is optional. The developer's email
 * is shown so it is clear whose access is about to stop. `onConfirm({ reason, note })`.
 */
export function SuspendDialog({ open, ...formProps }) {
  if (!open) return null;
  return <SuspendDialogForm {...formProps} />;
}
