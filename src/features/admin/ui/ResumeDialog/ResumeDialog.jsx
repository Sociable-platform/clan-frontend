import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

const COPY = {
  developer: {
    title: () => 'Resume this developer?',
    description:
      "Their games are served again, except any game that was suspended on its own: those stay off until you resume them.",
    confirmLabel: 'Resume developer',
  },
  game: {
    title: (name) => `Resume ${name}?`,
    description: "This game is served again, as long as its developer's account is active.",
    confirmLabel: 'Resume game',
  },
};

/** Confirmation for resuming a developer or one game. No reason is needed; the audit log keeps the earlier one. */
export function ResumeDialog({ open, kind, subjectName, developerEmail, isPending, errorMessage, onCancel, onConfirm }) {
  const copy = COPY[kind] ?? COPY.developer;
  const handleOpenChange = (isOpen) => {
    if (!isOpen) onCancel();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={copy.title(subjectName)}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      confirmTone="primary"
      isPending={isPending}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    >
      <p className="dialog-target">
        Developer: <strong>{developerEmail}</strong>
      </p>
    </ConfirmDialog>
  );
}
