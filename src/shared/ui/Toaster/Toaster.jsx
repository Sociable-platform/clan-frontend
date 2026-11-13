import { dismissToast, useToasts } from '@/shared/notifications';

/**
 * Where toasts appear. Mount once near the root. The region is a polite live region, so a new toast
 * is read out without interrupting; an error toast is an alert instead.
 */
export function Toaster() {
  const toasts = useToasts();

  return (
    <div className="toaster">
      <div role="status" aria-live="polite" aria-label="Notifications" className="toaster-list">
        {toasts
          .filter((toast) => toast.tone !== 'error')
          .map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
      </div>
      <div role="alert" aria-label="Error notifications" className="toaster-list">
        {toasts
          .filter((toast) => toast.tone === 'error')
          .map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
      </div>
    </div>
  );
}

function ToastItem({ toast }) {
  return (
    <div className={`toast toast-${toast.tone}`}>
      <p className="toast-message">{toast.message}</p>
      <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)}>
        <span className="visually-hidden">Dismiss notification</span>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
